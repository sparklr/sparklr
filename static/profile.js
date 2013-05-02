//profile pages and such

var lastBoardTime = 0;
var oldestBoardTime = Number.MAX_VALUE;

function showUserPage(data) {
	DISPLAYNAMES[data.user] = data.name;
	USERHANDLES[data.user] = data.handle;
	
	var isBoard = location.hash.indexOf("/board") != -1;
	var isPhotos = location.hash.indexOf("/photos") != -1;

	lastBoardTime = 0;
	oldestBoardTime = Number.MAX_VALUE;

	var html = "";

	if (data.user == curUser){
		html += "<div id='profileheader' class='profileheader' onDrop='dropImage(event, avatarUploadCallback);' onDragEnter='dropPrevent(event);' onDragOver='dropPrevent(event);'>";
	} else {
		html += "<div class='profileheader' id='profileheader'>";
	}
	var sidebaritems = [];

	if (data.user == curUser) {
		sidebaritems.push({ href: "javascript:editProfile();", id: "editBtn", value: "Edit"});
		sidebaritems.push({ href: "javascript:accountSettings();", value: "Account Settings"});
		sidebaritems.push({ href: "javascript:signOff();", value: "Sign off"});
	} else {
		sidebaritems.push({ href: "javascript:mention(\"" + data.handle + "\");", value: "Mention" });

		if (data.following) {	
			sidebaritems.push({ href: "javascript:unfollow(" + data.user + ");", value: "Unfollow" });
		} else {
			sidebaritems.push({ href: "javascript:follow(" + data.user + ");", value: "Follow" });
		}
	}
	html += "<p class='headertitle' id='userDisplayName'>" + getDisplayName(data.user) + "</p>";
	html += "<p class='headersubtitle'>@" + getUserHandle(data.user) + "</p>";
	html += "<p class='headersubtitle' id='userBio'>" + data.bio + "</p>";
	html += "<div id='userTip' style='display:none;position:absolute;bottom:10px;left:0px'><p class='headersubtitle'>Drag and drop an image here</p></div>";
	html += "<div style='position:absolute;bottom:5px;right:3px;'>";
	html += "<input type='button' value='Posts' onClick='location.href=\"" + "#/user/" + data.user + "/\";'>";
	html += "<input type='button' value='Board' onClick='location.href=\"" + "#/user/" + data.user + "/board\";'>";
	html += "<input type='button' value='Photos' onClick='location.href=\"" + "#/user/" + data.user + "/photos\";'>";
	html += "</div></div>";


	if (isBoard) {
		currentPageType = "BOARD";
		setTimeout(function() {
			for (var i=data.boarditems.length-1;i>=0;i--) {
				addBoardItem(data.boarditems[i], false);
			}
			setTimeout(showAddNote, 100);
		},0);
		html += "<div id='boardcontainer'></div>";
	} else {
		currentPageType = "STREAM";

		if (isPhotos)
			currentPageType = "PHOTO";

		html += "<div id='timeline_container'></div>";
		
		setTimeout(function() {
		var arr = data.timeline;

		for(var i = arr.length-1; i >= 0; i--) {
			addTimelineEvent(arr[i]);
		}

		addTimelineArray(arr,subscribedStream);
		}, 10);
	}

	_g("content").innerHTML = html;

	updateHeader(data.user,data.avatarid,subscribedStream != data.user);
	subscribedStream =  data.user;
	_g("content").style.minHeight = 0;
	setSidebar(sidebaritems);
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
	ele.innerHTML = "<div class='post'>" + item.message + "</div><a href='#/user/" + item.from + "'><img src='" + getAvatar(item.from) + "'></a><span class='time_raw' data-time='" + item.time + "'>";

	var colors = ["yellow", "green", "purple", "blue"];
	ele.className = "stickynote " + colors[item.color];

	var c = _g("boardcontainer");

	if (append || c.childNodes.length < 1) {
		c.appendChild(ele);
	} else {
		c.insertBefore(ele, c.childNodes[0]);
	}
	realignBoard();

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

	var c = _g("boardcontainer");
	
	if (c.childNodes.length < 1) {
		c.appendChild(ele);
	} else {
		c.insertBefore(ele, c.childNodes[0]);
	}
	realignBoard();

	window.scrollTo(0,0);
}

function realignBoard() {
	var x = 0;
	var y = 0;

	var children = _g("boardcontainer").childNodes;
	for (var i = 0; i < children.length; i++) {
		if (children[i].className == "newNote") continue; 
		children[i].style.top = y +  "px";
		children[i].style.left = x + "px";

		x += 290;
		if (x > 290) {
			x = 0;
			y += 290;
		}
	}
}

function handleStickyNoteKeyDown(e, msg) {
	if (e == null)
		e = window.event;
    if (msg.value.length > 80) {
        msg.value = msg.value.substring(0,80);
    }
	if (e.keyCode == 13) {
		var data = {};
		data["to"] = subscribedStream;
		data["message"] = msg.value;
		ajaxGet("work/board", data);
		msg.disabled = true;
		_g("newboarditem").id = "localboarditem";
		setTimeout(showAddNote, 2000);
	}
}

function accountSettings() {
	location.href = "#/settings";
}

function updateHeader(user, avatarid, animate) {
	var h = _g("profileheader");
	h.style.backgroundImage = 'url(' + STATICHOST + "/users/" + user + '?' + avatarid + ')';
	h.className = "profileheader";
	if (animate)
		h.className += " bgslide";
	setTimeout(function() {
		h.className = "profileheader";
	},3500);
}

function editProfile() {
	if (_g("editBtn").innerHTML == "Edit") {
		_g("userDisplayName").setAttribute("contenteditable", true);
		_g("userBio").setAttribute("contenteditable", true);
		_g("userTip").style.display = "inline-block";
		_g("editBtn").title = "Idk";
		_g("editBtn").innerHTML = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);
		_g("userBio").setAttribute("contenteditable", false);
		_g("userTip").style.display = "none";
	
		var data = { 
			"displayname": _g("userDisplayName").innerText,
			"bio": _g("userBio").innerText
		};

		ajaxGet("work/profile", data);
	
		_g("editBtn").innerHTML = "Edit";
	}
}

function avatarUploadCallback(files) {
	var reader = new FileReader();
	reader.onload = function(e) { uploadAvatar(e); }
	reader.readAsDataURL(files[0]);
}

function uploadAvatar(e) {
	var data = [];
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			var avatarid = xhr.responseText;
			updateHeader(curUser, avatarid, true);
			updateAvatar(curUser, avatarid);
		}
	}
	xhr.open("POST", "work/avatar");
	xhr.send(e.target.result);
}

function showPrivateUser(user) {
	var html = "<div class='contentwrapper'>";
	html += "<img src='"+getAvatar(user.id)+"' class='avatar'><h2>"+user.name+" ("+user.handle+")</h2><br>";
	html += "This user has a private profile.<br>In order to see this content, you must mutually follow each other.<br><br>";
	if (!user.following) {
		html += "<input type='button' onClick='follow("+user.id+")' value='Follow "+user.handle+"'>";
	} else {
		html += "<input type='button' onClick='unfollow("+user.id+")' value='Unfollow "+user.handle+"'>";
	}
	html += "</div>";
	_g("content").innerHTML = html;
}

