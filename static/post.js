/* Sparklr
 * Posts, comments
 */

var currentComments = [];
var LIKE_CHAR = "\u261D";

function showPost(id,args) {
	if (typeof(args) === "undefined")
		var args = "";
	location.href = "#/post/" + id + "/" + args;
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

	var message = processMedia(escapeHTML(data.message));
	var original = "";

	if (data.via) {
		var last = "";
		var laststr = "";
		var lineexp = /\[([\d]+)\]([^$\[]*)/g; //line starts with [ID]
		message = message.replace(lineexp, function(match, num, text) {
			original = "<blockquote>" + original + "</blockquote>" + last;
			last = "<img src='" + getAvatar(num) + "' class='littleavatar'><a href='#/user/" + num + "'>" + getDisplayName(num) + "</a>: " + text + "";
			laststr = text;
			return "";
		});
		message += laststr;
	}

	data.formattedMessage = message;
	data.originalMessage = "<blockquote>" + original + "</blockquote>";

	return data;
}

function renderComment(comment,scroll) {
	if (comment.deleted) {
		removeDomElement('comment_' + comment.id);
		return;
	}

	var commentlist = _g("comments_" + comment.postid);

	var e = document.createElement("div");
	e.id = 'comment_' + comment.id;
	e.className = "comment";

	comment.like = comment.message == LIKE_CHAR;	

	if (comment.like) {
		var likeid = "like_" + comment.postid + "_" + comment.from;

		if (_g(likeid))	return;

		e.id = likeid;

		if (comment.from == CURUSER) 
			_g("likebtn_"+comment.postid).className += " liked";
	}
	
	eval(getTemplate("comment"));
	
	e.innerHTML += html;
	commentlist.appendChild(e);

	if (scroll) {
		var g = _g("window_c"+comment.postid);
		if (g.scrollHeight - g.scrollTop < 600)
			g.scrollTop = 0xFFFFFF;
	}
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

	ele.style.display = (count != 0) ? "" : "none";
	ele.innerHTML = count || "+";

	commentCounts[id] = count;
}

function postComment(e) {
	var id = e.target.getAttribute("data-id");
	var vars = {
		id: id,
		comment: _g('composer_'+id).value
	}

	if (imgAttachments) {
		vars.postData = imgAttachments.target.result;
		vars.img = 2;
		_g("attachment"+id).style.display = "none";
	}

	setTimeout(function() {
		_g('composer_'+id).value="";
		expandTextarea(e);
	},10);

	if (!vars.comment && !vars.postData) return;

	ajax("comment", vars, function() {
		imgAttachments = null;
		pollData();
	});

}

function showImage(img) {
	if (MOBILE) {
		window.open(img);
	} else {
		showPopup("<img src='"+img+"' onload='this.style.opacity=1'>", "lightbox");
	}
}

function editPostStart(e) {
	e = e || window.event;
	if (e.target.getAttribute('contenteditable') == 'true') return;

	e.target.setAttribute('contenteditable', true);
}

function editPost(e) {
	console.log('saving');
	e = e || window.event;
	ajax("editpost", { id: e.target.getAttribute('data-id'), body: htmlToPost(e.target.innerHTML) }, function() {
		e.target.innerHTML = processPostMeta({ message: htmlToPost(e.target.innerHTML), from: CURUSER }).formattedMessage;
	});
	e.target.setAttribute('data-message', e.target.textContent);
	e.target.setAttribute('contenteditable', false);
}
function editComment(e) {
	e = e || window.event;

	ajax("editcomment", { id: e.target.getAttribute("data-id"), body: e.target.textContent }, function() {
	});
}

function deletePost(id) {
	showConfirm("Delete post", "Are you sure you want to delete this post?", function () {
		ajax("deletepost/" + id, null, function() {
			removeDomElement('post_'+id);
			changeLocation();
		});
		timelineEvents[0] = [];
	});
}

function deleteComment(id,postid) {
	showConfirm("Delete comment", "Are you sure you want to delete this comment?", function () {
		ajax("deletecomment/"+ id, null, function() {
			location.href = window.location + "#";
		});
	});
}

function repost(id) {
	_g("responseholder_"+id).style.display = "none";
	_g("reblogholder_"+id).style.display = "block";
	_g("composer_r"+id).focus();
}

function publishRepost(e) {
	var id = e.target.getAttribute('data-id').substring(1);
	var vars = {
		id: id,
		reply: _g("composer_r"+id).value
	}

	if (imgAttachments) {
		vars.postData = imgAttachments.target.result;
		vars.img = 2;
		_g("attachmentr"+id).style.display = "none";
	}

	ajax("repost", vars);
	changeLocation();
}

function hidePost(id,from) {
	showConfirm("Hide post", "Are you sure you want to hide this post?", function () {
		location.href = "#";
		showBanner("Post hidden. If you continue to have issues with this user, you may <a href='javascript:addUserToServerList(0," + from + ",1);'>blacklist him/her</a>.", "bannerhidden", 5000);

		hiddenPostList.push(id);
		var g = _g("post_" + id);
		if (g)
			g.style.display = "none";
		timelineEvents[0] = [];
	});
}


function likePost(id, to, callback) {
	ajax("like", { id: id, to: to }, function(result) {
		if (result.deleted) {
			removeDomElement('like_' + id + '_' + CURUSER);
			callback.className = callback.className.replace('liked','');
			return;
		}
		callback.className += " jiggle";

		setTimeout(function() { callback.className = callback.className.replace(" jiggle", ""); }, 1000);
		pollData();
	});
}
