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

exports.getStream = function(table, args, callback) {
	var query = "SELECT * FROM " + mysql.escapeId(table) + " WHERE (";
	if (args.from) {
		query += "`from` IN (";
		for (var i = 0; i < args.from.length - 1; i++)
			query += parseInt(args.from[i]) + ",";
		query += parseInt(args.from[args.from.length - 1]);
		query += ") ";
	}
	if (args.type) {
		query += "AND `type` = " + parseInt(args.type) + " ";
	}
	if (args.to) {
		query += "AND `to` = " + parseInt(args.to) + " ";
	}
	if (args.since)
	{
		query += "AND (`time` > "+parseInt(args.since)+") ";
	}
	if (args.starttime)
	{
		query += "AND (`time` < "+parseInt(args.starttime) + ")";
	}
	
	query += ") ORDER BY `time` DESC LIMIT 30";
	console.log(query);
	exports.query(query, callback);
}

