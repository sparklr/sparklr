/* Sparklr
 * Profile pages, editing profiles, etc.
 */

function updateHeader(user, id) {
	var h = _g("profileheader");
	h.style.backgroundImage = 'url(' + imgUrl('b' + user + '.jpg?' + id,true) + ')';
}

function editProfile() {
	var bio = _g("userBio");

	if (_g("editBtn").value == "Edit") {
		_g("userDisplayName").setAttribute("contenteditable", true);

		if (bio.textContent.length < 2)
			bio.innerHTML = "About me:&nbsp;";
		bio.setAttribute("contenteditable", true);

		_g("editContainer").style.display = "block";
		_g("editBtn").value = "Save";
	} else {
		_g("userDisplayName").setAttribute("contenteditable", false);

		if (bio.textContent.substring(0,9) == "About me:")
			bio.textContent = bio.textContent.substring(9);
		bio.setAttribute("contenteditable", false);

		_g("editContainer").style.display = "none";
	
		var data = { 
			"displayname": _g("userDisplayName").textContent,
			"bio": _g("userBio").textContent
		};

		ajax("settings", data);
	
		_g("editBtn").value = "Edit";
	}
}

function avatarUploadCallback(e) {
	_g("useravatar").className += " pulse";
	uploadImage(e, "avatar", function(xhr) {
		var avatarid = xhr.responseText;
		updateAvatar(CURUSER, avatarid);
		_g("useravatar").className = "avatar";
	});
}

function headerUploadCallback(e) {
	_g("profileheader").className += " pulse";
	uploadImage(e, "header", function(xhr) {
		var id = xhr.responseText;
		updateHeader(CURUSER, id, true);
		_g("profileheader").className = "profileheader";
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

// TODO
function addUserToList(list,user) {
	_g("blacklist").innerHTML += "<div style='min-height:50px;margin: 5px;'><img src='" + getAvatar(user) + "' class='avatar'> <b>" + getDisplayName(user) + "</b><div style='float:right;'><a href='javascript:addUserToServerList(" + list + ", " + user + ", 0);'>Remove</a></div></div>";
}

function addUserToServerList(type, id, action) {
	ajax("list", { type: type, action: action, user: id }, function() {
		  if (!action) {
				HIDDEN_USERS.splice(HIDDEN_USERS.indexOf(id),1);
				location.href = location.href + "/#";
		  } else {
			  showBanner(getDisplayName(id) + " has been added to your blacklist and will no longer appear in any feed.", "bannerblacklisted", 5000);
		  }
	});
}

function checkPasswords(password1,password2) {
	var result = _g("settings_result");
	var button = _g("savesettings");

	if (password1 != password2) {
		result.innerHTML = "The passwords do not match";
		result.className = "error";		
		button.disabled = true;
	} else {
		result.innerHTML = "";
		button.disabled = false;
	}
}

function checkUsername(username) {
	var alphanumeric = /^[A-Za-z0-9]+$/g;

	if (!alphanumeric.test(username))
		return checkUsernameCallback(2);
	if (username == USERHANDLES[CURUSER])
		return checkUsernameCallback(1);

	ajax("checkusername/" + username,null,checkUsernameCallback);
}

function checkUsernameCallback(result) {
	var message = "";
	switch(result) {
		case true:
			message = "Awh, somebody already took that :c";
		break;
		case 2:
			message = "Usernames must be letters and numbers only";
		break;
	}
	_g("username_callback").innerHTML = message;
}

function updateAccountSettings() {
	var s = location.hash.split("/");
	var form = _g("form_settings");

	var obj;
	var type;

	switch (s[2]) {
		case "password":
			obj = { password: form.currentpassword.value, newpassword: form.password1.value }
			type = "password";
			break;
		case "blacklist":
			obj = {};
			type = "blacklist";
			break;
		case "account":
			obj = { password: form.delete.value }
			type = "delete";
			break;
		default:
			obj = { username: form.username.value, email: form.email.value, displayname: form.displayname.value }

			if (obj.username.match(/^\d+$/))
				return updateSettingsCallback(false, "Sorry, your username cannot be all numbers.");
			if (obj.username.length > 20)
				return updateSettingsCallback(false, "Sorry, your username is too long.");
			if (obj.displayname.length > 20)
				return updateSettingsCallback(false, "Sorry, your display name is too long.");

			type = "settings";
			break;
	}
	ajax(type, obj, function(result) {
			var message = "";
			if (result.authkey) {
				AUTHKEY = result.authkey;
				document.cookie = "D=" + CURUSER + "," + AUTHKEY;
			}
			if (result.deleted) {
				location.href="./";
			}
			if (result.password === false) {
				message = "Sorry, your current password does not match the one on file.";
			}
			updateSettingsCallback(result,message);
		});

	_g("savesettings").value = "Saving...";
}

function updateSettingsCallback(result, message) {
	var r_ele = _g("settings_result");
	r_ele.innerHTML = message;
	r_ele.className = result == true ? "ok" : "error";

	if (result === true) {
		_g("savesettings").value = "Saved";
		setTimeout(function() {
			_g("savesettings").value = "Save Settings";
		}, 4000);
	}
}

