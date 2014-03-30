/* Sparklr
 * ui.js: Code related to common ui functions, such as formatting text
 * and handling the DOM
 */

var pageActive = true;

var newPageToFetch = false;

var doctop = 0;

var REGEX_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;

var REGEX_MENTIONS = /\B@([\w-]+)/gi;

var REGEX_TAGS = /(^|\s)#([\w-]{1,40})/gi;

var REGEX_IMG = /\[IMG([A-Za-z0-9\._-]+)\]/g;

var REGEX_EMOJI = /([\ud800-\udbff])([\udc00-\udfff])/g;

// Time saver
function _g(id) { return document.getElementById(id); }

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

	return popup.id;
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
	}

	_g('fader').className = '';
}

function fadeOutPage() {
	var f = _g('fader');
	f.className = 'show';
	f.onclick = function() { hideAllPopups(); }
}

function showConfirm(caption, message, action) {
	var popup = document.createElement("div");
	popup.className = "confirm fadein";
	popup.id = "popup_" + Math.random();
	
	//TODO
	popup.innerHTML = "<h2>" + caption + "</h2>" + message + "<br><div style='float:right'><input type='button' id='confirmdialog_yes' value='Yes'><input type='button' onClick='hideAllPopups();' value='No'></div>";

	document.body.appendChild(popup);

	_g("confirmdialog_yes").onclick = function() {
		action();
		hideAllPopups();
	};
}

//TODO: buggy. get rid of it, honestly.
function htmlToPost(html) {
	html = html.replace(/\<img src=\".*\/t([A-Za-z0-9_]+).*\"(^\>)*\>/, function(match, img) {
		return "[IMG"+img+"]";
	});
	html = html.replace(/\<a href=[\"\']([^\"\']*)[\"\'](.*)<\/a\>/, function(match, href) {
		return href;
	});
	html = html.replace(/\<br\>/g, "");
	return html;
}

// Handle the repost via: stuff.
function processPost(post) {
	var message = processMedia(escapeHTML(post.message));

	var lines = message.split("\n");
	var lineexp = /^\[([\d]+)\](.*)/gm; //line starts with [ID]
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

// Parse links, hashtags, @, imgs, etc
function processMedia(text,noImages) {
	var linkcount = 0;
	text = text.replace(REGEX_URL, function (match) {
		if (linkcount > 5) return;

		var url = match;

		if (match.indexOf("http") == -1)
			url = "http://" + match;
		
		if (match.length > 40) {
			match = match.substring(0, 40) + "...";
		}

		var html = "<a href='" + url + "' target='_blank'>" + match + "</a>";

		linkcount++;

		return html;
	});

	// mentions
	text = text.replace(REGEX_MENTIONS, function(match, user) {
		return "<a href='#/user/" + user + "'>" + match + "</a>";
	});

	// tags
	text = text.replace(REGEX_TAGS, function(match, foo, tag) {
		return " <a href='#/tag/" + tag + "' class='tag'>" + match + "</a>";
	});

	// img
	text = text.replace(REGEX_IMG, function(match, img) {
		return makeInlineImage(imgUrl(img), imgUrl(img,true));
	});
	
	// emoji
	text = text.replace(REGEX_EMOJI, function(match, b1, b2) {
		var cp = (b1.charCodeAt(0) - 0xD800) * 0x400 + (b2.charCodeAt(0) - 0xDC00) + 0x10000;
		return "<img src='" + IMGHOST + "/../eji/" + cp.toString(16) + ".png' style='vertical-align:bottom'>";
	});

	// limit the number of newlines allowed in a post
	var countnewlines = 0;
	text = text.replace(/\n/g, function() {
		countnewlines++;
		if (countnewlines < 8)
			return "<br>\n";
		else 
			return "\n";
	});
	
	return text;
}

// Returns a string of fuzzy time, i.e. "one minute ago"
// given a unix timestamp
function getRelativeTime(time) {
	// Convert to relative time
	time = ((new Date).getTime() / 1000) - time;

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

// scans DOM, updates time elements
function updateUI() { 
	var arr = document.getElementsByTagName("time");
	for (i=0;i<arr.length;i++) {
		arr[i].innerHTML = getRelativeTime(parseInt(arr[i].getAttribute("datetime")));
	}
}
setInterval("updateUI();", 1000);

// calculate how far we are from the bottom
function scrollDistanceFromBottom() {
	doctop = document.body.scrollTop || document.documentElement.scrollTop;
	return document.documentElement.scrollHeight - (doctop + window.innerHeight);
}

function scrollToTop() {
	var element = document.body.scrollTop ? document.body : document.documentElement;
    var initial = element.scrollTop,
        delta = -initial,
        curtime = 0,
        step = 20,
		duration = 500

	animate = function() {
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
	if (e.keyCode == 13 && !(e.ctrlKey || e.shiftKey))
		callback(e);
}

function expandTextarea(e) {
	if (!e)
		e = window.event;
	var l = e.target.value.length;
	e.target.style.height = (2 + Math.floor((l / 60))) * 20 + (23 * (e.target.value.split("\n").length - 1)) + "px";

	var r = _g("remaining_" + e.target.id);
	var toolong = l > 420;

	r.style.opacity = toolong ? 1 : 0;
	r.style.display = toolong ? "inline-block" : "none";
	if (toolong) r.innerHTML = (500 - l);
}

function stopBubbling(e) {
	if (!e)
		e = window.event;
	
	e.cancelBubble = true;
	if (e.stopPropagation)
		e.stopPropagation();
}

function updatePageTitle() {
	var title = "Sparklr";
	if (notificationCount != 0) {
		title = notificationCount + "* " + title;
	}
	setTimeout(function () { window.document.title = title; }, 10);
}

function escapeHTML(text) {
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");

	return text;
}

function dropImage(e, callback) {
	if (!e) e = window.event;
	
	e.preventDefault();
	if (e.stopPropagation)
		e.stopPropagation();
	
	loadImage(e.dataTransfer.files[0], callback);

	return false;
}

function loadImage(f, callback, additionalargs) {
	var reader = new FileReader();
	reader.onload = function(e) { 
		callback(e,additionalargs);
	}
	reader.readAsDataURL(f);
}

function dropPrevent(e) {
	if (!e) e = window.event;
	
	e.dataTransfer.dropEffect = 'move';
	e.preventDefault();
	if (e.stopPropagation)
		e.stopPropagation();
	return false;
}

function attachfile_changed(e) {
	if (!e) e = window.event;
	loadImage(e.target.files[0], uploadStreamImageCallback, e.target.getAttribute("data-target"));
	e.target.value = "";
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
	var y = 35;

	while (node) {
		x += node.offsetLeft;
		y += node.offsetTop;
		node = node.offsetParent;
	}

	var items = getUserSuggestions(e.target.value);

	if (e.keyCode == 40)  //down
		return suggestionBoxNextItem();
	if (e.keyCode == 13) {
		stopBubbling(e);
		
		var selected = selectedSuggestionBoxItem();
		var userid = selected ? selected.getAttribute("data-id") : "";
		var title = selected ? selected.textContent : e.target.value;
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

function search(query) {
	location.href = "/#/search/" + escape(query);
}

function search_Keydown(e) {
	if (!e)
		e = window.event;

	var result = showSuggestionBoxBelowElement(e); 

	suggestionBoxCallback = function(id) {
			return location.href="/#/user/" + id;
	};

	if (e.keyCode == 13) {
		if (result)
			return suggestionBoxCallback(result);
		search(e.target.value);
	}
}

// Returns an image url on the static host
function imgUrl(img,fullsize) {
	img = "" + img;
	if (img.indexOf(".") == -1) img += ".jpg";
	return IMGHOST + "/" + (!fullsize ? "t" : "") + img;
}

// Strips a DOM element from its parent
function removeDomElement(id) {
	var e = _g(id);
	if (e) {
		e.parentNode.removeChild(e);
	}
}

function scrollHandler() {
	doctop = document.body.scrollTop || document.documentElement.scrollTop;
	if (scrollDistanceFromBottom() < 600) {
		if (newPageToFetch) {
			fetchOlderPosts();
			newPageToFetch = false;
		}
	} else {
		newPageToFetch = true;
	}

	if (_g("sidepost_container")) { 
		if (~~subscribedStream === subscribedStream && doctop < 300) {
			_g("sidepost_container").className = 'user';
		} else {
			_g("sidepost_container").className = '';
		}
	}
}

function preventDefaultScroll(e) {
	if (!e) e = window.event;

	var ele = e.currentTarget;

	if (e.wheelDelta < 0 && ele.scrollTop >= ele.scrollHeight - ele.clientHeight) 
		e.preventDefault(); 
	if (e.wheelDelta > 0 && ele.scrollTop == 0)
		e.preventDefault();
}

function makeInlineImage(thumb, img) {
	return "<div style='background-image: url(" + thumb + ")' class='fadein inlineimage' onClick='showImage(\"" + img + "\");stopBubbling();'></div>";
}

