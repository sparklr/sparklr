var pageActive = true;

//Time savers
function _g(id) { return document.getElementById(id); }

//Popups
function showPopup(content) {

	fadeOutPage();

	var popup = document.createElement("div");
	popup.className = "popup";
	popup.id = "popup_" + Math.random();


	setTimeout(function() { popup.style.opacity = 1; }, 10);


	popup.innerHTML = content;

	document.body.appendChild(popup);

}

function hidePopup(id) {
	var popup = _g(id);

	popup.style.opacity = 0;

	setTimeout(function() { document.body.removeChild(popup); }, 800);
}


function hideAllPopups() {
	var divs = document.getElementsByTagName("div");

	for(var i = 0; i < divs.length; i++) {
		if (divs[i].id.substring(0,6) == "popup_") {
			hidePopup(divs[i].id);
		}
		if (divs[i].className == "fader fadein") {
			divs[i].style.opacity = 0;
			var toremove = divs[i];
			setTimeout(function() {
				document.body.removeChild(toremove);
			}, 1000);
		}
	}
}

function fadeOutPage() {
	var f = document.createElement("div");
	f.className = "fader fadein";
	f.onclick = function() { hideAllPopups(); }
	document.body.appendChild(f);
}

function showConfirm(caption, message, action) {
	var popup = document.createElement("div");
	popup.className = "confirm fadein";
	popup.id = "popup_" + Math.random();

	popup.innerHTML = "<h2>" + caption + "</h2>" + message + "<br><div style='float:right'><input type='button' onClick='" + action + ";hideAllPopups();' value='Yes'><input type='button' onClick='hideAllPopups();' value='No'></div>";

	document.body.appendChild(popup);
}

function processMedia(text) {
	var urlexp = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:([^\s()<>.]+[.]?)+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
		text = text.replace(urlexp, function (match, p1, p2, p3, p4, p5) {
		var url = match;

		if (match.indexOf("http") == -1)
			url = "http://" + match;

		if (match.length > 40) {
			match = match.substring(0, 40) + "...";
		}

		var html = "<a href='" + url + "' target='_blank'>" + match + "</a>";

		if (url.indexOf(".jpg") != -1 || url.indexOf(".png") != -1 || url.indexOf(".gif") != -1) {
			console.log("Image: " + url);
			html = "<img src='" + url + "' class='fadein inlineimage' style='display:none;' onLoad='this.style.display=\"inline-block\";'><br>" + html;
		}

		return html;
		});

	var mentionregex = /\B@([\w-]+)/gi;
	text = text.replace(mentionregex, function(match, user) {
		return "<a href='#/user/" + user + "'>" + match + "</a>";
	});
	return text;
}

function getRelativeTime(time) {
	var str = "";
	if (time < 60) {
		return "now";
	} else {
		if (time / 60 < 60) {
			str = Math.floor((time / 60)) + " minutes";
		} else {
			if (((time / 60) / 60) < 24) {
				str = Math.floor(((time / 60) / 60)) + " hours";
			} else {
				str = Math.floor((((time / 60) / 60) / 24)) + " days";
			}
		}
	}
	if (str == "1 days") {
		str = "one day";
	}
	if (str == "1 hours") {
		str = "one hour";
	}
	if (str == "1 minutes") {
		str = "one minute";
	}

	return str + " ago";
}


function updateUI() { //interval that scans DOM, updates UI
	var arr = document.getElementsByTagName("*");
	for (i=0;i<arr.length;i++) {
		if (arr[i].className == "time" || arr[i].className.indexOf("time_raw") != -1) {
			arr[i].setAttribute("data-time", parseInt(arr[i].getAttribute("data-time"))+1);
			arr[i].innerHTML = getRelativeTime(parseInt(arr[i].getAttribute("data-time")));
		}
	}

}

setInterval("updateUI();", 1000);

window.addEventListener("scroll", function() {
	var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
	var diff = document.documentElement.scrollHeight - (scrollTop + window.innerHeight);
	if (diff < 600) {
		fetchOlderPosts();
	}
});

window.addEventListener("blur", function() {
	pageActive = false;
});

window.addEventListener("focus", function() {
	pageActive = true;
	handleNotifications();
});

function switchToBgMode() {
	_g("header").style.background = "rgba(0,0,0,0.4)";
}

function resetPage() {
	_g("header").style.background = "";
}

function stopBubbling(e) {
	if (!e)
		e = window.event;

	if (e.stopPropagation)
		e.stopPropagation();

	e.cancelBubble = true;
}
function updatePageTitle() {
	var title = "Instancy";
	if (newMessageFrom != "") {
		title = newMessageFrom + " messaged you";
	}
	if (notificationCount != 0) {
		title = "(" + notificationCount + ") " + title;
	}
	window.document.title = title;
}

function escapeHTML(text) {
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");

	return text;
}

// File uploads

function dropImage(e, callback) {
	if (!e) e = window.event;

	e.preventDefault();
	e.stopPropagation();

	callback(e.dataTransfer.files);

	return false;
}
function dropPrevent(e) {
	if (!e) e = window.event;

	e.dataTransfer.dropEffect = 'move';
	e.preventDefault();
	e.stopPropagation();
	return false;
}

