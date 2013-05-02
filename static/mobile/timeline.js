var timelineEvents = [[]];
var subscribedStream;
var publicStream = false;
var currentPostBy;
var currentComments = [];
var imgAttachments = [];
var currentLocation = "";

function addTimelineEvent(item,append) {
	if (item.fromhandle != "") {
		USERHANDLES[item.from] = item.fromhandle;
	}
	if (item.viahandle != "") {
		USERHANDLES[item.via] = item.viahandle;
	}

	var ev = document.createElement("div");
	
	ev.className = "timelineitem fadein";
	ev.id = "event_" + item.id;
	ev.onclick = function() { showEvent(item.id); }

	var fromline = "<a href='#/user/" + item.from + "'>" + getDisplayName(item.from) + "</a>";

	if (item.via != null) {
		fromline += " via <a href='#/user/" + item.via + "'>@" + getUserHandle(item.via) + "</a>"; 
	}
	var html = "";

	if (item.type == 1) {
		var images = item.meta.split(",");
		html += "<div class='picturepost' style='background-image: url(" + STATICHOST + "/storage/images/" + images[0] + "_thumb.jpg);'></div>";
	}

	html += "<div id='commentcount_" + item.id + "' class='commentcount' style='opacity:0'>+</div><div style='display:inline-block;float:left;height:100%'><img class='avatar' src='" + getAvatar(item.from) + "'></div> <div class='time' data-time='" + item.reltime + "'></div>" + fromline + "<h2>@" + getUserHandle(item.from) + "</h2><div class='content'>" + processPost(item) + "</div>";


	ev.innerHTML = html;
		var parent = _g("timeline_container");
	if (append || parent.children.length < 1) {
		parent.appendChild(ev);
	} else {
		parent.insertBefore(ev, parent.children[0]);
	}

	item.commentcount = 0;
}
function processPost(post) {
	var message = processMedia(escapeHTML(post.message));

	var lines = message.split("\n");
	var lineexp = /^\[([\d])\](.*)/gm;
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

function showEvent(id) {
	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		if (timelineEvents[subscribedStream][i].id == id) {
			location.href = "#/post/" + timelineEvents[subscribedStream][i].from + "/" + id;
		}
	}
}

function showPost(item) {
	var html = "";

	html = "<div class='contentwrapper'>"
	if (item.type==1) {
		var images = item.meta.split(",");
		
		html += "<div class='picturepost' onClick='showImage(\"" + images[0] + "\");' style='background-image: url(" + STATICHOST + "/storage/images/" + images[0] + "_thumb.jpg);'></div>";
	}
	html += "<div id='event_" + item.id + "' class='fadein' style='padding: 7px; margin: -5px' onClick='showEvent(" + item.id + ")'><div style='display:inline-block;float:left;height:100%'><img class='avatar' src='" + getAvatar(item.from) + "'></div><div class='rightcontrols'><div class='time' data-time='" + item.reltime + "'></div>";

	var sidebar = "<br><div style='float:right'>";
	  
	if (item.from == curUser) {
        sidebar += "<br><a href='javascript:deletePost(\"" + item.id + "\");'><img src='" + COMMONHOST + "/icons/delete.png'></a>";
    } else {
		sidebar += "<a href='javascript:repost(\"" + item.id + "\");'><img src='" + COMMONHOST + "/icons/repost.png'></a>";
	}


	sidebar += "</div>";

	html += sidebar;
    html += "</div> <a href='#/user/" + item.from + "'>" + getDisplayName(item.from) + "</a><br>" + processPost(item) + "<br>";
	html += "</div>";

	html += "<hr><div id='responseholder'><div id='comments_" + item.id + "' style='padding:5px;'></div>";

	//comment form
	html += "<div class='fadein' style='padding:5px;'><img src='"+getAvatar(curUser)+"' class='avatar'><textarea id='composer' onkeydown='handleKeyDown_Comment(event);' placeholder='Respond...'></textarea></div></div>";
	
	html += "<div id='reblogholder' class='fadein' style='display:none;min-height:100px'><div class='fadein' style='padding:5px;'><img src='"+getAvatar(curUser)+"' class='avatar'><textarea id='repostcomment' class='composer' onkeydown='' placeholder='Share something (optional)'></textarea></div><input type='button' value='Repost to Followers' style='float: right' onClick='publishRepost();'></div>";

	html += "</div>";
	_g("content").innerHTML = html;

	currentPageType = "POST";
	subscribedStream = item.id;
	currentPostBy = item.from;

	for (var i = 0; i < item.comments.length; i++) {
		renderComment(item.comments[i]);
	}

	currentComments = item.comments;

	updateUI(); //time

	if (location.hash.indexOf("new") != -1) 
		_g('composer').focus();

}

function repost(id) {
	_g("responseholder").style.display = "none";
	_g("reblogholder").style.display = "block";
}
function publishRepost() {
	var vars = {
		id: subscribedStream,
		reply: _g("repostcomment").value
	}

	ajaxGet("work/repost.php", vars);
	location.href="#";
}

function renderPostMeta(item) {
	var metadata = ""; //extra data that is sometimes appended
	
	if (item.type == 1) { //contains images
		var images = item.meta.split(",");
		for (i = 0; i < images.length; i++) {
			metadata  += "<img class='inlineimage' src='" + STATICHOST + "/storage/images/" + images[i] + "_thumb.jpg'>";
		}
	}
	
	return metadata;
	
}

function deletePost(id) {
    if (confirm("Are you sure you want to delete this post?")) {
        ajaxGet("work/deletepost.php?id=" + id);
    }
}
function deleteComment(id,postid) {
    if (confirm("Are you sure you want to delete this comment?")) {
        ajaxGet("work/deletecomment.php?id=" + id + "&postid="+postid);
    }
}
function renderComment(comment) {
	var commentlist = _g("comments_" + comment.postid);

	// add user, if we don't know them
	USERHANDLES[comment.from] = comment.fromhandle;

	var e = document.createElement("div");

    var html = "<div style='display:inline-block;float:left;'><img class='avatar' src='" + getAvatar(comment.from) + "'></div> <div class='rightcontrols'><div class='time' style='opacity:0.5' data-time='" + comment.reltime + "'></div>";

    
    if (comment.from == curUser) {
        html += "<br><a class='delete' onClick='deleteComment(\"" + comment.id + "\", \"" + comment.postid + "\");'>x</a>";
    }
    html += "</div> <a href='#/user/" + comment.from + "'>" + getDisplayName(comment.from) + "</a><br>" + processMedia(escapeHTML(comment.message)) + "</div><br><br><br>"
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
}
function updateCommentCount(id, count) {

	var ele = _g("commentcount_" + id);
	if (ele == null) return; 
	if (count == 0)
		ele.style.opacity = 0;
	else
		ele.style.opacity = 1;

	ele.innerHTML = count;

	for (var i = 0; i < timelineEvents[subscribedStream].length; i++) {
		if (timelineEvents[subscribedStream][i].id == id)
			timelineEvents[subscribedStream][i].commentcount = count;
	}
}

//TODO: merge
function handleKeyDown_Comment(e) {
	if (!e)
		e = window.event;

	if (e.keyCode == 13)
	{
		var msg = _g("composer").value;

		postComment(currentPostBy, subscribedStream, msg);

		setTimeout('_g("composer").value="";',10);
	}
}

function postComment(to, id, comment) {
	var vars = [];
	vars["to"] = to;
	vars["id"] = id;
	vars["comment"] = comment;
    console.log(vars["id"]);
	ajaxGet("work/postcomment.php", vars);
}

function getLastPostTime() {
    if (timelineEvents[subscribedStream].length < 1) return 0;

	return timelineEvents[subscribedStream][timelineEvents[subscribedStream].length - 1].time;
}

function fetchOlderPosts() {
    console.log("Fetching older posts");
	var query = "work/page.php?stream=" + subscribedStream + "&page=" + timelineEvents[subscribedStream][0].time;
	if (currentPageType == "BOARD")
		query += "&joint=1&board=" + oldestBoardTime;
	
	ajaxGet(query);
}

function renderTimeline() {
	var html = "<div class='timelineitem'><img src='" + getAvatar(curUser) + "' class='avatar'>\
	<textarea id='composer' placeholder='Say something...' onkeydown='handleKeyDown();'></textarea>\
	<div id='attachments'></div></div>\
	<div id='timeline_container'></div>";
	_g("content").innerHTML = html;
	
	currentComments = [];


	currentPageType = "STREAM";
}

function handleKeyDown(e) {
	if (!e)
		e = window.event;

	if (e.keyCode == 13)
	{
		postToTimeline(_g("composer").value, publicStream, currentLocation);
		setTimeout('_g("composer").value="";',10);
	}
}


function postToTimeline(body, pub, loc) {
	var vars = [];
	vars["body"] = body;
	vars["loc"] = loc;
	console.log(loc);
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "work/post.php");
	xhr.setRequestHeader("X-X", AUTHKEY);

	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(getKeystrFromArray(vars));
}

function uploadStreamImageCallback(files) {
	for (var i = 0; i < files.length; i++) {
		var reader = new FileReader();
		reader.onload = function(e) { attachStreamImage(e); }
		reader.readAsDataURL(files[i]);
	}
}
function attachStreamImage(e) {
	var id = imgAttachments.length;
	_g("attachments").innerHTML += "<img src='" + e.target.result + "' id='attachimg_" + id + "' data-index='" + id + "'>";

	imgAttachments.push([e, id]);
}
function uploadStreamImage(e) {
	var data = [];
	data["img"] = e.target.result;
	ajaxGet("work/upload.php", data);
}


