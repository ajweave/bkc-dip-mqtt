//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var p = new PresetParameters('x');
var assert = require('assert');

describe('bkc-dip-mqtt', function () {
  describe('#format2()', function () {
    it('should format 0 to 00', function() {
      assert.equal(bkcDipMqtt.format2('0'), '00');
    })
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
