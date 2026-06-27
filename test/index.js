//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var PresetParameters = global.PresetParameters;
var p = new PresetParameters('x');
var assert = require('assert');

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

  describe('PresetParameters', function() {
    describe('#dbVolumeToBk()', function() {
      it('should convert db to hex', function() {
        var data = [{db: '-1', bk: '27'}, {db: '-2', bk: '27'}, {db: '-49', bk: 'F'}, {db: '-80', bk: '0'}];
        data.forEach(d => {
          assert.equal(p.dbVolumeToBk(d.db, d.bk), d.bk);
        });
      })
    })
  });


});
