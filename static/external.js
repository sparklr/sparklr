window.addEventListener("hashchange", function() { updatePages(false); });
window.addEventListener("load", function() { updatePages(true) });

function updatePages(loaded) {
	if (location.href.indexOf("/forgot/") != -1 && location.hash == "") {
		location.href = "/#" + location.href.substring(location.href.indexOf("/forgot"));
		return;
	}
	var args = location.hash.split("/");
	var html = "";
	var pages = _g("pages");
	
	for (var i = 0; i < pages.childNodes.length; i++) {
		if (pages.childNodes[i].getAttribute("data-page") == args[1]) {
			html = pages.childNodes[i].innerHTML;
		}
	}
	
	if (html == "")
		html = _g("loginform").innerHTML;

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

function trySignin(username, password, redir) {
	var xhr = new XMLHttpRequest();
	
	_g("loginform").className = "";
	if (username.value == "")
		return;	

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			switch (xhr.responseText)
			{
				case "true":
					location.href = redir || "./";
				break;
				case "false":
					password.value = "";
					_g("content").className = "shake";
					callback("Incorrect username or password");
				break;
				default:
					callback("Failed to contact the server. Try again.");
				break;
			}
		}
	}
	
	xhr.open("POST", "api/signin/" + username.value + "/" + password.value);
	xhr.send(null);
}

function resetPassword(password) {
	var args = location.hash.split("/");
	
	ajax("reset/" + args[2] + "/" + args[3] + "/" + password.value, null, function(data) {
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
		ajax("forgot/" + _g("username").value, null, function(result) {
			if (result) {
				callback("Your password has successfully been reset.<br>Please check your email for further instructions.");
			} else {
				callback("That username or email is not registered to anyone.");
			}
		});
	}
}

function newAccount() {
	ajax("resetcookie", null, function(data) {
		location.href = './';
	});
}

function callback(message) {
	_g("callback").style.opacity = 0;
	setTimeout(function() {
		_g("callback").innerHTML = message;
		_g("callback").style.opacity = 1;
	}, 400);
}

