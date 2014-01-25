/* Sparklr
 * Timeline
 */

// Store the events on the stream. TODO: how much is this really used?
var timelineEvents = [[]];

var imgAttachments = null;

var hiddenPostList = [];

var missingPosts = 0;

var commentCounts = {};

var oldestPost = Number.MAX_VALUE;

function addTimelineEvent(item,append) {
	if (hiddenPostList.indexOf(item.id) !== -1) return;

	if (_g("post_" + item.id)) {
		if (item.commentcount) {
			if (item.delta)
				updateCommentCount(item.id, commentCounts[item.id] + item.commentcount);
			else
				updateCommentCount(item.id, item.commentcount);
		}
		if (item.message)
			_g("postcontent_" + item.id).innerHTML = processPost(item);
		return;
	}
	if (!item.message && item.type !== 1) return;

	if (!append && doctop > 10) {
		missingPosts++;
		newPosts(missingPosts);
		return;
	}
	
	if (HIDDEN_USERS.indexOf(item.from.toString()) != -1) return;

	var ev = document.createElement("div");

	ev.className = "timelineitem fadein";
	ev.id = "post_" + item.id;
	ev.onclick = function(e) { 
		if (!e) e = window.event;
		if (!e.target.onclick || e.target == ev)
			showPost(item.id);
	}

	item = processPostMeta(item);

	eval(getTemplate("timelineitem"));

	ev.innerHTML = html;

	var parent = _g("timeline_container");
	if (append || parent.children.length < 1) {
		parent.appendChild(ev);
	} else {
		parent.insertBefore(ev, parent.children[0]);
	}

	if (item.tags) {
		renderTags(item);
	}

	if (item.commentcount) {
		updateCommentCount(item.id, item.commentcount);
	} else {
		item.commentcount = 0;
	}

	if (item.time < oldestPost)
		oldestPost = item.time;
}

function addTimelineArray(arr, timeline, append) {
	if (!timelineEvents[timeline])
		timelineEvents[timeline] = [];

	if (append) {
		for (var i = 0; i < arr.length; i++) {
			timelineEvents[timeline].unshift(arr[i]);
		}
	} else {
		for (var i = arr.length - 1; i >= 0; i--) {
			timelineEvents[timeline].push(arr[i]);
		}
	}
}

function renderTags(item) {
	if (!item.tags) return;

	var post = _g("picturepost_" + item.id);
	var html = "";

	for (var i = 0; i < item.tags.length; i++) {
		html += "<div style='top:" + item.tags[i].y + "px;left:" + item.tags[i].x + "px;'>";
		if (item.tags[i].userid) {
			html += "<a href='#/user/" + item.tags[i].userid + "' onclick='stopBubbling();'><img class='littleavatar' src='" + getAvatar(item.tags[i].userid) + "'></a>";
		}
		html += item.tags[i].tag + "</div>";
	}

	post.innerHTML += html;
}

function fetchOlderPosts() {
	if (currentPageType !== "STREAM") return;
	console.log('getting some old posts');
	if (subscribedStream == null) return;
	var query = streamUrl(0,oldestPost);

	ajax(query,null,function(data) {
		var items = data.timeline || data;
		addTimelineArray(items,subscribedStream,true);
		for (var i = items.length - 1; i > 0 ; i--) {
			addTimelineEvent(items[i], true);
		}
	});
}

function renderComposer(caption, keydown, minipreview, id) {
	imgAttachments = null;
	eval(getTemplate('composer'));
	return html;
}

function renderTimeline(prehtml) {
	eval(getTemplate('timeline'));
	html = (prehtml || "") + html;
	_g("content").innerHTML = html;
	_g("attachment").onmousedown = function (e) {
		console.log(e);

		var node = _g("attachment");
		var x = 0;
		var y = -(document.body.scrollTop || document.documentElement.scrollTop);

		while (node) {
			x += node.offsetLeft;
			y += node.offsetTop;
			node = node.offsetParent;
		}

		var region = document.createElement("div");
		region.setAttribute("contenteditable", true);
		region.style.top = (e.clientY - y) + "px";
		region.style.left = (e.clientX - x) + "px";
		_g("attachment").appendChild(region);

		setTimeout(function() { region.focus(); }, 100);
		region.onkeydown = function(e) {
			if (e.keyCode == 13) {
				stopBubbling(e);

				var selected = selectedSuggestionBoxItem();
				var userid = selected ? selected.getAttribute("data-id") : "";
				var html = selected ? selected.innerHTML : region.textContent;

				region.setAttribute("data-tag", selected ? selected.textContent : region.textContent);

				region.innerHTML = html;
				region.blur();
				region.setAttribute("data-userid", userid);
				showSuggestionBox(false);
				return false;
			}
			if (e.keyCode == 40)  //down
				suggestionBoxNextItem();
		}
		region.onkeyup = function(event) {
			if (event.keyCode == 38 || event.keyCode == 40) return;
			var items = getUserSuggestions(region.textContent);

			showSuggestionBox(items.length,(e.clientX),(e.clientY + 30),items);
			suggestionBoxCallback = function(id,title) { 
				region.innerHTML = "<img class='littleavatar' src='" + getAvatar(id) + "'>" +title;
				region.setAttribute("data-userid", id);
				region.setAttribute("data-tag", title);
			}
		}
		region.onblur = function () {
			if (!region.textContent) {
				_g("attachment").removeChild(region);
				region = null;
				stopBubbling(e);
			} else {
				region.setAttribute("data-tag", region.textContent);
			}
			showSuggestionBox(false);
		}
		region.onmousedown = stopBubbling;
	}
	currentComments = [];

	document.body.ondrop = function (e) { dropImage(e, uploadStreamImageCallback); }

	currentPageType = "STREAM";
}

function newPosts(num) {
	var e = _g("newposts");

	if (!e) return;

	e.style.display = 'block';
	e.className = 'fadein';
	e.innerHTML = num + ' new post' + ((num != 1) ? 's' : '');
}

function postToTimeline() {
	var vars = {
		body: _g("composer_composer").value,
		network: subscribedStream
	};

	setTimeout('_g("composer_composer").value = "";expandTextarea({ target: _g("composer_composer") });',10);

	if (imgAttachments != null) {
		if (imgAttachments.target.result.length > 15728640) {
			showBanner("That image is too large to upload. Please try one with a smaller file size.","toolarge",5000);
			//return;
		}
		_g("attachment").className += " pulse";
		vars.img = true; 
		vars.tags = [];
		var a = _g("attachment").children;
		for (var i = 0; i < a.length; i++) {
			if (a[i].src) continue; // img element
			vars.tags.push({ x: a[i].style.left.replace("px",""), 
						   y: a[i].style.top.replace("px",""),
						   tag: a[i].getAttribute("data-tag"),
						   userid: a[i].getAttribute("data-userid"), });
		}
	} else {
		if (!vars.body) return;
	}
	if (vars.img)
		vars.postData = imgAttachments.target.result;

	ajax('post', vars, function(data) {
		if (data == 2) {
			showBanner("You've been posting a lot lately.. wait a few seconds. It'll keep people from being mad at you. ;)", "ratelimit", 5000);
			return;
		}
		//Complete
		_g("attachment").style.display = "none";
		_g("attachment").className = "attachment picturepost";
		_g("attachment").innerHTML = "";

		imgAttachments = null;

		hideProgress();
		pollData();
	});
}

function uploadStreamImageCallback(e,id) {
	var res = e.target.result;
	if (res.indexOf("data:base64") != -1) {
		res = "data:image/jpeg;" + res.substring(5);
	}
	id = id || "attachment";
	console.log(id);
	_g(id).innerHTML = "<img src='" + res + "'>";
	_g(id).style.display = "block";
	imgAttachments = e;
}

