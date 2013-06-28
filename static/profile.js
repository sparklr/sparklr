//profile pages and such

var lastBoardTime = 0;
var oldestBoardTime = Number.MAX_VALUE;

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
	ele.innerHTML = "<div class='post'>" + item.message + "</div><a href='#/user/" + item.from + "/board" + "'><img src='" + getAvatar(item.from) + "'></a><span class='time_raw' data-time='" + item.time + "'>";

	var colors = ["yellow", "green", "purple", "blue"];
	ele.className = "stickynote " + colors[item.color];

	var c = _g("boardcontainer");

	if (append || c.childNodes.length < 1) {
		c.appendChild(ele);
	} else {
		c.insertBefore(ele, c.childNodes[0]);
	}
	realignBoard();

	if (lastBoardTime < item.time) {
		lastBoardTime = item.time;
		console.log(item.time);
	}
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

		x += 310;
		if (x >310) {
			x = 0;
			y += 300;
		}
	}
}

function handleStickyNoteKeyDown(e, msg) {
	if (e == null)
		e = window.event;
    if (msg.value.length > 130) {
        msg.value = msg.value.substring(0,130);
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
		var bio = _g("userBio");
		bio.setAttribute("contenteditable", true);
		bio.innerText = "Bio: " + bio.innerText;
		_g("userTip").style.display = "inline-block";
		_g("editBtn").innerHTML = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);
		var bio = _g("userBio");
		bio.setAttribute("contenteditable", false);
		if (bio.innerText.substring(0,5) == "Bio: ")
			bio.innerText = bio.innerText.substring(4);
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

function showMePage() {
	location.href = '#/user/' + curUser;
}

