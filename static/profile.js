//profile pages and such
var curRenderedBg = 0;
function updateHeader(user, id) {
	var h = _g("profileheader");
	h.style.backgroundImage = 'url(' + imgUrl(user + '.jpg?' + id,true) + ')';
}

function updateBackground(user, id) {
	if (curRenderedBg == id) return;

	document.body.style.backgroundImage = id ? 'url(' + imgUrl('b' + user + '.jpg?' + id,true) + ')' : "";

	if (user == curUser)
		curBackground = id;
	curRenderedBg = user + "_" + id;
}

function editProfile() {
	if (_g("editBtn").value == "Edit") {
		_g("userDisplayName").setAttribute("contenteditable", true);
		var bio = _g("userBio");
		if (bio.textContent.length < 2)
			bio.innerHTML = "About me:&nbsp;";
		bio.setAttribute("contenteditable", true);

		_g("userTip").style.display = "inline-block";
		_g("backgroundTip").style.display = "inline-block";
		_g("editBtn").value = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);
		var bio = _g("userBio");
		if (bio.textContent.substring(0,9) == "About me:") {
			bio.textContent = bio.textContent.substring(9);
		}
		bio.setAttribute("contenteditable", false);
		_g("userTip").style.display = "none";
		_g("backgroundTip").style.display = "none";
	
		var data = { 
			"displayname": _g("userDisplayName").textContent,
			"bio": _g("userBio").textContent
		};

		ajaxGet("work/profile", data);
	
		_g("editBtn").value = "Edit";
	}
}

function avatarUploadCallback(e) {
	_g("profileheader").className += " pulse";
	uploadImage(e, "work/avatar", function(xhr) {
		var avatarid = xhr.responseText;
		updateHeader(curUser, avatarid, true);
		updateAvatar(curUser, avatarid);
		_g("profileheader").className = "profileheader";
	});
}

function backgroundUploadCallback(e) {
	uploadImage(e, "work/background", function(xhr) {
		updateBackground(curUser, xhr.responseText);
		_g("removeBackground").style.display = "inline-block";
	});
}

function removeBackground() {
	ajaxGet("work/background", { remove: true }, function() {
		_g("removeBackground").style.display = "none";
		updateBackground(curUser,0);
		curBackground = 0;
	});
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
		return false;
	}
}

function addUserToList(list,user) {
	_g("blacklist").innerHTML += "<div style='min-height:50px;margin: 5px;'><img src='" + getAvatar(user) + "' class='avatar'> <b>" + getDisplayName(user) + "</b><div style='float:right;'><a href='javascript:addUserToServerList(" + list + ", " + user + ", 0);'>Remove</a></div></div>";
}

function addUserToServerList(type, id, action) {
	ajaxGet("work/list", { type: type, action: action, user: id }, function() {
		  if (!action) {
				HIDDEN_USERS.splice(HIDDEN_USERS.indexOf(id),1);
				location.href = location.href + "/#";
		  } else {
			  showBanner(getDisplayName(id) + " has been added to your blacklist and will no longer appear in any feed.", "bannerblacklisted", 5000);
		  }
	});
}

