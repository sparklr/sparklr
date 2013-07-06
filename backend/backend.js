var cluster = require("cluster");

var url = require("url");
var http = require("http");
var Cookies = require("cookies");

var frontend = require("./frontend");
var user = require("./user");
var work = require("./work");
var database = require("./database");

var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
memwatch.on("leak", function(info) {
	var diff = hd.end();
	console.log(diff);
});

require("./config");

database.init(global.database);

var server = http.createServer(function(request,response) {
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
});
server.listen(8080);
process.on('uncaughtException', function(err) {
	console.log(err);
	console.log(err.stack);
	process.exit(1);
});

