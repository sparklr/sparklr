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
		if (args.to) {
			query += "AND `to` IN (";
			for (var i = 0; i < args.to.length - 1; i++)
				query += parseInt(args.to[i]) + ",";
			query += parseInt(args.to[args.to.length - 1]);
			query += ") ";
		}

	} else { 
		if (args.to) {
			query += "`to` IN (";
			for (var i = 0; i < args.to.length - 1; i++)
				query += parseInt(args.to[i]) + ",";
			query += parseInt(args.to[args.to.length - 1]);
			query += ") ";

		}
	}
	if (args.type) {
		query += ") AND (`type` = " + parseInt(args.type) + " ";
	}
	if (args.since)
	{
		query += ") AND (`time` > "+parseInt(args.since)
	}
	if (args.starttime)
	{
		query += ") AND (`time` < "+parseInt(args.starttime);
	}
	
	query += ") ORDER BY `time` DESC LIMIT 30";
	console.log(query);
	exports.query(query, callback);
}

exports.postObject = function(table, obj, callback) {
	console.log(obj);
	
	var query = "INSERT INTO " + mysql.escapeId(table) + " (";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		query += mysql.escapeId(key) + ",";
	}
	query = query.substring(0,query.length - 1) + ") VALUES (";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		if (obj[key] == null)
			query += "null,";
		else 
			query += exports.escape(obj[key].toString()) + ",\n";
	}
	query = query.substring(0,query.length - 2) + ")";
	console.log(query);
	exports.query(query,callback);
}

exports.deleteObject = function(table, obj, callback) {
	var querystr = "DELETE FROM " + mysql.escapeId(table) + " WHERE ";
	if (obj.to) {
		querystr += " `to` = " + parseInt(obj.to);
	}
	if (obj.from) {
		querystr += " `from` = " + parseInt(obj.from);
	}
	querystr += " AND `id` = " + parseInt(obj.id);
	console.log(querystr);
	exports.query(querystr, callback);
}

