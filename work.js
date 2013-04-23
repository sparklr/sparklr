// Main ranch
var user = require("./user");
var Post = require("./post");
var database = require("./database");


exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");
	switch (fragments[2]) {
		case "signoff":
			response.writeHead(200, { "Set-Cookie": "D=; Path=/" });
			response.end();
			return;
		case "signin":
			user.trySignin(fragments[3], fragments[4], function(result,userobj) { 
				if (result) { 
					var sessionid = userobj.id + "," + user.getAuthkey(userobj);
					console.log(sessionid);
					response.writeHead(200, { "Set-Cookie": "D="+sessionid+"; Path=/" });
					response.end();
				} else {
					response.writeHead(403);
					response.end();
				}
			});
			return;
	}

	var postBody = "";
	var dataComplete = false;
	request.on("data", function(data) {
		postBody += data;
		if (postBody.length > 1e5) {
			postBody = null;
			response.writeHead(413);
			request.connection.destroy();
		}
	});
	request.on("end", function() {
		dataComplete = true;
	});

	if (sessionid != null) {
		var s = sessionid.split(",");
		user.verifyAuth(s[0],s[1], function(success, userobj) {
			if (!success) {
				console.log(s);
				response.writeHead(403);
				response.end();
				return;
			}

			userobj.following = userobj.following.split(",").filter(function(e) { return e; });
			userobj.followers = userobj.followers.split(",").filter(function(e) { return e; });

			if (request.method == "POST") {
				console.log(postBody);
				var postObject;
				try {
					postObject = JSON.parse(postBody);
				} catch (e) {
					response.writeHead(404, "fix this");
				}
				//TODO: verify data is done sending
				switch (fragments[2]) {
					case "post":
						Post.post(userobj.id, postObject, function (err) {
							sendObject(response,null);
						});
					break;
				}
			} else {
			//if (user.getAuthkey(userobj) != request.headers.xauthkey) 
			switch (fragments[2]) {
				case "post":
					//TODO: privacy
					database.getObject("users", fragments[3], function(err,users) { 
						database.getObject("timeline", fragments[4], function(err,posts) {
							if (err || !obj)
								console.log(err);
							var obj = posts[0];
							if (obj.from != users[0].id)
								return do403(response, "User ID and post ID do not match");

							obj.fromhandle = users[0].username;
							
							Post.getComments(obj.id, function(err,comments) {
								obj.comments = comments;
								sendObject(response,obj);
							});	
						});
					});
					break;
				case "friends":
					var obj = { followers: userobj.followers, following: userobj.following }
					sendObject(response,obj);
				case "stream":
					var stream = parseInt(fragments[3]);
					var from;
					if (stream === 0) {
						from = userobj.following;
						from.push(userobj.id);
					} else {
						from = stream;
					}

					database.getStream("timeline", { from: from }, function(err, rows) {
						console.log(err);
						sendObject(response,rows);
					});
					break;
				case "photos":
					var from = userobj.following;
						from.push(userobj.id);

					database.getStream("timeline", { from: from, type: 1 }, function(err, rows) {
						sendObject(response,rows);
					});
					break;
case "user":
					var userid = parseInt(fragments[3]);
					database.getObject("users", userid, function (err,users) {
						var profile = users[0];
						if (profile.private) {
							if (userid != userobj.id && (userobj.following.indexOf(userid) == -1 || userobj.followers.indexOf(userid) == -1)) {
								return do403(response, "not friends");  
							} 
						}
						
						var obj = { user: profile.id,
									handle: profile.username,
									avatarid: profile.avatarid,
									following: (userobj.followers.indexOf(profile.id) != -1),
									name: profile.displayname,
									bio: profile.bio };

						var table = (fragments[4] == "board" ? "boards" : "timeline");
						var args = { from: [profile.id] };
						
						if (fragments[4] == "photos") {
							args.type = 1;
						}

						database.getStream(table, args, function(err,rows) {
								obj.timeline = rows;
								if (table == "boards") 
									sendObject(response,obj);
								else {
									Post.getCommentCounts(rows, function(err,rows) {
										obj.commentcounts = rows;
										sendObject(response, obj);
									});
								}
							});
					});
					break;
				case "chat":
					var from = parseInt(fragments[3]);
					database.getStream("messages", { from: [from], to: userobj.id }, function(err,rows) {
						sendObject(response, rows);
					});
					break;
				default:
					response.writeHead(404);
					response.write("I don't know what you're talking about: " + fragments[2]);
					response.end();
					break;
			}
}
		});
	}
}

function sendObject(response,obj) {
	response.writeHead(200);
	response.write(JSON.stringify(obj));
	response.end();
	console.log(">>" + JSON.stringify(obj));
}
function do403(response, info) {
	response.writeHead(403);
	response.write(JSON.stringify({ success: false, info: info }));
	response.end();
}
