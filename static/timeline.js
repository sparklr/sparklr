var timelineEvents = [[]];
var subscribedStream;
var publicStream = false;
var currentPostBy;
var currentComments = [];
var imgAttachments = null;
var lastUpdateTime = Math.floor((new Date).getTime() / 1000);

function addTimelineEvent(item,append) {
	var ev = document.createElement("div");
	
	ev.className = "timelineitem fadein";
	ev.id = "event_" + item.id;
	ev.onclick = function() { location.href = "#/post/" + item.from + "/" + item.id; }

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
			location.href = "#/post/" + timelineEvents[subscribedStream][i].from + "/" + id + "/" + args;
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

	// add user, if we don't know them
	USERHANDLES[comment.from] = comment.fromhandle;

	var e = document.createElement("div");

    var html = "<div style='display:inline-block;float:left;height:100%' class='fadein'><img class='avatar' src='" + getAvatar(comment.from) + "'></div> <div class='rightcontrols'><div class='time' style='opacity:0.5' data-time='" + comment.time + "'></div>";
    
    if (comment.from == curUser) {
        html += "<br><a class='delete' onClick='deleteComment(\"" + comment.id + "\", \"" + comment.postid + "\");'>x</a>";
    }
    html += "</div> <a href='#/user/" + comment.from + "'>" + getDisplayName(comment.from) + "</a><br>" + processMedia(escapeHTML(comment.message)) + "</div><br><br>";
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
				timelineEvents[subscribedStream][i].commentcount += count;
			else 
				timelineEvents[subscribedStream][i].commentcount = count;
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

function postComment() {
	var vars = {
		to: currentPostBy,
		id: subscribedStream,
		comment: _g("composer").value
	}

	setTimeout('_g("composer").value="";',0);

	ajaxGet("work/comment", vars);
	pollData();
	
}

function getLastPostTime() {
	if (typeof(timelineEvents[subscribedStream]) == 'undefined') return 0;
    if (timelineEvents[subscribedStream].length < 1) return 0;

	return timelineEvents[subscribedStream][timelineEvents[subscribedStream].length - 1].time;
}

function fetchOlderPosts() {
	var query;
	
	if (currentPageType == "BOARD")
		query = "work/page.php?stream=" + subscribedStream + "&board=" + oldestBoardTime;
	else
		query = "work/page.php?stream=" + subscribedStream + "&page=" + timelineEvents[subscribedStream][0].time;
	if (currentPageType == "PHOTO")
		query += "&photo";

	ajaxGet(query);
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

