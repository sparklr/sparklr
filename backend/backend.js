require("./config");

var cluster = require("cluster");

var url = require("url");
var http = require("http");

var frontend = require("./frontend");
var user = require("./user");
var work = require("./work");
var database = require("./database");

/*if (process.platform != "iwin32") {
	var memwatch = require('memwatch');
	var hd = new memwatch.HeapDiff();
	memwatch.on("leak", function(info) {
		console.log((new Date).toString() + ": MemoryLeak");
		console.log(info);
		console.log(JSON.stringify(hd.end(), null, 3));
		process.exit(1);
	});
}
*/
//var agent = require('webkit-devtools-agent');
database.init(global.database);

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

	if (requesturi.pathname.indexOf("heap") !== -1) {
		response.writeHead(200);
		response.write(JSON.stringify(hd.end(), null, 3));
		response.end();
		hd = new memwatch.HeapDiff();
		return;
	}

	if (requesturi.pathname.indexOf("/work") !== -1 || requesturi.pathname.indexOf("/beacon") !== -1) {
		work.run(request,response,requesturi,sessionid);
	} else {
		if (sessionid != null && sessionid != "") {
			var s = sessionid.split(",");

			user.verifyAuth(s[0],s[1], function(success,userobj) {
				if (success)
					frontend.run(userobj,request,response,sessionid);
				else
					frontend.showExternalPage(request,response);
			});
		} else {
			frontend.showExternalPage(request,response);
		}
	}
}

process.on('uncaughtException', function(err) {
	console.log((new Date).toString() + ": Error: " + JSON.stringify(err, null, 3));
	console.log(err.stack);
	process.exit(1);
});

function relayReload(uri) {
	var s = uri.split("/");
	process.send("R:" + s[2]);
}
