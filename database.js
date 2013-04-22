var mysql = require("mysql");

var connection = null;

exports.init = function(args) {
	this.connection = mysql.createConnection(args);
	this.connection.connect(function(err) {
		if (err) {
			throw err;
		}
	});
}

exports.escape = function(str) {
	return this.connection.escape(str);
}

exports.query = function(query, callback) {
	this.connection.query(query, callback);
}

exports.getObject = function(table, id, callback) {
	var query = "SELECT * FROM " + mysql.escapeId(table) + " WHERE id=" + parseInt(id);
	exports.query(query, callback);
}
