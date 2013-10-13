window.addEventListener("hashchange", function() { updatePages(false); });
window.addEventListener("load", function() { updatePages(true) });

function updatePages(loaded) {
	if (location.href.indexOf("/signup/") != -1 && location.hash == "") {
		location.href = "/#" + location.href.substring(location.href.indexOf("/signup"));
		return;
	}
	var args = location.hash.split("/");
	var html = "";
	var pages = _g("pages");
	
	if (loaded && args[1] == "thankyou")
		return location.href = "#";

	for (var i = 0; i < pages.childNodes.length; i++) {
		if (pages.childNodes[i].getAttribute("data-page") == args[1]) {
			html = pages.childNodes[i].innerHTML;
		}
	}
	
	if (html == "")
		html = _g("page_default").innerHTML;

	if (!loaded) {
		_g("content").style.opacity = 0;
		setTimeout(function() {
			setContent(html);
			setTimeout(function() {
				_g("content").style.opacity = 1;
			}, 200);
		}, 600);
	} else {
		setContent(html);
		if (args[1] == "signup" && args[3]) {
			var ele = _g("signupemail");
			if (ele) {
				ele.value = unescape(args[3]);
			}
		}
	}
	callback(""); //hide any old error messages
}

// This entire function is literally just for IE compat.
function setContent(html) {
	var content = _g("content");
	content.innerHTML = html;

	var walk = function(e) {
		for (var i = 0; i < e.childNodes.length; i++) {
			var child = e.childNodes[i];
			if (child.id)
				child.id = child.id.replace("fake","");

			if (e.childNodes[i].getAttribute && e.childNodes[i].getAttribute("autofocus")) {
				e.childNodes[i].focus();
				if (child.type == "password") {
					child.type = "text";
					child.setAttribute("data-password", 1);
				}
				if (child.placeholder) {
					child.value = child.placeholder;
					child.setSelectionRange(0,0);
					child.style.color = '#aaa';
					child.onclick = child.onkeydown = function(e) {
						if (!e) e = window.event;
						e.target.onkeydown = null;
						e.target.onclick = null;
						e.target.value = "";
						e.target.style.color = "";
						if (e.target.getAttribute("data-password")) {
							e.target.type = "password";
						}
					}
				}
			}
			if (e.childNodes[i].childNodes.length > 0) {
				walk(e.childNodes[i]);
			}
		}
	};
	walk(content);
}

function requestInvite(email) {
	if (email.value != "email address" && email.value != "") {
		ajaxGet("work/requestinvite/" + email.value, null, function() {
			location.href = "#/thankyou";
		});
	} else {
		callback("Please enter an email address");
	}
}

function trySignin(username, password, redir) {
	var xhr = new XMLHttpRequest();
	
	_g("loginform").className = "";
	if (username.value == "")
		return;	

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			switch (xhr.status)
			{
				case 200:
					location.href = redir || "./";
				break;
				case 403:
					password.value = "";
					_g("content").className = "shake";
					_g("forgot").style.display = "block";
					setTimeout('_g("forgot").style.opacity = 1;', 10);
					callback("Incorrect username or password");
				break;
				default:
					callback("Failed to contact the server. Try again.");
				break;
			}
		}
	}
	
	xhr.open("POST", "work/signin/" + username.value + "/" + password.value);
	xhr.send(null);
}

function resetPassword(password) {
	var args = location.hash.split("/");
	
	ajaxGet("work/reset/" + args[2] + "/" + args[3] + "/" + password.value, null, function(data) {
		switch (data) {
			case 0:
				callback("Please use a password with 3 or more characters.");
				break;
			case 1:
				location.href = "/";
				break;
			case -2:
				callback("The reset link is invalid or expired. Please try resetting again.");
				break;
			case -1:
			default:
				alert("Something is wrong with the server. Smack it for me.");
		}
	});
}

function forgotPassword() {
	if (_g("username").value != "") {
		ajaxGet("work/forgot/" + _g("username").value, null, function(result) {
			if (result) {
				callback("Your password has successfully been reset.<br>Please check your email for further instructions.");
			} else {
				callback("That username or email is not registered to anyone.");
			}
		});
	}
}

function signUp(username,email,password,errors) {
	var s = location.hash.split("/");

	if (errors.value != "") return;

	ajaxGet("work/signup/" + s[2] + "/" + username.value + "/" + email.value + "/" + encodeURIComponent(password.value), null, function(data) {
		console.log(data);
		if (data === 1) {
			trySignin(username,password,"http://sparklr.me/welcome");
		} else {
			if (data === 3) {
				callback("Your IP address has been disabled for abuse reasons. Please contact app@sparklr.me to have this corrected. Sorry about that. Spammers suck and make everyone's lives harder.");
			}
			if (data === 2) {
				callback("It appears that your email is already in use.");
			} else {
				callback("Uh oh! It appears that your invite ID is invalid.<br>Contact jonathan@sparklr.me and we'll get this fixed.");
			}
		}
	});
}

function checkSignupForm(username,password,errors) {
	if (username.value != username.value.replace(/[^A-Za-z0-9]/g, "")) {
		callback("Usernames may only contain letters or numbers");
		errors.value = 1;
		return;
	}
	if (username.value.length > 25) {
		callback("That username is a tad long... longer isn't always better.");
		errors.value = 1;
		return;
	}
	ajaxGet("work/checkusername/" + username.value, null, function(data) {
		if (data) {
			callback("Sorry, that username has already been taken.");
			errors.value = 1;
		} else {
			callback("");
			errors.value = "";
		}
	});
}

function callback(message) {
	_g("callback").style.opacity = 0;
	setTimeout(function() {
		_g("callback").innerHTML = message;
		_g("callback").style.opacity = 1;
	}, 400);
}

