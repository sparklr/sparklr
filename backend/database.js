var mysql = require("mysql-libmysqlclient");

var connection = null;
var isConnecting = false;

exports.init = function(args) {
	if (isConnecting) return;
	isConnecting = true;
	connection = mysql.createConnectionSync();
	connection.connectSync(args.host, args.user, args.password, args.database);
	if (!connection.connectedSync()) {
		throw new Exception();
	}
	isConnecting = false;
}

exports.escape = function(str) {
	return "'" + connection.escapeSync(str) + "'";
}

exports.escapeId = function(str) {
	return "`" + connection.escapeSync(str) + "`";
}

exports.query = function(query, callback) {
	try {
		connection.query(query, function(err,res) {
			if (err) {
				if (err.message.indexOf("connect") !== -1 || err.message.indexOf("gone away") !== -1) {
					exports.init(global.database);
					exports.query(query, callback);
					return;
				}
				console.log("Failed query: " + query);
				console.log(err);
				return callback(err);
			}
			if (res.fetchAll)
				res.fetchAll(callback);
			else
				if (callback) callback(err,res);
		});
	} catch (e) {
		console.log((new Date).toString() + ": MysqlError: " + JSON.stringify(e, null, 3));
		if (e.message.indexOf("Not connected") !== -1) {
			exports.init(global.database);
			exports.query(query, callback);
		}
	}
}

exports.getObject = function(table, id, callback) {
	var query = "SELECT * FROM " + exports.escapeId(table) + " WHERE id=" + (parseInt(id) || exports.escape(id));
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
			query += "AND ";
		}
		if (args.networks) {
			query += "OR ";
		}
	}
	if (args.to) {
		query += "`to` IN (";
		for (var i = 0; i < args.to.length - 1; i++)
		query += parseInt(args.to[i]) + ",";
		query += parseInt(args.to[args.to.length - 1]);
		query += ") ";

	}
	if (args.networks && args.networks.length > 0) {
		query += "`network` IN (";
		for (var i = 0; i < args.networks.length - 1; i++)
		query += exports.escape(args.networks[i]) + ",";
		query += exports.escape(args.networks[args.networks.length - 1]);
		query += ") ";
	}
	
	if (args.id) {
		query += "`id` IN (";
		for (var i = 0; i < args.id.length -1; i++) 
			query += parseInt(args.id[i]) + ",";
		query += parseInt(args.id[args.id.length - 1]) + ") ";
	}
	if (args.type)
	{
		query += ") AND (`type` = " + parseInt(args.type) + " ";
	}
	if (args.since)
	{
		query += ") AND (";
		if (args.modified)
			query += "`modified` > "+parseInt(args.modified);
		else
			query += "`time` > "+parseInt(args.since);

	}
	if (args.starttime)
	{
		query += ") AND (`time` < "+parseInt(args.starttime);
	}
	
	query += ") ORDER BY " + (args.sortby ? exports.escapeId(args.sortby) : "`time`") + " DESC LIMIT 20";
	exports.query(query, callback);
	//console.log(query);
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

