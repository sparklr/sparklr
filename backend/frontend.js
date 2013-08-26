var fs = require("fs");
var templates = require("./templates");
var database = require("./database");
var Post = require("./post");
var User = require("./user");
var async = require("async");

var frontendTemplate = "";
var externalTemplate = "";

var loadTemplates = function() {
	if (global.liveSite) {
		var buildData = require("../build/out/build");
	} else {
		var buildData = { cssHash_external: "external", cssHash_frontend: "app" };
	}

	fs.readFile("../templates/headers.html", function(err, data) {
		eval(templates.parse(data.toString()));
		frontendTemplate = html + "<body>";
	});

	fs.readFile("../templates/external.html", function(err, data) {
		eval(templates.parse(data.toString()));
		externalTemplate = html;
	});
}();

exports.run = function(user, request, response, sessionid) {
	if (request.headers['x-scheme'] == "https") {
		response.writeHead(302, { "Location" : "http://sparklr.me/" });
		response.end();
		return;
	}
	response.writeHead(200, {
		"Content-type": "text/html"
	});
	var sessiondata = sessionid.split(",");
	var authkey = sessiondata[1];

	var html = frontendTemplate;

	user.following = user.following.split(",").filter(function(e) { return e; });
	user.followers = user.followers.split(",").filter(function(e) { return e; });
	user.trackedtags = (user.trackedtags || "").split(",").filter(function(e) { return e; });
	user.networks = (user.networks || "0").split(",").filter(function(e) {
		return e;
	});
	user.blacklist = (user.blacklist || "").split(",").filter(function(e) {
		return e;
	});

	var friends = [];
	for (i in user.following) {
		if (user.followers.indexOf(user.following[i]) !== -1)
			friends.push(user.following[i]);
	}

	var from = user.following;
	from.push(user.id);

	var payload = { private: user.private, trackedtags: user.trackedtags, avatarid: user.avatarid, blacklist: user.blacklist };

	async.parallel([
		function(callback) {
			database.getStream("timeline", {
				networks: user.networks.slice(0),
				since: 1,
				sortby: "modified"
			}, function(err, stream) {
				payload.timelineStream = stream;
				callback();
			});
		},
		function(callback) {
			User.getMassUserDisplayName(from, function(err, names) {
				var displayNames = {};
				var userHandles = {};

				for (name in names) {
					displayNames[names[name].id] = names[name].displayname;
					userHandles[names[name].id] = names[name].username;
				}

				payload.displayNames = displayNames;
				payload.userHandles = userHandles;

				callback();
			});
		},
		function(callback) {
			User.getOnlineFriends(friends, function(err, onlinefriends) {
				var friendsObj = {};
				for (i in friends) {
					friendsObj[friends[i]] = false;
				}
				for (i in onlinefriends) {
					friendsObj[onlinefriends[i].id] = true;
				}
				payload.friends = friendsObj;

				callback();
			});
		}
	], function() {
		html += "<script>app(" + JSON.stringify(payload) + ");</script></body></html>";
		response.write(html);
		response.end();
	});
}

exports.showExternalPage = function(request, response) {
	if (request.headers['x-scheme'] == "http") {
		response.writeHead(302, { "Location" : "https://sparklr.me/" });
		response.end();
		return;
	}
	if (request.url != "/" && request.url.indexOf("/signup") == -1) {
		response.writeHead(404);
		response.end();
		return;
	}
	response.writeHead(200);
	response.write(externalTemplate);
	response.end();
}
