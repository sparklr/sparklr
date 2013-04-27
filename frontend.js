var fs = require("fs");
var templates = require("./templates");
var database = require("./database");
var Post = require("./post");
var User = require("./user");
var async = require("async");

var frontendTemplate = "";

fs.readFile("./frontend.html", function(err,data) {
var s = data.toString().split("<require ");
	s = s[1].split(">");
	s = s[0].split(",");
	var scripts = "";
	for (var i = 0; i < s.length; i++)
		scripts += "<script src='"+global.commonHost+s[i]+"'></script>";
	
	data = data.toString().replace("</head>", scripts + "</head>");

	frontendTemplate = data.toString();
});

exports.run = function(user, request, response, sessionid) {
	response.writeHead(200, { "Content-type": "text/html" });
	var sessiondata = sessionid.split(",");
	var authkey = sessiondata[1];

	var data = frontendTemplate;
		eval(templates.parse(data.toString()));
	html = "<!-- Instancy-Luna Prototype -->" + html;


	user.following = user.following.split(",").filter(function(e) { return e; });
	user.followers = user.followers.split(",").filter(function(e) { return e; });

	var friends = [];
	for (i in user.following) {
		if (user.followers.indexOf(user.following[i]) !== -1)
			friends.push(user.following[i]);
	}

	var from = user.following;
	from.push(user.id);

	async.parallel([
		function (callback) { 
				database.getStream("timeline", { from: from }, function(err,stream) {
					var timelineStream;
					timelineStream = JSON.stringify(stream);

					html = html.replace("<! timelineStream ->", timelineStream);
					Post.getCommentCounts(stream, function(err,rows) {

						var commentCounts = rows;

						html = html.replace("<! commentCounts ->", JSON.stringify(commentCounts));

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

					html = html.replace("<! displayNames ->", JSON.stringify(displayNames));
					html = html.replace("<! userHandles ->", JSON.stringify(userHandles));

					callback();
				});

			},
			function (callback) { 	
				User.getOnlineFriends(friends, function(err,onlinefriends) {
					var friendsObj = {};
					console.log(friends);
					for (i in friends) {
						friendsObj[friends[i]] = false;
					}
					for (i in onlinefriends) {
						friendsObj[onlinefriends[i].id] = true;
					}



					html = html.replace("<! friends ->", JSON.stringify(friendsObj));

					callback();
				});
			}], function () {
				response.write(html);
				response.end();
			});
}
