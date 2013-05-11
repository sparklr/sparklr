window.addEventListener("hashchange", function() { updatePages(false); });
window.addEventListener("load", function() { updatePages(true) });

function updatePages(loaded) {
	var args = location.hash.split("/");
	var html = "";

	for (var i = 0; i < _g("pages").childNodes.length; i++) {
		if (_g("pages").childNodes[i].getAttribute("data-page") == args[1]) {
			html = _g("pages").childNodes[i].innerHTML;
		}
	}
	
	if (html == "")
		html = _g("page_default").innerHTML;

	if (!loaded) {
		_g("content").style.opacity = 0;
		setTimeout(function() {
			_g("content").style.opacity = 1;
			_g("content").innerHTML = html;
		}, 500);
	} else {
		_g("content").innerHTML = html;
	}
	callback(""); //hide any old error messages
}

function requestInvite(email) {
	ajaxGet("work/requestinvite/" + email.value, null, function() {
		location.href = "#/thankyou";
	});
}

function trySignin(username, password) {
	var xhr = new XMLHttpRequest();
	
	_g("loginform").className = "";
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			switch (xhr.status)
			{
				case 200:
					location.href="./";
				break;
				case 403:
					password.value = "";
					_g("content").className = "shake";
					_g("forgot").style.opacity = 1;
				break;
				default:
					alert("Ooh, not good... Something is wrong with our server. Try again soon. Sorry!");
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

	ajaxGet("work/signup/" + s[2] + "/" + username.value + "/" + email.value + "/" + password.value, null, function(data) {
		if (data.insertId) {
			trySignin(username,password);
		} else {
			callback("Something went wrong!");
		}
	});
}

function checkSignupForm(username,password,errors) {
	if (username.value != username.value.replace(/[^A-Za-z0-9]/g, "")) {
		callback("Usernames may only contain letters or numbers");
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

