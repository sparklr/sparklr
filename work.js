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

	if (sessionid != null) {
		var s = sessionid.split(",");
		user.verifyAuth(s[0],s[1], function(success, userobj) {
			if (!success) {
				console.log(s);
				response.writeHead(403);
				response.end();
				return;
			}

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
					var obj = { followers: userobj.followers.split(","), following: userobj.following.split(",") }
					sendObject(response,obj);
				case "stream":
				default:
					response.writeHead(404);
					response.write("I don't know what you're talking about: " + fragments[2]);
					response.end();
					break;
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
