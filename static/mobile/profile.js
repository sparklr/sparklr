//profile pages and such

var lastBoardTime = 0;
var oldestBoardTime = Number.MAX_VALUE;

function showUserPage(data) {
	DISPLAYNAMES[data.user] = data.name;
	USERHANDLES[data.user] = data.handle;

	lastBoardTime = 0;
	oldestBoardTime = Number.MAX_VALUE;

	if (data.user == curUser){
		var html = "<div id='profileheader' class='profileheader' onDrop='dropImage(event, avatarUploadCallback);' onDragEnter='dropPrevent(event);' onDragOver='dropPrevent(event);'>";
	} else{
		var html = "<div class='profileheader' id='profileheader'>";
	}
	html += "<p class='headertitle fadein' id='userDisplayName'>" + getDisplayName(data.user) + "</p>";
	html += "<p class='headersubtitle fadein'>@" + getUserHandle(data.user) + "</p>";
	html += "<p class='headersubtitle fadein' id='userBio'>" + data.bio + "</p>";
	html += "<div id='userTip' style='display:none;position:relative;top:90px;'><p class='headersubtitle'>Drag and drop an image here</p></div>";

	html += "<div class='profilebuttons'>";
html += "<input type='button' value='Board' onClick='showBoard();'> ";
if (data.user == curUser) {
	html += "<input type='button' value='Edit' onClick='editProfile();' id='editBtn'> ";
} else {
	html += "<input type='button' value='Mention' onClick='mention(\""+data.handle+"\");'> ";

	if (data.following) {	
		html += "<input type='button' value='Unfollow' onClick='unfollow("+data.user+");'> ";
	} else {
		html += "<input type='button' value='Follow' onClick='follow("+data.user+");'> ";
	}
}

	html += "</div>";

	html += "</div>";

	html += "<div class='profile_wrapper slideinfromright'><div id='timeline_container' class='profile_timelinecontainer'></div></div>";
	html += "<div id='boardcontainer' onClick='hideBoard();'><div class='newNote' onClick='showAddNote();'><img src='" + COMMONHOST + "/sn_y.png'></div></div>";


	_g("content").innerHTML = html;

	subscribedStream =  data.user;

	var arr = data.timeline;

	for(var i = arr.length-1; i >= 0; i--) {
		addTimelineEvent(arr[i]);
	}

	addTimelineArray(arr,subscribedStream);

	updateHeader(data.user,data.avatarid);

	for (i=data.boarditems.length-1;i>=0;i--) {
		addBoardItem(data.boarditems[i], false);
	}

	currentPageType = "BOARD";
	
}
function showBoard() {
		_g("boardcontainer").style.display = "block";
}
function hideBoard() {
		_g("boardcontainer").style.display = "none";
}
function addBoardItems(items, append) {
	if (_g("localboarditem") != null)
		_g("boardcontainer").removeChild(_g("localboarditem"));
	
	for (var i=items.length-1;i>=0;i--) {
		addBoardItem(items[i], append);
	}
}
function addBoardItem(item, append) {
	var ele = document.createElement("div");
	
	ele.id = "boarditem_" + item.id;
	ele.innerHTML = "<div class='post'>" + item.message + "</div><a href='#/user/" + item.from + "'><img src='" + getAvatar(item.from) + "'></a><span class='time_raw' data-time='" + item.reltime + "'>";

	ele.onclick = stopBubbling;
	var colors = ["yellow", "green", "purple", "blue"];
	ele.className = "stickynote " + colors[item.color];

	var c = _g("boardcontainer");

	if (append) {
		c.appendChild(ele);
	} else {
		c.insertBefore(ele, c.childNodes[0]);
	}

	if (lastBoardTime < item.time)
		lastBoardTime = item.time;
	if (oldestBoardTime > item.time) 
		oldestBoardTime = item.time;
}
function showAddNote() {
	if (_g("newboarditem") != null) return;

	var ele = document.createElement("div");
	
	ele.id = "newboarditem";
	ele.innerHTML = "<textarea onKeyDown='handleStickyNoteKeyDown(event, this);' autofocus=true placeholder='Write something...'></textarea>";

	ele.className = "stickynote yellow";
	ele.onclick = stopBubbling;
	var c = _g("boardcontainer")
	c.insertBefore(ele, c.childNodes[0]);

	window.scrollTo(0,0);

	stopBubbling();
}
function handleStickyNoteKeyDown(e, msg) {
	if (e == null)
		e = window.event;
    if (msg.value.length > 80) {
        msg.value = msg.value.substring(0,80);
    }
	if (e.keyCode == 13) {
		var data = [];
		data["to"] = subscribedStream;
		data["message"] = msg.value;
		ajaxGet("work/postboard.php", data);
		msg.disabled = true;
		_g("newboarditem").id = "localboarditem";// + Math.random();
	}
}
