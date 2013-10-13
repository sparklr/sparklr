require("./config");

var cluster = require("cluster");

var url = require("url");
var http = require("http");

var wsServer = require("ws").Server;

var Frontend = require("./frontend");
var User = require("./user");
var Work = require("./work");
var Database = require("./database");

//var agent = require('webkit-devtools-agent');
Database.init(global.database);

//var memwatch = require("memwatch");
//var hd = new memwatch.HeapDiff();

var server = http.createServer(handleRequests);
server.listen(8080);

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
	/*if (requesturi.pathname.indexOf("/heap") !== -1) {
		var diff = hd.end();
		response.writeHead(200);
		response.write(JSON.stringify(diff, null, 3));
		response.end();
		hd = new memwatch.HeapDiff();
		return;
	}
	*/

	if (requesturi.pathname.indexOf("/work") !== -1 || requesturi.pathname.indexOf("/beacon") !== -1) {
		Work.run(request,response,requesturi,sessionid);
	} else {
		if (sessionid != null && sessionid != "") {
			var s = sessionid.split(",");

			User.verifyAuth(s[0],s[1], function(success,userobj) {
				if (success)
					Frontend.run(userobj,request,response,sessionid);
				else
					Frontend.showExternalPage(request,response);
			});
		} else {
			Frontend.showExternalPage(request,response);
		}
	}
}

process.on('uncaughtException', function(err) {
	console.log((new Date).toString() + ": Error: " + JSON.stringify(err, null, 3));
	console.log(err.stack);
	process.exit(1);
});

var wss = new wsServer({ port: 8081 });
var clients = {};
var p18Index = 0;

wss.on("connection", function(ws) {
	ws.p18Authenticated = false;
	ws.on("close", function() {
		//console.log(clients.indexOf(ws));
		//console.log(clients[clients.indexOf(ws)].p18User);
		//
		//p18Index wont work because the index changes as the array shifts
	   clients[ws.p18Index] = null;
	});
	ws.on("message", function(message,e2,e3) {
		if (!ws.p18Authenticated) {
			var s = message.split(",");
			User.verifyAuth(s[0],s[1], function(success,userobj) {
				if (!success)
					return ws.close();
				
				ws.p18Authenticated = true;
				ws.p18SubscribedTo = [];
				ws.p18User = userobj.id;

				ws.send("c:");

				ws.p18Index = p18Index;
				clients[p18Index] = ws;
				p18Index++;
				console.log("connected");
			});
			return;
		}
		console.log(message.toString());
		var c = message.substring(0,1);
		var body = message.substring(1);
		switch (c) {
			case "s":
				// these are the predetermined subscriptions
				ws.p18SubscribedTo = body.split(",");
				break;
			case "S":
				// subscribe
				ws.p18SubscribedTo.push(body);
			break;
		}
	});
});

process.on("message", function(e) {
	console.log(e);
	var str;

	if (e.t === 0) {
		for (i in clients) {
			if (!clients[i]) continue;
			if (clients[i].p18SubscribedTo.indexOf("c" + e.postid) !== -1) {
				clients[i].send(str || (str = JSON.stringify(e)));
			}
		}
	}
	if (e.t === 1) {
		for (i in clients) {
			if (!clients[i]) continue;
			if (clients[i].p18User == e.to) {
				console.log("sent: " + clients[i].p18User);
				clients[i].send(str || (str = JSON.stringify(e)));
			} else {
				console.log("not: " + clients[i].p18User);
			}
		}
	}
	if (e.t === 2) {
		for (i in clients) {
			if (!clients[i]) continue;
			if (clients[i].p18SubscribedTo.indexOf(e.network) !== -1 || clients[i].p18SubscribedTo.indexOf(e.from) !== -1) {
				clients[i].send(str || (str = JSON.stringify(e)));
			}
		}
	}
});

function relayReload(uri) {
	var s = uri.split("/");
	process.send("R:" + s[2]);
}
