//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var PresetParameters = global.PresetParameters;
var p = new PresetParameters('x');
var DIP = require('../lib/bkc-dip.js');
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
      var result = bkcDipMqtt.splitRespectingQuotes('R,Z1,00="Kitchen, Zone",01=02,02=03', ',');
      assert.deepEqual(result, ['R', 'Z1', '00="Kitchen, Zone"', '01=02', '02=03']);
    });

    it('should handle multiple quoted fields with commas', function() {
      var result = bkcDipMqtt.splitRespectingQuotes('00="A, B",01="C, D",02=EF', ',');
      assert.deepEqual(result, ['00="A, B"', '01="C, D"', '02=EF']);
    });

    it('should handle escaped quotes inside quoted strings', function() {
      // Source (runtime string): 00="Zone \"A, B\"",01=02
      // The tokenizer treats \" as an escaped quote (literal " in output).
      // The backslash is consumed as an escape character.
      var input = '00="Zone \\"A, B\\"",01=02';
      var result = bkcDipMqtt.splitRespectingQuotes(input, ',');
      assert.equal(result[0], '00="Zone "A, B""');
      assert.equal(result[1], '01=02');
    });

    it('should strip semicolon terminator respecting quotes', function() {
      var msg = 'R,Z1,00="Zone",01=02;';
      var parts = bkcDipMqtt.splitRespectingQuotes(msg, ',');
      var last = parts[parts.length - 1];
      var trimmed = bkcDipMqtt.splitRespectingQuotes(last, ';');
      parts[parts.length - 1] = trimmed[0];
      assert.deepEqual(parts, ['R', 'Z1', '00="Zone"', '01=02']);
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

  describe('calculateChecksum', function() {
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


});
