var pageActive = true;

//Time savers
function _g(id) { return document.getElementById(id); }

//Popups
function showPopup(content,classname) {
	
	fadeOutPage();

	var popup = document.createElement("div");
	if (typeof(classname) == "undefined")
		popup.className = "popup";
	else 
	{
		popup.className = classname;
		popup.onclick = function() { hideAllPopups() };
	}

	popup.id = "popup_" + Math.random();
	
	
	setTimeout(function() { popup.style.opacity = 1; }, 10);
	
	
	popup.innerHTML = content;
	
	document.body.appendChild(popup);	
}

function hidePopup(id) {
	var popup = _g(id);
	
	popup.style.opacity = 0;
	
	setTimeout(function() { _g(id).parentNode.removeChild(popup); }, 800);
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
	f.id = "fader";
	f.className = "fader fadein";
	f.onclick = function() { hideAllPopups(); }
	document.body.appendChild(f);
}

function showConfirm(caption, message, action) {
	var popup = document.createElement("div");
	popup.className = "confirm fadein";
	popup.id = "popup_" + Math.random();
	
	popup.innerHTML = "<h2>" + caption + "</h2>" + message + "<br><div style='float:right'><input type='button' id='confirmdialog_yes' value='Yes'><input type='button' onClick='hideAllPopups();' value='No'></div>";

	document.body.appendChild(popup);

	_g("confirmdialog_yes").onclick = function() {
		action();
		hideAllPopups();
	};
}

function processPost(post) {
	var message = processMedia(escapeHTML(post.message));

	var lines = message.split("\n");
	var lineexp = /^\[([\d]+)\](.*)/gm; //liine starts with [ID]
	var result = "";
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].substring(0,1) == "[") {
			result = "<blockquote>" + result + "</blockquote>" + lines[i].replace(lineexp, function(match, num, text) {
			var line = "";
			if (i != lines.length - 1 || num != post.from) {
				line = "<img src='" + getAvatar(num) + "' class='littleavatar'><a href='#/user/" + num + "'>" + getDisplayName(num) + "</a>: ";
			}
			line += text;
			return line;
			}); 
		} else {
			result += lines[i];
		}
	}
	return result;
}


function processMedia(text,noImages) {
	var urlexp = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:([^\s()<>.]+[.]?)+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'\".,<>?«»“”‘’]))/gi; 
		text = text.replace(urlexp, function (match, p1, p2, p3, p4, p5) {
		var url = match;
	
		if (match.indexOf("http") == -1)
			url = "http://" + match;
		
		if (match.length > 40) {
			match = match.substring(0, 40) + "...";
		}

		var html = "<a href='" + url + "' target='_blank'>";

		if (!noImages) {
			if (url.indexOf(".jpg") != -1 || url.indexOf(".png") != -1 || url.indexOf(".gif") != -1) {
				html += "<img src='" + url + "' class='fadein inlineimage' style='display:none;' onLoad='this.style.display=\"block\";'><br>";
			}
		}
		html += match + "</a>";

		return html;
		});

	var mentionregex = /\B@([\w-]+)/gi;
	text = text.replace(mentionregex, function(match, user) {
		return "<a href='#/user/" + user + "'>" + match + "</a>";
	});

	var tagregex =  /\B#([\w-]+)/gi;
	text = text.replace(tagregex, function(match, tag) {
		return "<a href='#/tag/" + tag + "' class='tag'>" + match + "</a>";
	});

	return text;
}

function getRelativeTime(time) {
	time = ((new Date).getTime() / 1000) - time; // Convert to relative time

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
	var arr = document.getElementsByTagName("div");
	for (i=0;i<arr.length;i++) {
		if (arr[i].className == "time" || arr[i].className.indexOf("time_raw") != -1) {
			arr[i].innerHTML = getRelativeTime(parseInt(arr[i].getAttribute("data-time")));
		}
	}
}

setInterval("updateUI();", 1000);

function scrollDistanceFromBottom() {
	var doctop = document.body.scrollTop || document.documentElement.scrollTop;
	return diff = document.documentElement.scrollHeight - (doctop + window.innerHeight);
}

function scrollToTop() {
	scrollTo(document.body.scrollTop ? document.body : document.documentElement, 0, 500);
}
 
function scrollTo(element, to, duration) {
    var initial = element.scrollTop,
        delta = to - initial,
        curtime = 0,
        step = 20;
       
    var animate = function() {        
        curtime += step;
       
        if (curtime == duration)
            return element.scrollTop = initial + delta;
        else
            element.scrollTop = initial + delta * (1 - Math.pow(2.5, -10 * curtime / duration));
       
        setTimeout(animate, step);
    };
    animate();
}


function isEnter(e,callback) {
	if (!e)
		e = window.event;
	if (e.keyCode == 13)
		callback();
}

function expandTextarea(e) {
	if (!e)
		e = window.event;
	var l = e.target.value.length;
	e.target.style.height = (2 + Math.floor((l / 110))) * 20 + "px";

	var r = _g("remaining");
	var toolong = l > 220;

	r.style.opacity = toolong ? 1 : 0;
	r.style.display = toolong ? "block" : "none";
	if (toolong) r.innerHTML = (300 - l);
	
}

function search() {
	location.href = "/#/search/" + escape(_g("searchbox").value);
}

function stopBubbling(e) {
	if (!e)
		e = window.event;
	
	e.cancelBubble = true;
	e.stopPropagation();
}

function updatePageTitle() {
	var title = "Sparklr";
	if (newMessageFrom != "") {
		title = newMessageFrom + " messaged you";
	}
	if (notificationCount != 0) {
		title = notificationCount + "* " + title;
	}
	setTimeout(function () { window.document.title = title; }, 0);
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
	
	loadImage(e.dataTransfer.files[0], callback);

	return false;
}
function loadImage(f, callback) {
	var reader = new FileReader();
	reader.onload = function(e) { 
		callback(e);
	}
	reader.readAsDataURL(f);
}

function dropPrevent(e) {
	if (!e) e = window.event;
	
	e.dataTransfer.dropEffect = 'move';
	e.preventDefault();
	e.stopPropagation();
	return false;
}

function uploadImage(e, url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr);
		}
	}
	xhr.open("POST", url);
	xhr.setRequestHeader("X-X", AUTHKEY);
	xhr.send(e.target.result);
}

function showSuggestionBox(show,x,y,items) {
	var e = _g("suggestionbox");
	var s = e.style;
	s.display = show ? "block" : "none";
	if (!items) return;
	s.top = y + "px";
	s.left = x + "px";
	var html = "";
	for (i in items) {
		html += "<div data-id='" + i + "' onmousedown='suggestionBoxCallback(" + i + ",\"" + items[i] + "\");'><img class='littleavatar' src='" + getAvatar(i) + "'>" + items[i] + "</div>";
	}
	e.innerHTML = html;
}
var suggestionBoxCallback = function() {};

function suggestionBoxNextItem() {
	var e = _g("suggestionbox");
	var selected = false;
	for (i in e.childNodes) {
		if (e.childNodes[i].className == "hover") {
			e.childNodes[i].className = "";
			i = parseInt(i);
			if (e.childNodes[i + 1]) {
				e.childNodes[i + 1].className = "hover";
				selected = true;
				break;
			}
		}
	}
	if (!selected) {
		e.childNodes[0].className = "hover";
	}
}

function selectedSuggestionBoxItem() {
	var e = _g("suggestionbox");
	for (i in e.childNodes) {
		if (e.childNodes[i].className == "hover")
			return e.childNodes[i];
	}
	return null;
}

function showSuggestionBoxBelowElement(e) {
	if (!e)
		e = window.event;

	var node = e.target;
	var x = 0;
	var y = 35;//(document.body.scrollTop || document.documentElement.scrollTop);

	while (node) {
		x += node.offsetLeft;
		y += node.offsetTop;
		node = node.offsetParent;
	}

	var items = getUserSuggestions(e.target.value);

	if (e.keyCode == 40)  //down
		return suggestionBoxNextItem();
	if (e.keyCode == 13) {
		stopBubbling();
		
		var selected = selectedSuggestionBoxItem();
		var userid = selected ? selected.getAttribute("data-id") : "";
		var title = selected ? selected.innerText : e.target.value;
		e.target.setAttribute("data-userid", userid);
		e.target.value = title;

		showSuggestionBox(false);
		return userid;
	}

	showSuggestionBox(items.length, x, y, items);

	suggestionBoxCallback = function(id,title) {
		e.target.value = title;
		e.target.setAttribute("data-userid", id);
		showSuggestionBox(false);
	};
}

function search_Keydown(e) {
	if (!e)
		e = window.event;

	var result = showSuggestionBoxBelowElement(e); 
	if (e.keyCode == 13) {
		if (result)
			return location.href="/#/user/" + result;
		search(e.target.value);
	}
}
