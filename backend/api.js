/* Sparklr
 * API
 */

var User = require("./user");
var Notification = require("./notification");
var Toolbox = require("./toolbox");
var Upload = require("./upload");

var api = {};

// auto-add api endpoints
require('fs').readdirSync('api/').forEach(function(file) {
	var endpoints = require('./api/'+file);
	for (endpoint in endpoints) {
		api[endpoint] = endpoints[endpoint];
	}
});

exports.run = function(request, response, uri, sessionid) {
	var fragments = uri.pathname.split("/");

	var args = {
		request: request,
		response: response,
		uri: uri,
		sessionid: sessionid,
		fragments: fragments
	}

	var endpoint;

	var callback = function(err,res,headers) {
		apiResponse(response,err,res,headers);
	}

	if (f = api['public_'+fragments[2]])
		return f(args, callback);

	var postBody = "";
	var dataComplete = false;

	if (request.method == "POST") {
		request.on("data", function(data) {
			postBody += data;
			if (postBody.length > 15728640) {
				postBody = null;
				response.writeHead(413);
				request.connection.destroy();
			}
		});
		request.on("end", function() {
			dataComplete = true;
			request.removeAllListeners("data");
			request.removeAllListeners("end");
		});
	}

	if (sessionid == null)
		return apiResponse(response, false, 403);

	var authkey_header = request.headers['x-x'];
	User.verifyAuth(sessionid.split(',')[0], authkey_header, function(success, userobj) {
		if (!success) {
			return apiResponse(response, false, 403);
		}

		args.userobj = userobj;

		userobj.following = userobj.following.split(",").filter(Toolbox.filter);

		if (request.method == "POST") {
			if (!(endpoint = api['post_'+fragments[2]]))
				return apiResponse(response, false, 404);

			var postObject;
			try {
				postObject = request.headers['x-data'] ? JSON.parse(decodeURIComponent(request.headers['x-data'])) : {};
			} catch (e) {
				log("Bad post data: " + request.headers['x-data']);
				log(e);
				return apiResponse(response, false, 500);
			}
				
			args.postObject = postObject;

			if (postObject.img) {
				var f = function() {
					var imgArgs = { allowGif: true, width: 700, height: 720 };
					var s = uri.pathname.split("/");
					if (s[2] == "post")
						imgArgs.width = 900;
					if (s[2] == "avatar") 
						imgArgs = { fullWidth: 200, fullHeight: 200, width: 50, height: 50, fill: true, id: userobj.id };
					if (s[2] == "header") 
						imgArgs = { noThumb: true, fill: true, id: userobj.id, category: "b" };
					
					Upload.handleUpload(postBody, userobj, imgArgs, function(err, id) {
						postBody = null;

						if (err) {
							log("Failed to upload");
							log(err);
							return apiResponse(response, 500, false);
						}
						postObject.img = id;

						endpoint(args, callback);
						
						f = null;
					});
				};
				dataComplete ? f() : request.on("end", f);
				return;
			} else {
				endpoint(args, callback);
			}
		} else {
			if (uri.pathname.indexOf("/beacon") !== -1) {
				Notification.getUserNotifications(userobj.id, uri.query.n, beaconNotifCallback, args);
			} else {
				if (!(endpoint = api["get_"+fragments[2]]))
					return apiResponse(response, 404, false);
				endpoint(args, callback);
			}
		}
	});
}

function beaconNotifCallback(err, rows, args) {
	if (err) return apiResponse(args.response, err, 500);

	var obj = {}, endpoint = null;

	if (rows.length > 0)
		obj.notifications = rows;

	if ((endpoint = api["get_"+args.fragments[3]])) {
		args.fragments.shift();
		endpoint(args, function(status, data, headers) {
			obj.data = data;
			apiResponse(args.response, status, obj, headers);
		});
	} else {
		apiResponse(args.response, 200, obj);
	}
}

function apiResponse(response, err, obj, headers) {
	var status = err || 200;	
	if (typeof(status) !== 'number') {
		status = 500;
		obj = false;
	}

	try {
		response.writeHead(status, headers || {
			"Cache-Control": "no-cache"
		});
		response.write(JSON.stringify(obj));
		response.end();
	} catch (e) {
		response = null;
		// disconnected
	}
	obj = null;
}

