// A series of useful tools
//

var id = 0;

exports.time = function() {
	var date = new Date();
	return Math.floor(date.getTime() / 1000);
}

var crypto = require("crypto");

exports.hash = function(str) {
	var hash = crypto.createHash("md5");
	hash.update(str, "ascii");
	return hash.digest("hex");
}

// Not actually unique
exports.uniq = function() {
	id++;
	return (new Date).getTime() - 1407884046674 + "" + id;
}

exports.filter = function (e) { return e; }
