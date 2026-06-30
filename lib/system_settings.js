"use strict";
// Page 9 of CT_600X_20005.pdf

var SystemSettings = module.exports = function() {
	this.data = {};
};

SystemSettings.prototype.process = function(parts) {
	var data = this.data;
	parts.forEach(function(part) {
		var pair = part.split('=');
		if (pair.length == 2) {
			data[pair[0]] = pair[1];
		}
	});
};

SystemSettings.prototype.getInputs = function() {
	var data = this.data;
	var inputs = [
		{id: '00', title: 'FM Radio'},
		{id: '01', title: 'AM Radio'},
		{id: '02', title: 'Zone Input'}
	];
	var id = 3;
	for (var i = 0; i < 14; i++, id++) {
		inputs.push({
			id: format2(id.toString(16)),
			title: data[format2(i)]
		});
	}
	return inputs;
};

function format2(n) {
	return ("00" + n.toString(16)).substr(-2).toUpperCase();
}
