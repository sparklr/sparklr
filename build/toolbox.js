var crypto = require("crypto");

exports.sha1 = function(str) {
	var hash = crypto.createHash("sha1");
	hash.update(str);
	return hash.digest("hex");
}

