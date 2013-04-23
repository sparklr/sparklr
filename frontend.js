var fs = require("fs");
var templates = require("./templates");
var database = require("./database");
var Post = require("./post");
var User = require("./user");

exports.run = function(user, request, response, sessionid) {
	response.writeHead(200, { "Content-type": "text/html" });
	var sessiondata = sessionid.split(",");
	var authkey = sessiondata[1];

	fs.readFile("./frontend.html", function(err,data) {
		data = data.toString();
		var s = data.split("<require ");
		s = s[1].split(">");
		s = s[0].split(",");
		var scripts = "";
		for (var i = 0; i < s.length; i++)
			scripts += "<script src='"+global.commonHost+s[i]+"'></script>";

		eval(templates.parse(data.toString()));
		html = html.replace("</head>", scripts + "</head>");
		html = "<!-- Instancy-Luna Prototype -->" + html;
	
	
		user.following = user.following.split(",").filter(function(e) { return e; });
		user.followers = user.followers.split(",").filter(function(e) { return e; });

		var from = user.following;
		from.push(user.id);

		database.getStream("timeline", { from: from }, function(err,stream) {
			var timelineStream;
				timelineStream = JSON.stringify(stream);
			var commentCounts;
			Post.getCommentCounts(stream, function(err,rows) {
				commentCounts = rows;
			});

			User.getMassUserDisplayName(from, function (err, names) {
				var displayNames = {};
				var userHandles = {};

				for (name in names) {
					displayNames[names[name].id] = names[name].displayname;
					userHandles[names[name].id] = names[name].username;
				}

				var friends = [];
				for (i in user.following) {
					if (user.followers.indexOf(user.following[i]) !== -1)
						friends.push(user.following[i]);
				}
				
				User.getOnlineFriends(friends, function(err,onlinefriends) {
					var friendsObj = {};
					for (i in friends) {
						friendsObj[friends[i]] = false;
					}
					for (i in onlinefriends) {
						friendsObj[onlinefriends[i].id] = true;
					}

					html = html.replace("<! timelineStream ->", timelineStream);
					
					html = html.replace("<! commentCounts ->", JSON.stringify(commentCounts));
					html = html.replace("<! displayNames ->", JSON.stringify(displayNames));
					html = html.replace("<! userHandles ->", JSON.stringify(userHandles));
					html = html.replace("<! friends ->", JSON.stringify(friendsObj));

					response.write(html);
					response.end();

				});
			});
			
		});

	
	});
}
