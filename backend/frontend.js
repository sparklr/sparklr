var fs = require("fs");
var templates = require("./templates");
var database = require("./database");
var Post = require("./post");
var User = require("./user");
var async = require("async");

var frontendTemplate = "";

fs.readFile("../p18/static/templates/headers_test.html", function(err,data) {
	eval(templates.parse(data.toString()));
	frontendTemplate = html + "<body>";
});

exports.run = function(user, request, response, sessionid) {
	response.writeHead(200, { "Content-type": "text/html" });
	var sessiondata = sessionid.split(",");
	var authkey = sessiondata[1];

	var html = frontendTemplate;


	user.following = user.following.split(",").filter(function(e) { return e; });
	user.followers = user.followers.split(",").filter(function(e) { return e; });

	var friends = [];
	for (i in user.following) {
		if (user.followers.indexOf(user.following[i]) !== -1)
			friends.push(user.following[i]);
	}

	var from = user.following;
	from.push(user.id);

	var payload = {};

	async.parallel([
		function (callback) { 
				database.getStream("timeline", { from: from }, function(err,stream) {
					payload.timelineStream = stream;
					Post.getCommentCounts(stream, function(err,rows) {

						payload.commentCounts = rows;

						callback();
					});

				});
			},
			function (callback) { 
				User.getMassUserDisplayName(from, function (err, names) {
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
			function (callback) { 	
				User.getOnlineFriends(friends, function(err,onlinefriends) {
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
			}], function () {
				html += "<script>app(" + JSON.stringify(payload) + ");</script></body></html>";
				response.write(html);
				response.end();
			});
}

