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
      var input = '00=\"Zone \\\\\"A, B\\\\\"\",01=02';
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
      it('should convert db to hex', function() {
        var data = [{db: '-1', bk: '27'}, {db: '-2', bk: '27'}, {db: '-49', bk: 'F'}, {db: '-80', bk: '0'}];
        data.forEach(d => {
          assert.equal(p.dbVolumeToBk(d.db, d.bk), d.bk);
        });
      })
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
        zp.data['70'] = '0C'; // 12 + 12 = 24 -> 0dB
        assert.equal(zp.getRoomEqBassGain('A'), '0');
        zp.data['70'] = '18'; // 24 + 12 = 36 -> 12dB
        assert.equal(zp.getRoomEqBassGain('A'), '12');
      });
    });

    describe('#setRoomEqBassGain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setRoomEqBassGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,70=0C');
      });
      it('should send correct command for 12dB', function() {
        zp.setRoomEqBassGain('A', 12);
        assert.equal(sentCommand.command, 'S,H,70=18');
      });
      it('should clamp negative values to -12dB', function() {
        zp.setRoomEqBassGain('A', -15);
        assert.equal(sentCommand.command, 'S,H,70=00');
      });
      it('should clamp positive values to +12dB', function() {
        zp.setRoomEqBassGain('A', 15);
        assert.equal(sentCommand.command, 'S,H,70=18');
      });
    });

    describe('#getRoomEqTrebleGain()', function() {
      it('should return null when data is not set', function() {
        assert.equal(zp.getRoomEqTrebleGain('A'), null);
      });
      it('should return correct dB value', function() {
        zp.data['72'] = '0C'; // 12 + 12 = 24 -> 0dB
        assert.equal(zp.getRoomEqTrebleGain('A'), '0');
      });
    });

    describe('#setRoomEqTrebleGain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setRoomEqTrebleGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,72=0C');
      });
    });

    describe('#getNotch1Gain()', function() {
      it('should return correct dB value', function() {
        zp.data['6C'] = '0C'; // 12 + 12 = 24 -> 0dB
        assert.equal(zp.getNotch1Gain('A'), '0');
      });
    });

    describe('#setNotch1Gain()', function() {
      it('should send correct command for 0dB', function() {
        zp.setNotch1Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,6C=0C');
      });
    });

    describe('#getNotch2Gain()', function() {
      it('should return correct dB value for zone A', function() {
        zp.data['74'] = '0C';
        assert.equal(zp.getNotch2Gain('A'), '0');
      });
    });

    describe('#setNotch2Gain()', function() {
      it('should send correct command for zone A', function() {
        zp.setNotch2Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,74=0C');
      });
    });

    describe('#getNotch3Gain()', function() {
      it('should return correct dB value for zone A', function() {
        zp.data['7F'] = '0C';
        assert.equal(zp.getNotch3Gain('A'), '0');
      });
    });

    describe('#setNotch3Gain()', function() {
      it('should send correct command for zone A', function() {
        zp.setNotch3Gain('A', 0);
        assert.equal(sentCommand.command, 'S,H,7F=0C');
      });
    });

    describe('Zone parameter ID calculation', function() {
      it('should calculate correct hex IDs for different zones', function() {
        // Zone A: 0x70
        zp.setRoomEqBassGain('A', 0);
        assert.equal(sentCommand.command, 'S,H,70=0C');

        // Zone B: 0x71
        zp.setRoomEqBassGain('B', 0);
        assert.equal(sentCommand.command, 'S,H,71=0C');

        // Zone C: 0x72
        zp.setRoomEqBassGain('C', 0);
        assert.equal(sentCommand.command, 'S,H,72=0C');

        // Zone D: 0x73
        zp.setRoomEqBassGain('D', 0);
        assert.equal(sentCommand.command, 'S,H,73=0C');

        // Zone E: 0x74
        zp.setRoomEqBassGain('E', 0);
        assert.equal(sentCommand.command, 'S,H,74=0C');

        // Zone F: 0x75
        zp.setRoomEqBassGain('F', 0);
        assert.equal(sentCommand.command, 'S,H,75=0C');
      });
    });
  });
});