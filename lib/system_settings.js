

//Page 9 of CT_600X_20005.pdf
SystemSettings = function() {
	this.data = {};
	this.process = function(parts) {
		var data = this.data
		parts.forEach(function (part) {
			pair = part.split('=');
			if (pair.length == 2) {
				data[pair[0]] = pair[1];
			}
		});
	};

function format2(n) {
        return ("00" + n.toString(16)).substr(-2).toUpperCase();
}
	
	this.getInputs = function() {
		console.log("getInputs called, data =", data);
		//This set of inputs reflects what can be used in the preset parameters.
		var inputs = [
			{id: '00', title: 'FM Radio'},
			{id: '01', title: 'AM Radio'},
			{id: '02', title: 'Zone Input'}
		];
		var id = 3;
		var data = this.data;
		for (var i = 0; i < 14; i++, id++) {
			inputs.push(
				{
					id: format2(id.toString(16)),
					title: data[format2(i)]
				}
			);
		}
		return inputs;
	}
}
