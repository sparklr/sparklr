// An experiment

var url = require("url");
var http = require("http");
var Cookies = require("cookies");

var frontend = require("./frontend");
var database = require("./database");
var user = require("./user");
var work = require("./work");

var domain = require("domain");
var cluster = require("cluster");
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
memwatch.on("leak", function(info) {
	var diff = hd.end();
	console.log(diff);
});
require("./config");

database.init(global.database);

if (cluster.isMaster) {
	var numCPUs = require('os').cpus().length;
	
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on("exit", function(worker) {
		console.log(worker);
		cluster.fork();
	});
} else {
	http.createServer(function(request,response) {
			/*	var d = domain.create();
				d.add(request);
				d.add(response);

				d.on("error", function(err) {
				console.log(err);
				console.log(err.stack);
				response.writeHead(500);
				response.write(err.toString());
				response.end();
				d.dispose();
				});
				d.enter();
				d.run(function() { 
				*/
		var requesturi = url.parse(request.url, true);
		var cookies = new Cookies(request,response);
		var sessionid = cookies.get("D");

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
		//	});

	}).listen(8080);

	process.on('uncaughtException', function(err) {
		console.log(err);
		console.log(err.stack);
	});
}

