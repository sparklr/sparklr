document.write("<iframe name='worker' id='worker' style='display:none'></iframe>");

window.addEventListener("hashchange", updatePages);
window.addEventListener("load", function() { updatePages(true) });

function updatePages(loaded) {
	var args = location.hash.split("/");

	switch (args[1]) {
		case "signin":
			_g("info").style.opacity = 0;
			_g("loginform").style.display = "inline-block";
			setTimeout(function() { 
				_g("info").style.display = "none";
				_g("loginform").style.opacity = 1;
			}, 1000);
			_g("username").focus();

			if (location.hash.indexOf("forgot") != -1 && _g("username").value != "") {
				_g("worker").src = "work/forgot.php?u=" + _g("username").value;
				location.href='#/signin';
			}
			break;
		case "post":
			ajaxGet("pages/post.php?args=" + location.hash.substring(1), null, showPost);
			break;
		default:
			_g("info").style.display = "inline-block";
			setTimeout('_g("info").style.opacity = 1;',10);
			_g("loginform").style.opacity = 0;
			_g("loginform").style.display = "none";
			break;
	}
	_g("staticcontent").style.display = "block";
	_g("content").style.display = "none";
}

function renderExternalPage() {
	_g("content").style.display = "block";
	_g("staticcontent").style.display = "none";
	_g("content").innerHTML = "<div id='header'><div id='smalllogo' onclick='location.href=\"#\";'></div><div id='signup'>In closed preview. <a href='#'>Learn more</a>.</div></div></div><div id='innercontent'></div>";
}

function showImage(img) {
	showPopup("<img src='" + STATICHOST + "/storage/images/" + img + ".jpg' onload='this.style.opacity=1'>","lightbox");
}

function showPost(item) {
	renderExternalPage();

	USERHANDLES[item.from] = item.fromhandle;
	var html = "";

	html = "<div class='contentwrapper'>";

	if (item.type==1) {
		var images = item.meta.split(",");
		
		html += "<div class='picturepost' onClick='showImage(\"" + images[0] + "\");' style='background-image: url(" + STATICHOST + "/storage/images/" + images[0] + "_thumb.jpg);'></div>";
	}
	html += "<div id='event_" + item.id + "' class='fadein' style='padding: 7px; margin: -5px' onClick='showEvent(" + item.id + ")'><div style='display:inline-block;float:left;height:100%'><img class='avatar' src='" + getAvatar(item.from) + "'></div><div class='rightcontrols'><div class='time' data-time='" + item.time + "'></div>";
    html += "</div> <a href='#/user/" + item.from + "'>" + getDisplayName(item.from) + "</a><br>" + processPost(item) + "<br>";
	html += "</div>";

	html += "<hr><div id='responseholder'><div id='comments_" + item.id + "' style='padding:2px;'></div>";
	html += "</div>";
	_g("innercontent").innerHTML = html;
	for (var i = 0; i < item.comments.length; i++) {
		renderComment(item.comments[i]);
	}

	currentComments = item.comments;

	updateUI(); //time
}

function informMeCallback(res) {
	if (!res) {
		alert("Ooh, awkward...\nSeems our database is having issues.");
	} else {
		if (_g("error"))
			_g("error").style.opacity = 0;
		_g("info").style.opacity = 0;
		
		setTimeout(function() { 
			_g("info").style.opacity = 1;
			_g("info").innerHTML = "<span>Thank you.</span><br>We'll talk soon, right? &lt;3";
			}, 1000);
	}
}

function forgotCallback(res) {
	var e = _g("forgotcallback");
	if (!res) {
		e.innerHTML = "That username/email does not appear to be registered to anyone.";
		return;
	}
	e.innerHTML = "I sent a reset link to " + res;
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
					_g("loginform").className = "shake";
					_g("forgot").style.opacity = 1;
				break;
				default:
					alert("Ooh, not good... Something is wrong with our server. Try again soon. Sorry!");
				break;
			}
		}
	}
	
	xhr.open("POST", "work/signin.php");
	xhr.setRequestHeader("X-U", username.value);
	xhr.setRequestHeader("X-P", password.value);
	xhr.send(null);
}

