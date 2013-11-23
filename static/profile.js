//profile pages and such
var curRenderedBg = 0;
function updateHeader(user, id) {
	var h = _g("profileheader");
	h.style.backgroundImage = 'url(' + imgUrl('b' + user + '.jpg?' + id,true) + ')';
}

function updateBackground(user, id) {
	if (curRenderedBg == user + "_" + id) return;

	document.body.style.backgroundImage = id ? 'url(' + imgUrl('b' + user + '.jpg?' + id,true) + ')' : "";
	if(id < 0){
		document.body.style.backgroundRepeat = 'repeat';
		document.body.style.backgroundSize = '';
	}
	else
		document.body.style.backgroundSize = 'cover';

	if (user == curUser)
		curBackground = id;
	curRenderedBg = user + "_" + id;
}

function editProfile() {
	if (_g("editBtn").innerHTML == "Edit") {
		_g("userDisplayName").setAttribute("contenteditable", true);
		var bio = _g("userBio");
		if (bio.textContent.length < 2)
			bio.innerHTML = "About me:&nbsp;";
		bio.setAttribute("contenteditable", true);

		_g("editContainer").style.display = "block";
		_g("editBtn").innerHTML = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);
		var bio = _g("userBio");
		if (bio.textContent.substring(0,9) == "About me:") {
			bio.textContent = bio.textContent.substring(9);
		}
		bio.setAttribute("contenteditable", false);
		_g("editContainer").style.display = "none";
	
		var data = { 
			"displayname": _g("userDisplayName").textContent,
			"bio": _g("userBio").textContent
		};

		ajaxGet("work/settings", data, function() {
		});
	
		_g("editBtn").innerHTML = "Edit";
	}
}

function avatarUploadCallback(e) {
	_g("useravatar").className += " pulse";
	uploadImage(e, "work/avatar", function(xhr) {
		var avatarid = xhr.responseText;
		updateAvatar(curUser, avatarid);
		_g("useravatar").className = "avatar";
	});
}

function headerUploadCallback(e) {
	_g("profileheader").className += " pulse";
	uploadImage(e, "work/header", function(xhr) {
		var id = xhr.responseText;
		updateHeader(curUser, id, true);
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

function backgroundStyle(value){
	ajaxGet("work/background", { style: value }, function(data) {
		updateBackground(curUser,data);
		console.log(data);
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

