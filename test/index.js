//import assert from 'assert';
var bkcDipMqtt = require('../lib/server.js');
var assert = require('assert');

describe('bkc-dip-mqtt', function () {
  describe('#format2()', function () {
    it('should format 0 to 00', function() {
      assert.equal('00', bkcDipMqtt.format2('0'));
    })
  });

  //Test dbVolumetoBk TODO: Move to test case
// var p = new PresetParameters('x');
// for (var i = -80; i < 0; i++) {
// 	console.log(i.toString(), '=', p.dbVolumeToBk(i));
// }


});
