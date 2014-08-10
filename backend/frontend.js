var fs = require("fs");
var templates = require("./templates");
var database = require("./database");
var Post = require("./post");
var User = require("./user");
var Notification = require("./notification");

var frontendTemplate = "";
var mobileFrontendTemplate = "";
var externalTemplate = "";

// need a better loading for reload cases
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

	fs.readFile("../templates/mobileheaders.html", function(err, data) {
		eval(templates.parse(data.toString()));
		mobileFrontendTemplate = html + "<body>";
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

	var html;

	if (request.headers['user-agent'].indexOf('obile') !== -1) {
		html = mobileFrontendTemplate;
	} else {
		html = frontendTemplate;
	}

	response.writeHead(200, {
		"Content-type": "text/html",
		"Set-Cookie": "D=" + sessionid + "; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT",
		"Cache-Control": "no-cache"
	});
	var sessiondata = sessionid.split(",");
	var authkey = sessiondata[1];


	user.following = user.following.split(",").filter(function(e) { return e; });
	user.networks = (user.networks || "0").split(",").filter(function(e) {
		return e;
	});
	user.blacklist = (user.blacklist || "").split(",").filter(function(e) {
		return e;
	});

	var from = user.following;
	from.push(user.id);

	var payload = {
		private: user.private, avatarid: user.avatarid, blacklist: user.blacklist,
		following: user.following,
		user: user.id,
		authkey: user.authkey,
		guest: user.email.indexOf("sparklr.me") !== -1,
	};
	database.getStream("timeline", {
		networks: user.networks.slice(0),
		from: from,
		since: 1,
		sortby: "modified",
	}, function(err, stream) {
		payload.timelineStream = stream;
		User.getMassUserDisplayName(from, function(err, names) {
			var displayNames = {};
			var userHandles = {};

			for (name in names) {
				displayNames[names[name].id] = names[name].displayname;
				userHandles[names[name].id] = names[name].username;
			}

			payload.displayNames = displayNames;
			payload.userHandles = userHandles;
			payload.isMod = (user.rank > 49);

			Notification.getUserNotifications(user.id, 0, function(err,rows) {
				payload.notifications = rows;
				html += "<script>app(" + JSON.stringify(payload) + ");</script></body></html>";
				response.write(html);
				response.end();
			});
		});
	});
}

exports.showExternalPage = function(request, response, ipbanned) {
	if (request.headers['x-scheme'] == "http") {
		response.writeHead(302, { "Location" : "https://sparklr.me/" });
		response.end();
		return;
	}
	if (request.url != "/" && request.url.indexOf("/signup") == -1 && request.url.indexOf("/forgot") == -1) {
		response.writeHead(404);
		response.end();
		return;
	}
	response.writeHead(200);
	response.write(externalTemplate);
	if (ipbanned) {
		response.write("<script>window.ipbanned = true;</script>");
	}
	response.end();
}

