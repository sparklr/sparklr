// An experiment

var url = require("url");
var http = require("http");
var Cookies = require("cookies");

var frontend = require("./frontend");
var external = require("./external");
var database = require("./database");
var user = require("./user");
var work = require("./work");

global.salt = "yumyumyum";
global.commonHost = "http://192.168.1.128/p18/static/"


database.init({
	host: "localhost",
	user: "root",
	password: "",
	database: "p18"
});

http.createServer(function(request,response) {
	var requesturi = url.parse(request.url, true);
	var cookies = new Cookies(request,response);
	var sessionid = cookies.get("D");
	
	if (requesturi.pathname.indexOf("/work") !== -1) {
		work.run(request,response,requesturi,sessionid);
	} else {
		if (sessionid != null && sessionid != "") {
			var s = sessionid.split(",");
			user.verifyAuth(s[0],s[1], function(success,userobj) {
				if (success)
					frontend.run(userobj,request,response);
				else
					external.run(request,response);
			});
		} else {
			external.run(request,response);
		}
	}

}).listen(8080);

