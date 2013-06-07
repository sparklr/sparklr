var timelineEvents = [[]];
var timelineTop = 0;
var subscribedStream;
var publicStream = false;
var currentPostBy;
var currentComments = [];
var imgAttachments = null;
var lastUpdateTime = Math.floor((new Date).getTime() / 1000);
var LIKE_CHAR = "\u261D";

function addTimelineEvent(item,append) {
	var ev = document.createElement("div");
	
	ev.className = "timelineitem fadein";
	ev.id = "event_" + item.id;
	ev.onclick = function() { location.href = "#/post/" + item.id; }

	eval(getTemplate("timelineitem"));

	ev.innerHTML = html;
	
	var parent = _g("timeline_container");
	if (append || parent.children.length < 1) {
		parent.appendChild(ev);
	} else {
		parent.insertBefore(ev, parent.children[0]);
	}
	if (item.commentcount)
		updateCommentCount(item.id, item.commentcount);
	else
		item.commentcount = 0;

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

function clearTimelineArray(timeline) {
	timelineEvents[timeline] = null;
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

	ajaxGet("work/repost", vars);
	location.href="#";
}

function showImage(img) {
	showPopup("<img src='" + STATICHOST + "/storage/images/" + img + ".jpg' onload='this.style.opacity=1'>", "lightbox");
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

function renderComment(comment) {
	var commentlist = _g("comments_" + comment.postid);

	var e = document.createElement("div");
	e.className = "comment";
	comment.like = comment.message == LIKE_CHAR;	

    var html = "<div style='display:inline-block;float:left;height:100%;margin-top:2px;' class='fadein'>";
		html += "<img class='avatar' src='" + getAvatar(comment.from) + "'>";
	html += "</div> <div class='rightcontrols'><div class='time' style='opacity:0.5' data-time='" + comment.time + "'></div>";

    if (comment.from == curUser) {
        html += "<br><a class='delete' onClick='deleteComment(\"" + comment.id + "\", \"" + comment.postid + "\");'>x</a>";
    }
    html += "</div> <a class='person' href='#/user/" + comment.from + "'>" + getDisplayName(comment.from) + "</a>";
	if (comment.like)
		html += " likes this<br><br>";
	else
		html += "<br><div style='margin-left: 55px;'>" + processMedia(escapeHTML(comment.message)) + "</div>";
	
	html += "</div>";
    e.innerHTML += html;
	commentlist.appendChild(e);
}

function getLastCommentTime() {
	if (currentComments.length == 0)
		return 0;
	return currentComments[currentComments.length - 1].time;
}

function getCommentSum() {
	//Summation of all the comment counts
	var count = 0;
	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		count += timelineEvents[subscribedStream][i].commentcount;
	}

	return count;
}

function addComments(comments) {
	for (var i = 0; i < comments.length; i++) {
		if (currentComments.indexOf(comments) != -1) continue; //this comment is already in the array
		currentComments.push(comments[i]);
		renderComment(comments[i]);
	}
	if (scrollDistanceFromBottom() < 70)
		window.scrollTo(0,0xFFFFFF);
}

function updateCommentCount(id, count, append) {
	var ele = _g("commentcount_" + id);
	if (ele == null) return; 
		
	ele.style.opacity = (count != 0) ? 1 : 0;


	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		if (timelineEvents[subscribedStream][i].id == id)
		{ 
			if (append) 
				timelineEvents[subscribedStream][i].commentcount += parseInt(count);
			else 
				timelineEvents[subscribedStream][i].commentcount = parseInt(count);
			ele.innerHTML = timelineEvents[subscribedStream][i].commentcount;
			break;
		}
	}
}
function updateCommentCounts(counts) {
	for (i in counts) {
		updateCommentCount(counts[i].postid, counts[i]["COUNT(`postid`)"],true);
	}
}

function postComment(vars) {
	var vars = vars || {
		to: currentPostBy,
		id: subscribedStream,
		comment: _g("composer").value
	}

	setTimeout('_g("composer").value="";',0);

	ajaxGet("work/comment", vars);
	pollData();
	
}

function likeEvent(id, to, callback) {
	ajaxGet("work/like", { id: id, to: to }, function() {
		callback.className += " jiggle";
		setTimeout(function() { callback.className = callback.className.replace(" jiggle", ""); }, 1000);
		pollData();
	});
}

function getLastPostTime() {
	if (typeof(timelineEvents[subscribedStream]) == 'undefined') return 0;
    if (timelineEvents[subscribedStream].length < 1) return 0;

	return timelineEvents[subscribedStream][timelineEvents[subscribedStream].length - 1].time;
}

function fetchOlderPosts() {
	var query;
	
	if (currentPageType == "BOARD")
		query = "work/board/" + subscribedStream + "?starttime=" + oldestBoardTime;
	else
		query = "work/stream/" + subscribedStream + "?starttime=" + timelineEvents[subscribedStream][0].time;
	if (currentPageType == "PHOTO")
		query += "&photo";

	ajaxGet(query,null,function(data) {
		if (data.timeline) { 
		addTimelineArray(data.timeline,subscribedStream,true);
		for (var i = data.timeline.length - 1; i > 0 ; i--) {
			addTimelineEvent(data.timeline[i], true);
		}
		updateCommentCounts(data.commentcounts);
		lastUpdateTime = Math.floor((new Date).getTime() / 1000);
		}
		else {
			addBoardItems(data,true);
		}
	});
}

function renderTimeline() {
	var html = "<div class='timelineitem'>";
	html += "<div class='picturepost' id='attachment'></div>";
	html += "<img src='" + getAvatar(curUser) + "' class='avatar'><textarea id='composer' placeholder='Share something...' onkeydown='isEnter(event, postToTimeline);'></textarea></div><div id='timeline_container'></div>";
	_g("content").innerHTML = html;
	
	currentComments = [];

	document.body.ondrop = function (e) { dropImage(e, uploadStreamImageCallback); }

	currentPageType = "STREAM";
}

function postToTimeline() {
	var vars = {
		body: _g("composer").value
	};

	setTimeout('_g("composer").value = "";',0);

	if (imgAttachments != null) {
		_g("attachment").className += " pulse";
		vars.img = true; 
	}
	
	var xhr = new XMLHttpRequest();
	
	xhr.addEventListener("load", function() {
		//Complete
		_g("attachment").style.display = "none";
		_g("attachment").className = "picturepost";
		
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

function uploadStreamImageCallback(files) {
	var reader = new FileReader();
	reader.onload = function(e) { 
		_g("attachment").style.backgroundImage = "url(" + e.target.result + ")";
		_g("attachment").style.display = "block";
		imgAttachments = e;
	}
	reader.readAsDataURL(files[0]);
}

