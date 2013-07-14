//profile pages and such
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
		_g("userTip").style.display = "inline-block";
		_g("editBtn").innerHTML = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);
		var bio = _g("userBio");
		bio.setAttribute("contenteditable", false);
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

function addUserToList_Keydown(e, list) {
	if (!e)
		e = window.event;

	var result = showSuggestionBoxBelowElement(e); 
	if (e.keyCode == 13) {
		for (id in DISPLAYNAMES) {
			if (DISPLAYNAMES[id].toLowerCase() == e.target.value.toLowerCase()) {
				addUserToList(list, id);
				addUserToServerList(list, id, true);
				break;
			}
		}
	}
	return result;
}

function addUserToList(list,user) {
	_g(list ? "whitelist" : "blacklist").innerHTML += "<div style='min-height:50px;margin: 5px;'><img src='" + getAvatar(user) + "' class='avatar'> <b>" + getDisplayName(user) + "</b><div style='float:right;'><a href='javascript:addUserToServerList(" + list + ", " + user + ", 0);'>Remove</a></div></div>";
}

function addUserToServerList(type, id, action) {
	ajaxGet("work/list", { type: type, action: action, user: id }, function() {
		  if (!action) {
				location.href = location.href + "/#";
		  }
	});
}

