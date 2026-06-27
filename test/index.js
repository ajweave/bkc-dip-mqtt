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
