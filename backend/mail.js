// Email system (duh)

var User = require("./user");
var Templates = require("./templates");
var email = require("emailjs");
var server = email.server.connect({
	user: "noreply@societyofcode.com",
	password: "df498rure93rjkdfj", //TODO: switch to using the relay so that the noreply addr isn't here
	host: "smtp.gmail.com",
	ssl: true
});

exports.sendMessage = function(to, email, data) {
	User.getUserProfile(to, function(err,rows) {
		if (err)
			return false;
		
		try { 
			var user = rows[0];
			var template = Templates.getTemplate("mail/" + email);
			eval(Templates.parse(template));

			var title = html.split("<title>");
			title = title[1].split("</title>");
			title = title[0];

			server.send({
				text: " ",
				from: "Instancy <noreply@societyofcode.com>",
				to: rows[0].email,
				subject: title,
				attachment: [{
					data: html, alternative: true
				}]
			}, function(err, message) { console.log(err || message); });

		} catch (e) {
			console.log(e);
		}
	});
}


