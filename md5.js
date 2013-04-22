var crypto = require("crypto");

exports.hash = function(str) {
	var hash = crypto.createHash("md5");
	hash.update(str, "ascii");
	return hash.digest("hex");
}
