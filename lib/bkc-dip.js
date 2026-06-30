"use strict";
/**
 * Calculates a BKC-DIP checksum for the provided data string.
 */
module.exports.calculateChecksum = function(data) {
    var str = data + ';';
    var sum = 0;
    for (var i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
    }
    sum = sum & 0xFFFF;
    var hex = sum.toString(16).toUpperCase();
    return hex.padStart(4, '0');
};
