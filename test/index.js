//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var DIP = require('../lib/bkc-dip.js');
var assert = require('assert');

var p = new PresetParameters('x');

describe('bkc-dip-mqtt', function () {
  describe('#format2()', function () {
    it('should format 0 to 00', function() {
      assert.equal(bkcDipMqtt.format2('0'), '00');
    })
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
  });


});
