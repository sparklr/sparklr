var timelineEvents = [[]];
var timelineTop = 0;
var subscribedStream;
var isNetwork;
var currentPostBy;
var currentComments = [];
var imgAttachments = null;
var lastUpdateTime = Math.floor((new Date).getTime() / 1000);
var LIKE_CHAR = "\u261D";

var hiddenPostList = [];

var joinedNetworks = [];

function addTimelineEvent(item,append) {
	if (hiddenPostList.indexOf(item.id) !== -1) return;

	if (_g("event_" + item.id)) {
		updateCommentCount(item.id, item.commentcount);
		return;
	}
	if (HIDDEN_USERS.indexOf(item.from.toString()) != -1) return;
	if (timelineEvents[subscribedStream]) {
		for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
			if (timelineEvents[subscribedStream][i].message == item.message && timelineEvents[subscribedStream][i].id != item.id && item.from != curUser && item.via) {
				return;
			}
		}
	}

	var ev = document.createElement("div");

	ev.className = "timelineitem fadein";
	ev.id = "event_" + item.id;
	ev.onclick = function(e) { 
		if (!e) e = window.event;
		if (!e.target.onclick || e.target == ev)
			location.href = "#/post/" + item.id; 
	}

	if (item.type == 1) {
		item = processPostMeta(item);
	}

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

	if (item.time > lastUpdateTime)
		lastUpdateTime = item.time;
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

function showEvent(id,args) {
	if (typeof(args) === "undefined")
		var args = "";

	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		if (timelineEvents[subscribedStream][i].id == id) {
			location.href = "#/post/" + id + "/" + args;
		}
	}
}

function processPostMeta(data) {
	if (data.type == 1) {
		data.img = data.meta.split(",")[0];
		if (data.meta.indexOf(",") != -1) {
			try {
				data.tags = JSON.parse(data.meta.substring(data.meta.indexOf(",") + 1));
			} catch (er) { }
		}
	}

	return data;
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

function repost(id) {
	_g("responseholder").style.display = "none";
	_g("reblogholder").style.display = "block";
	_g("repostcomment").focus();
}

function publishRepost() {
	var vars = {
		id: subscribedStream,
		reply: _g("repostcomment").value
	}

	if (imgAttachments) {
		vars.postData = imgAttachments.target.result;
		vars.img = 2;
		_g("attachment").style.display = "none";
	}

	ajaxGet("work/repost", vars);
	location.href="#";
}

function showImage(img) {
	var imgpath = imgUrl(img,true);
	if (MOBILE) {
		window.open(imgpath);
	} else {
		showPopup("<img src='"+imgpath+"' onload='this.style.opacity=1'>", "lightbox");
	}
}

function deletePost(id) {
	showConfirm("Delete post", "Are you sure you want to delete this post?", function () {
		ajaxGet("work/delete/post/" + id, null, function() {
			location.href = "#";
		});
		timelineEvents[0] = [];
		lastUpdateTime = 0;
	});
}

function deleteComment(id,postid) {
	showConfirm("Delete comment", "Are you sure you want to delete this comment?", function () {
		ajaxGet("work/delete/comment/"+ id, null, function() {
			location.href = window.location + "#";
		});
	});
}

function hidePost(id,from) {
	showConfirm("Hide post", "Are you sure you want to hide this post?", function () {
		location.href = "#";
		showBanner("Post hidden. If you continue to have issues with this user, you may <a href='javascript:addUserToServerList(0," + from + ",1);'>blacklist him/her</a>.", "bannerhidden", 5000);

		hiddenPostList.push(id);
		var g = _g("event_" + id);
		if (g)
			g.style.display = "none";
		timelineEvents[0] = [];
		lastUpdateTime = 0;
	});
}

function renderComment(comment) {
	var commentlist = _g("comments_" + comment.postid);

	var e = document.createElement("div");
	e.className = "comment";
	comment.like = comment.message == LIKE_CHAR;	
	if (comment.like) {
		if (_g("like_" + comment.from))
			return;
		e.id = "like_" + comment.from;
		if (comment.from == curUser) 
			_g("likebtn").className += " liked";
	}

	var html = "<div style='display:inline-block;float:left;height:100%;margin-top:2px;' class='fadein'>";
	html += "<a href='#/user/" + comment.from + "'><img class='littleavatar' src='" + getAvatar(comment.from) + "'></a>";
	html += "</div> <div class='rightcontrols'><div class='time' style='opacity:0.5' data-time='" + comment.time + "'></div>";

	if (comment.from == curUser) {
		html += "<br><a class='delete' onClick='deleteComment(\"" + comment.id + "\", \"" + comment.postid + "\");'></a>";
	}
	html += "</div> <a class='person' href='#/user/" + comment.from + "'>" + getDisplayName(comment.from) + "</a>";
	if (comment.from == 4 || comment.from == 6) {
		html += " <span class='mod'>admin</span>";
	}
	if (comment.like) {
		html += " likes this<br><br>";
	}
	else
		html += "<div style='margin-left: 50px;'>" + processMedia(escapeHTML(comment.message)) + "</div>";

	html += "</div>";
	e.innerHTML += html;
	commentlist.appendChild(e);
}

function getLastCommentTime() {
	if (currentComments.length == 0)
		return 0;
	return currentComments[currentComments.length - 1].time;
}

function getLastStreamTime(stream) {
	if (!timelineEvents[stream] || timelineEvents[stream].length == 0)
		return 0;
	return timelineEvents[stream][timelineEvents[stream].length - 1].modified;
}

function addComments(comments) {
	comments = comments.data || comments;
	if (!comments.length) return;

	if (scrollDistanceFromBottom() < 70)
		setTimeout('window.scrollBy(0,0xFFFFFF);',0);

	for (var i = 0; i < comments.length; i++) {
		if (currentComments.indexOf(comments) != -1) continue; //this comment is already in the array
		currentComments.push(comments[i]);
		renderComment(comments[i]);
	}
}

function updateCommentCount(id, count) {
	var ele = _g("commentcount_" + id);
	if (ele == null) return; 

	ele.style.opacity = (count != 0) ? 1 : 0;
	ele.innerHTML = count || "+";
}

function postComment(e) {
	var vars = {
		to: currentPostBy,
		id: subscribedStream,
		comment: _g("composer").value
	}

	if (imgAttachments) {
		vars.postData = imgAttachments.target.result;
		vars.img = 2;
		_g("attachment").style.display = "none";
	}

	setTimeout(function() {
		_g("composer").value="";
		expandTextarea(e);
	},10);

	if (!vars.comment && !vars.postData) return;

	ajaxGet("work/comment", vars, function() {
		imgAttachments = null;
		pollData();
	});

}

function likeEvent(id, to, callback) {
	ajaxGet("work/like", { id: id, to: to }, function(result) {
		if (result.deleted && callback.id == "likebtn") {
			location.href = location.href + "#";
			return;
		}
		if (callback.innerHTML == "Like") 
			callback.innerHTML = "Unlike";
		else
			callback.className += " jiggle";

		setTimeout(function() { callback.className = callback.className.replace(" jiggle", ""); }, 1000);
		pollData();
	});
}

function streamUrl(since,start) {
	var query = "/";
	var part = "stream/";

	if (currentPageType == "TAG")
		part = "tag/";
	if (currentPageType == "MENTIONS")
		part = "mentions/";

	if (start || (document.body.scrollTop || document.documentElement.scrollTop) < 10)
		query += part + subscribedStream + "?since=" + since;
	else 
		query = "?";

	if (start)
		query += "&starttime=" + start;

	if (currentPageType == "PHOTO")
		query += "&photo=1";
	if (isNetwork)
		query += "&network=1";

	return query;
}

function fetchOlderPosts() {
	if (subscribedStream == null || !timelineEvents[subscribedStream] || timelineEvents[subscribedStream].length < 1) return;
	var query = "work" + streamUrl(0,timelineEvents[subscribedStream][0].time);

	ajaxGet(query,null,function(data) {
		var items = data.timeline || data;
		addTimelineArray(items,subscribedStream,true);
		for (var i = items.length - 1; i > 0 ; i--) {
			addTimelineEvent(items[i], true);
		}
	});
}

function renderComposer(caption, keydown, minipreview, id) {
	imgAttachments = null;
	var html = "<div style='position:relative' class='composer'>";
	html += "<div style='float:left'><img src='" + getAvatar(curUser) + "' class='avatar'><div id='remaining'></div></div><div id='composerframe'>";
	if (minipreview) {
		html += "<div id='attachment" + (id || "") + "' class='minipreview'></div>";
	}
	html += "<textarea id='" + (id || "composer") + "' placeholder='" + caption + "' onkeydown='isEnter(event, " + keydown + ");expandTextarea(event);' maxlength=500></textarea>";
	html += "<div class='composercontrols'><input id='attachfile' data-target='attachment" + (id || "") + "' onchange='attachfile_changed(event,\"" + (id || "") + "\")' type='file'></div>";
	html += "</div></div>";
	return html;
}

function renderTimeline(prehtml) {
	var html = prehtml || "";
	html += "<div class='timelineitem'>";
	html += "<div class='picturepost attachment' id='attachment'></div>";
	html += renderComposer("Post something...", "postToTimeline");
	html += "</div><div id='timeline_container'></div>";
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

function postToTimeline() {
	var vars = {
		body: _g("composer").value
	};

	setTimeout('_g("composer").value = "";expandTextarea({ target: _g("composer") });',10);

	if (imgAttachments != null) {
		if (imgAttachments.target.result.length > 15728640) {
			showBanner("That image is too large to upload. Please try one with a smaller file size.","toolarge",5000);
			return;
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

	if (isNetwork) {
		vars.network = subscribedStream;
	}

	var xhr = new XMLHttpRequest();

	xhr.addEventListener("load", function() {
		if (xhr.responseText == "2") {
			showBanner("You've been posting a lot lately.. wait a few seconds. It'll keep people from being mad at you. ;)", "ratelimit", 5000);
			return;
		}
		//Complete
		_g("attachment").style.display = "none";
		_g("attachment").className = "attachment picturepost";
		_g("attachment").innerHTML = "";

		imgAttachments = null;

	}, false);
	xhr.open("POST", "work/post");
	xhr.setRequestHeader("X-X", AUTHKEY);

	xhr.setRequestHeader("Content-type", "application/json");
	xhr.setRequestHeader("X-DATA", JSON.stringify(vars));
	if (vars.img) 
		xhr.send(imgAttachments.target.result);
	else
		xhr.send();
}

function uploadStreamImageCallback(e,id) {
	var res = e.target.result;
	if (res.indexOf("data:base64") != -1) {
		res = "data:image/jpeg;" + res.substring(5);
	}
	id = id || "attachment";
	_g(id).innerHTML = "<img src='" + res + "'>";
	_g(id).style.display = "block";
	imgAttachments = e;
}

function addNetwork(network) {
	if (network == "" || network == "0") return;
	_g("networks").innerHTML += "<a id='network_" + network + "' href='#/" + network + "'>/" + network + "</a>";
	_g("dropdown_networklist").innerHTML += "<a id='d_network_" + network + "' href='#/" + network + "'>" + network + "</a>";
}

function removeNetwork(network) {
	_g("networks").removeChild(_g("network_" + network));
	_g("dropdown_networklist").removeChild(_g("d_network_" + network));
}

function trackNetwork() {
	ajaxGet("work/track/" + subscribedStream, null, function() {
		joinedNetworks.push(subscribedStream);
		addNetwork(subscribedStream);
		updateTrackNetwork();
	});
}

function untrackNetwork() {
	ajaxGet("work/untrack/" + subscribedStream, null, function() {
		joinedNetworks.splice(joinedNetworks.indexOf(subscribedStream),1);
		removeNetwork(subscribedStream);
		updateTrackNetwork();
	});
}

function updateTrackNetwork() {
	var e = _g("trackbtn");
	if (joinedNetworks.indexOf(subscribedStream) != -1) {
		e.value = "Untrack";
		e.onclick = function() { untrackNetwork(); };
	} else {
		e.value = "Track";
		e.onclick = function() { trackNetwork(); };
	}
}

