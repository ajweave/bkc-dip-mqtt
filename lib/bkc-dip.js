
/**
 * Calculates a BKC-DIP checksum for the provided data string.
 */
this.calculateChecksum = function(data) {
    // Calculate 16-bit checksum of ASCII characters up to and including ';'
    // The BKC-DIP spec defines the checksum as the sum of the ASCII codes of the
    // characters in the data string (including commas and the terminating ';'),
    // masked to 16 bits and represented as a 4‑digit uppercase hexadecimal string.
    // The caller provides everything after '(' up to but not including ';'
    // (e.g. "00,G,P00"), so we append a ';'.
    var str = data + ';';
    var sum = 0;
    for (var i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
    }
    sum = sum & 0xFFFF;
    var hex = sum.toString(16).toUpperCase();
    return hex.padStart(4, '0');
}