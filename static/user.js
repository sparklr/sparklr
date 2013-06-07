var FRIENDS = [];
var DISPLAYNAMES = [];
var USERHANDLES = [];
var AVATAR_IDS = [];
var handlesToFetch = [];
var fetchTaskAsync;

function getAvatar(id,plain) {
	return STATICHOST + "/thumb/" + id + "?" + (plain ? "" : AVATAR_IDS[id]);
}

function getDisplayName(id) {
	if (DISPLAYNAMES[id])
		return DISPLAYNAMES[id];
	return "@"+getUserHandle(id);
}

function getUserHandle(id) {
	if (USERHANDLES[id])
		return USERHANDLES[id];
	fetchUserHandle(id);
	return "<var data-id='" + id + "'></var>";
}

function fetchUserHandle(id) {
	for (var i = 0; i < handlesToFetch.length; i++) {
		if (handlesToFetch[i] == id)
			return;
	}
	handlesToFetch.push(id);
	clearTimeout(fetchTaskAsync);
	fetchTaskAsync = setTimeout(pullHandlesFromServer, 1); //defer this 
}

function pullHandlesFromServer() {
	ajaxGet("work/username/" + handlesToFetch.join(","), null, pullHandlesFromServerCallback);
	handlesToFetch = [];
}

function pullHandlesFromServerCallback(handles) {
	var tags = document.getElementsByTagName("var");
	for (var i = 0; i < tags.length; i++) {
		for (var h in handles) {
			var id = handles[h].id;
			if (tags[i].getAttribute("data-id") == id) {
				tags[i].innerHTML = handles[h].username;
			}
		}
	}
}

function getUserFromHandle(handle, callback) {
	for (id in USERHANDLES) {
		if (USERHANDLES[id].toLowerCase() == handle.toLowerCase()) {
			callback(id);
			return;
		}
	}
	// we need to fetch it
	ajaxGet("work/userid/" + handle, null, function (data) { if (!data.error) { callback(data) } });
}

function addFriend(id, status) {
	FRIENDS[id] = status;
}

function updateFriendsList() {
	var html = "";
	for (id in FRIENDS) {
		html += "<a id='friendicon_" + id + "' onClick='chatWith("+id+");' class='" + (FRIENDS[id] ? "online" : "offline") + "'><img src='" + getAvatar(id) + "'><div class='names'>" + getDisplayName(id) + "</div></a>";
	}
	_g("friendslist").innerHTML = html;
}

function chatWith(id) {
	location.href = "#/chat/" + id;
}

function setNewMessage(id, status) {
	_g("friendicon_" + id).className = (FRIENDS[id] ? "online" : "offline") + " " + (status ? "attn" : "");
}

function follow(id) {
	ajaxGet("work/follow/"+id, null, function() { location.href += "/#"; });	
}

function unfollow(id) {
	ajaxGet("work/unfollow/"+id, null, function() { location.href += "/#"; });
}

function mention(handle) {
	location.href='#/mention/'+handle;
}

//Current user actions

function accountSettings() {
	location.href = "#/settings";
}

function updateAvatar(user, avatarid) {
	var elements = document.getElementsByTagName("img");
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].src.indexOf(getAvatar(user,true)) != -1) {
			elements[i].src = getAvatar(user,true) + "?" + avatarid;
		}
	}
	AVATAR_IDS[user] = avatarid;
}

function signOff() {
	ajaxGet("work/signoff", null, function() { location.href='/'; });
}

function inviteFriend() {
	showPopup("<form onSubmit='inviteUser(to.value);return false;'><input type='text' class='t1' id='inviteField' name='to' autofocus='true' placeholder='notjulia@orangemelt.com'><input type='submit' class='s1' value='&gt;'></form>");
}

function inviteUser(to) {
	ajaxGet("work/invite/" + to, null, function(result) {
		if (result === true) 
			inviteSuccess();
		else
			inviteFailed();
	});
}

function inviteFailed() {
	_g("inviteField").style.boxShadow = "0px 0px 15px #ff0000";
}

function inviteSuccess() {
	_g("inviteField").style.boxShadow = "none";
	_g("inviteField").value = "";
	_g("inviteField").placeholder = "Sent!";
	setTimeout(hideAllPopups, 1000);
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
	if (username == USERHANDLES[curUser])
		return checkUsernameCallback(1);

	ajaxGet("work/checkusername/" + username,null,checkUsernameCallback);
}

function checkUsernameCallback(result) {
	var message = "";
	switch(result) {
		case false:
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
		case "privacy":
			obj = { private: form.private[0].checked }
			type = "privacy";
			break;
		case "account":
			obj = { password: form.delete.value }
			type = "delete";
			break;
		default:
			obj = { username: form.username.value, email: form.email.value, displayname: form.displayname.value }
			type = "settings";
			break;
	}
	ajaxGet("work/" + type, obj, function(result) {
			if (result.authkey) {
				AUTHKEY = result.authkey;
				document.cookie = "D=" + curUser + "," + AUTHKEY;
			}
			updateSettingsCallback(result.result, result.message);
		});

	_g("savesettings").value = "Saving...";
}
function updateSettingsCallback(result, message) {
	console.log(result);
	_g("settings_result").innerHTML = message;
	_g("settings_result").className = result == true ? "ok" : "error";

	if (result) {
		_g("savesettings").value = "Saved";
		setTimeout(function() {
			_g("savesettings").value = "Save Settings";
		}, 4000);
	}
}

