/* Sparklr
 * A worker in the cluster
 */

var cluster = require("cluster");
var url = require("url");
var http = require("http");

var log = require("./log");

// Pull in global config options
require("./config");

var Frontend = require("./frontend");
var User = require("./user");
var Api = require("./api");
var Database = require("./database");
var User = require("./user");

console.log(process.pid);

Database.init();

http.createServer(handleRequests).listen(global.port);

function handleRequests(request,response) {
	var requesturi = url.parse(request.url, true);
	var sessionid;

	if (request.headers["cookie"]) {
		var d = request.headers["cookie"].match(/D\=([^\s|^\;]+)\;?/);
		sessionid = d ? d[1] : "";
	}

	if (!request.headers['x-scheme'] && requesturi.pathname.indexOf("/rb") !== -1) {
		relayReload(requesturi.pathname);
		response.end();
	}

	if (requesturi.pathname.indexOf("/api") !== -1 || requesturi.pathname.indexOf("/beacon") !== -1) {
		Api.run(request,response,requesturi,sessionid);
	} else {
		if (requesturi.pathname.indexOf("/forgot") !== -1)
			return Frontend.showExternalPage(request, response);

		if (sessionid != null && sessionid !== "new") {
			if (sessionid === "" || sessionid === "signoff")
				return Frontend.showExternalPage(request, response);

			var s = sessionid.split(",");

			User.verifyAuth(s[0],s[1], function(success,userobj) {
				if (success)
					Frontend.run(userobj,request,response,sessionid);
				else {
					Frontend.showExternalPage(request, response);
				}
			});
		} else {
			User.signup(request, function(userobj) {
				if (userobj === 2)
					return response.end("Too many registrations from your IP address recently. Try again soon.\nThis message is to prevent spammers from hammering our network.\n\nSorry about this.\nContact team@sparklr.me if you see this regularly.");

				if (userobj === 3)
					return response.end("You, or someone on the same network as you, was IP banned.\n\nSorry about this.\nContact team@sparklr.me believe this is an error.");

				if (!userobj)
					Frontend.showExternalPage(request, response);
				else {
					sessionid = userobj.id + "," + userobj.authkey;
					Frontend.run(userobj,request,response,sessionid);
				}
			});
		}
	}
}

function relayReload(uri) {
	var s = uri.split("/");
	process.send("R:" + s[2]);
}

process.on('uncaughtException', function(err) {
	log("process error: uncaughtException: " + JSON.stringify(err, null, 3));
	console.log(err.stack);
	process.exit(1);
});

process.on('message', function(message) {
	if (message == "DIE") {
		console.log("I was told to die.");
		process.disconnect();
	}
});

