// A series of useful tools 
//

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
