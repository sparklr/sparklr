var mysql = require("mysql-libmysqlclient");

var connection = null;

exports.init = function(args) {
	this.connection = mysql.createConnectionSync();
	this.connection.connectSync(args.host, args.user, args.password, args.database);
	if (!this.connection.connectedSync()) {
		throw new Exception();
	}
}

exports.escape = function(str) {
	return "'" + this.connection.escapeSync(str) + "'";
}

exports.escapeId = function(str) {
	return "`" + this.connection.escapeSync(str) + "`";
}

exports.query = function(query, callback) {
	this.connection.query(query, function(err,res) {
		if (err) return callback(err);
		if (res.fetchAll)
			res.fetchAll(callback);
		else
			if (callback) callback(err,res);
	});
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
	exports.query(query, callback);
}

exports.postObject = function(table, obj, callback) {
	console.log(obj);
	
	var query = "INSERT INTO " + exports.escapeId(table) + " (";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		query += exports.escape(key) + ",";
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
	console.log(query);
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
	querystr += " AND `id` = " + parseInt(obj.id);
	console.log(querystr);
	exports.query(querystr, callback);
}

exports.updateObject = function(table, obj, callback) {
	var query = "UPDATE " + exports.escapeId(table) + " SET ";
	for (key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		if (typeof(obj[key]) == "object" && obj[key]) {
			query += exports.escapeId(key.toString()) + " = " + exports.escape(obj[key].join(",")) + ",";
		} else {
			query += exports.escapeId(key.toString()) + " = " + exports.escape(obj[key].toString()) + ",";
		}
	}
	query = query.substring(0,query.length-1);
	query += " WHERE `id` = " + parseInt(obj.id);
	exports.query(query,callback);
}
