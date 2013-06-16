var mysql = require("mysql-libmysqlclient");

var connection = null;
var isConnecting = false;

exports.init = function(args) {
	if (this.isConnecting) return;
	this.isConnecting = true;
	this.connection = mysql.createConnectionSync();
	this.connection.connectSync(args.host, args.user, args.password, args.database);
	if (!this.connection.connectedSync()) {
		throw new Exception();
	}
	this.isConnecting = false;
}

exports.escape = function(str) {
	return "'" + this.connection.escapeSync(str) + "'";
}

exports.escapeId = function(str) {
	return "`" + this.connection.escapeSync(str) + "`";
}

exports.query = function(query, callback) {
	try {
		this.connection.query(query, function(err,res) {
			if (err) {
				if (err.message.indexOf("connect") !== -1 || err.message.indexOf("gone away") !== -1) {
					exports.init(global.database);
					exports.query(query, callback);
					return;
				}
				return callback(err);
			}
			if (res.fetchAll)
				res.fetchAll(callback);
			else
				if (callback) callback(err,res);
		});
	} catch (e) {
		if (e.message.indexOf("Not connected") !== -1) {
			exports.init(global.database);
			exports.query(query, callback);
		}
	}
}

exports.getObject = function(table, id, callback) {
	var query = "SELECT * FROM " + exports.escapeId(table) + " WHERE id=" + parseInt(id);
	exports.query(query, callback);
}

exports.getStream = function(table, args, callback) {
	var query = "SELECT * FROM " + exports.escapeId(table) + " WHERE (";
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
	if (args.type)
	{
		query += ") AND (`type` = " + parseInt(args.type) + " ";
	}
	if (args.since)
	{
		query += ") AND (`time` > "+parseInt(args.since)
		if (args.modified)
			query += " OR `modified` > "+parseInt(args.modified);
	}
	if (args.starttime)
	{
		query += ") AND (`time` < "+parseInt(args.starttime);
	}
	
	query += ") ORDER BY `time` DESC LIMIT 30";
	exports.query(query, callback);
}

exports.postObject = function(table, obj, callback) {
	var query = "INSERT INTO " + exports.escapeId(table) + " (";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		query += exports.escapeId(key) + ",";
	}
	query = query.substring(0,query.length - 1) + ") VALUES (";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		if (obj[key] == null)
			query += "null,\n";
		else 
			query += exports.escape(obj[key].toString()) + ",\n";
	}
	query = query.substring(0,query.length - 2) + ")";
	exports.query(query,callback);
}

exports.deleteObject = function(table, obj, callback) {
	var querystr = "DELETE FROM " + exports.escapeId(table) + " WHERE ";
	if (obj.to) {
		querystr += " `to` = " + parseInt(obj.to);
	}
	if (obj.from) {
		querystr += " `from` = " + parseInt(obj.from);
	}

	if (obj.id) {
		var id = (typeof(obj.id) == "number" ? parseInt(obj.id) : exports.escape(obj.id));

		querystr += (obj.from || obj.to) ? " AND " : "";
		querystr += "`id` = " + id;
	}
	exports.query(querystr, callback);
}

exports.updateObject = function(table, obj, callback) {
	var query = "UPDATE " + exports.escapeId(table) + " SET ";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		if (obj[key] == null) continue;
		if (typeof(obj[key]) == "object") {
			query += exports.escapeId(key.toString()) + " = " + exports.escape(obj[key].join(",")) + ",";
		} else {
			query += exports.escapeId(key.toString()) + " = " + exports.escape(obj[key].toString()) + ",";
		}
	}
	query = query.substring(0,query.length-1);
	query += " WHERE `id` = " + parseInt(obj.id);
	exports.query(query,callback);
}

