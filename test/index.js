//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var PresetParameters = require('../lib/preset_parameters.js');
var p = new PresetParameters('x');
var DIP = require('../lib/bkc-dip.js');
var ZoneAdjParameters = require('../lib/zone_adjustment_parameters.js');
var assert = require('assert');

var p = new PresetParameters('x');

describe('bkc-dip-mqtt', function () {
  describe('#format2()', function () {
    it('should format 0 to 00', function() {
      assert.equal(bkcDipMqtt.format2('0'), '00');
    })
  });

  describe('#splitRespectingQuotes()', function () {
    it('should split on commas when nothing is quoted', function() {
      var result = bkcDipMqtt.splitRespectingQuotes('a,b,c', ',');
      assert.deepEqual(result, ['a', 'b', 'c']);
    });

    it('should preserve commas inside double-quoted strings', function() {
      var result = bkcDipMqtt.splitRespectingQuotes('R,Z1,00=\"Kitchen, Zone\",01=02,02=03', ',');
      assert.deepEqual(result, ['R', 'Z1', '00=\"Kitchen, Zone\"', '01=02', '02=03']);
    });

    it('should handle multiple quoted fields with commas', function() {
      var result = bkcDipMqtt.splitRespectingQuotes('00=\"A, B\",01=\"C, D\",02=EF', ',');
      assert.deepEqual(result, ['00=\"A, B\"', '01=\"C, D\"', '02=EF']);
    });

    it('should handle escaped quotes inside quoted strings', function() {
      // Source (runtime string): 00=\"Zone \\\"A, B\\\"\",01=02
      // The tokenizer treats \\\" as an escaped quote (literal \" in output).
      // The backslash is consumed as an escape character.
      var input = '00=\"Zone \\\"A, B\\\"\",01=02';
      var result = bkcDipMqtt.splitRespectingQuotes(input, ',');
      assert.equal(result[0], '00=\"Zone \"A, B\"\"');
      assert.equal(result[1], '01=02');
    });

    it('should strip semicolon terminator respecting quotes', function() {
      var msg = 'R,Z1,00=\"Zone\",01=02;';
      var parts = bkcDipMqtt.splitRespectingQuotes(msg, ',');
      var last = parts[parts.length - 1];
      var trimmed = bkcDipMqtt.splitRespectingQuotes(last, ';');
      parts[parts.length - 1] = trimmed[0];
      assert.deepEqual(parts, ['R', 'Z1', '00=\"Zone\"', '01=02']);
    });

    it('should handle empty input', function() {
      var result = bkcDipMqtt.splitRespectingQuotes('', ',');
      assert.deepEqual(result, ['']);
    });

    it('should handle sole delimiter', function() {
      var result = bkcDipMqtt.splitRespectingQuotes(',', ',');
      assert.deepEqual(result, ['', '']);
    });
  });

  describe('calculateChecksum', function () {
    it('should produce 01EA for the spec example (00,G,P00;)', function() {
      // Spec page 8: checksum = sum of ASCII chars from after '(' up to and including ';'
      // For message (00,G,P00; 01EA), the checksummed portion is "00,G,P00"
      assert.equal(DIP.calculateChecksum('00,G,P00'), '01EA');
    });

    it('should produce 015E for G,P00 (without receiveId)', function() {
      // sum of "G,P00;" = 71+44+80+48+48+59 = 350 = 0x015E
      assert.equal(DIP.calculateChecksum('G,P00'), '015E');
    });

    it('should return a 4-digit zero-padded uppercase hex string', function() {
      // 'A;' = 65 + 59 = 124 = 0x007C
      var result = DIP.calculateChecksum('A');
      assert.equal(result, '007C');
      assert.equal(result.length, 4);
    });
  });

  describe('PresetParameters', function() {
    describe('#dbVolumeToBk()', function() {
      it('should convert db to hex (nearest 2 dB step)', function() {
        // scale(db) = (db+80)/2, encoded 0x00..0x28 for -80..0 dB
        var data = [{db: '0', bk: '28'}, {db: '-2', bk: '27'}, {db: '-32', bk: '18'}, {db: '-80', bk: '0'}];
        data.forEach(d => {
          assert.equal(p.dbVolumeToBk(d.db, d.bk), d.bk);
        });
      })
    })

    describe('volume percent <-> dB boundary conversion', function() {
      it('maps 0% to -80 dB, 100% to 0 dB, 50% to -40 dB', function() {
        assert.equal(p.percentToDb(0), -80);
        assert.equal(p.percentToDb(100), 0);
        assert.equal(p.percentToDb(50), -40);
      });
      it('snaps percent to the 2 dB grid', function() {
        // 99% -> -0.8 dB -> nearest 2 dB step is 0 dB
        assert.equal(p.percentToDb(99), 0);
        // 96% -> -3.2 dB -> nearest 2 dB step is -4 dB
        assert.equal(p.percentToDb(96), -4);
        // 1% -> -79.2 dB -> nearest 2 dB step is -80 dB
        assert.equal(p.percentToDb(1), -80);
      });
      it('dbToPercent inverts percentToDb', function() {
        [0, 25, 50, 75, 100].forEach(function(pct) {
          var db = p.percentToDb(pct);
          assert.equal(p.dbToPercent(db), pct);
        });
      });
    })

    describe('preset S command format (BKC-DIP spec: S,Pz=nn,id=value)', function() {
      var sent;
      var pp;
      beforeEach(function() {
        sent = [];
        var driver = { send: function(receiveId, cmd) { sent.push(cmd); } };
        pp = new PresetParameters('0', '10', driver, null);
      });
      it('setInput uses Pz=FF with equals separator', function() {
        pp.setInput('06');
        assert.equal(sent[0], 'S,P10=FF,02=06');
      });
      it('setVolumeDb uses Pz=FF with equals separator', function() {
        pp.setVolumeDb('-32');
        assert.equal(sent[0], 'S,P10=FF,01=18');
      });
      it('setPresetParameter uses Pz=FF with equals separator', function() {
        pp.setPresetParameter('05', '0C');
        assert.equal(sent[0], 'S,P10=FF,05=0C');
      });
    })

    describe('#getLoudness()', function() {
      it('should return "off" when EQUALIZATION is 0x00', function() {
        p.data[PresetParameters.EQUALIZATION] = '00';
        assert.equal(p.getLoudness(), 'off');
      });
      it('should return "on" when EQUALIZATION is 0x01', function() {
        p.data[PresetParameters.EQUALIZATION] = '01';
        assert.equal(p.getLoudness(), 'on');
      });
      it('should return "auto" when EQUALIZATION is 0x02', function() {
        p.data[PresetParameters.EQUALIZATION] = '02';
        assert.equal(p.getLoudness(), 'auto');
      });
    });

    describe('#setLoudness()', function() {
      var sentParam, sentValue;
      before(function() {
        p.setPresetParameter = function(param, value) {
          sentParam = param;
          sentValue = value;
        };
      });
      it('should send "0" for off', function() {
        p.setLoudness('off');
        assert.equal(sentValue, '0');
        assert.equal(sentParam, PresetParameters.EQUALIZATION);
      });
      it('should send "1" for on', function() {
        p.setLoudness('on');
        assert.equal(sentValue, '1');
      });
      it('should send "2" for auto', function() {
        p.setLoudness('auto');
        assert.equal(sentValue, '2');
      });
    });
  });

  describe('ZoneAdjParameters', function() {
    var zp;
    var sentCommand;

    beforeEach(function() {
      zp = new ZoneAdjParameters('00', {
        send: function(receiveId, command) {
          sentCommand = { receiveId: receiveId, command: command };
        }
      });
    });

    describe('#getRoomEqBassGain()', function() {
      it('should return null when data is not set', function() {
        assert.equal(zp.getRoomEqBassGain('A'), null);
      });
      it('should return correct dB value', function() {
        zp.data['00'] = '18'; // 0x18 -> 0dB
        assert.equal(zp.getRoomEqBassGain('A'), '0');
        zp.data['00'] = '30'; // 0x30 -> +12dB
        assert.equal(zp.getRoomEqBassGain('A'), '12');
        zp.data['00'] = '00'; // 0x00 -> -12dB
        assert.equal(zp.getRoomEqBassGain('A'), '-12');
        zp.data['00'] = '19'; // 0x19 -> +0.5dB (0.5 dB step)
        assert.equal(zp.getRoomEqBassGain('A'), '0.5');
      });
    });

    describe('#setRoomEqBassGain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setRoomEqBassGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,00=18');
      });
      it('should send correct command for 12dB', function() {
        zp.setRoomEqBassGain('A', 12);
        assert.equal(sentCommand.command, 'S,H,00=30');
      });
      it('should clamp negative values to -12dB', function() {
        zp.setRoomEqBassGain('A', -15);
        assert.equal(sentCommand.command, 'S,H,00=00');
      });
      it('should clamp positive values to +12dB', function() {
        zp.setRoomEqBassGain('A', 15);
        assert.equal(sentCommand.command, 'S,H,00=30');
      });
    });

    describe('#getRoomEqTrebleGain()', function() {
      it('should return null when data is not set', function() {
        assert.equal(zp.getRoomEqTrebleGain('A'), null);
      });
      it('should return correct dB value', function() {
        zp.data['0C'] = '18'; // 0x18 -> 0dB
        assert.equal(zp.getRoomEqTrebleGain('A'), '0');
      });
    });

    describe('#setRoomEqTrebleGain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setRoomEqTrebleGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,0C=18');
      });
    });

    describe('#getNotch1Gain()', function() {
      it('should return correct dB value', function() {
        zp.data['18'] = '25'; // 0x25 -> 0dB (Note 4)
        assert.equal(zp.getNotch1Gain('A'), '0');
      });
    });

    describe('#setNotch1Gain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setNotch1Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,18=25');
      });
    });

    describe('#getNotch2Gain()', function() {
      it('should return correct dB value for zone A', function() {
        zp.data['2A'] = '25';
        assert.equal(zp.getNotch2Gain('A'), '0');
      });
    });

    describe('#setNotch2Gain()', function() {
      it('should send correct command for zone A', function() {
        zp.setNotch2Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,2A=25');
      });
    });

    describe('#getNotch3Gain()', function() {
      it('should return correct dB value for zone A', function() {
        zp.data['3C'] = '25';
        assert.equal(zp.getNotch3Gain('A'), '0');
      });
    });

    describe('#setNotch3Gain()', function() {
      it('should send correct command for zone A', function() {
        zp.setNotch3Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,3C=25');
      });
    });

    describe('Zone parameter ID calculation', function() {
      it('should calculate correct hex IDs for different zones', function() {
        // Room EQ Bass Gain zone stride is 0x01 (A=00 .. F=05)
        zp.setRoomEqBassGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,00=18');

        zp.setRoomEqBassGain('B', 0);
        assert.equal(sentCommand.command, 'S,H,01=18');

        zp.setRoomEqBassGain('C', 0);
        assert.equal(sentCommand.command, 'S,H,02=18');

        zp.setRoomEqBassGain('D', 0);
        assert.equal(sentCommand.command, 'S,H,03=18');

        zp.setRoomEqBassGain('E', 0);
        assert.equal(sentCommand.command, 'S,H,04=18');

        zp.setRoomEqBassGain('F', 0);
        assert.equal(sentCommand.command, 'S,H,05=18');
      });
    });
  });
});