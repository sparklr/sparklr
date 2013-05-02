var FRIENDS = [];
var USERHANDLES = [];
function getAvatar(id) {
	return STATICHOST + "/thumb/" + id;
}

function getDisplayName(id) {
	if (DISPLAYNAMES[id])
		return DISPLAYNAMES[id];
	return "@"+getUserHandle(id);
//	return id;
}
function getUserHandle(id) {
	if (USERHANDLES[id])
		return USERHANDLES[id];
	return id;
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
	ajaxGet("work/follow.php?id="+id);	
}
function unfollow(id) {
	ajaxGet("work/unfollow.php?id="+id);
}
function mention(handle) {
	location.href='#/mention/'+handle;
}
function signOff() {
	ajaxGet("work/logout.php");
}

function inviteFriend() {
	showPopup("<form target='datapusher' method='POST' action='work/invite.php'><input type='text' class='t1' id='inviteField' name='to' autofocus='true' placeholder='notjulia@orangemelt.com'><input type='submit' class='s1' value='➜'></form>");
}
function inviteFailed() {
	_g("inviteField").style.boxShadow = "0px 0px 15px #ff0000";
}
function inviteSuccess() {
	var i = _g("inviteField")
	i.style.boxShadow = "none";
	i.value = "";
	i.placeholder = "Sent!";
	setTimeout(hideAllPopups, 1000);
}
function searchCallback(users) {
	var html = "";
	
	for(i=0;i<users.length;i++) {
		html += "<div class='friend fadein' onClick='location.href=\"#/user/" + users[i].id + "\";' style='background-image: url(" + STATICHOST + "/users/" + users[i].id + ");-webkit-animation-duration " + (Math.random() * 1) + "s'><span>" + users[i].name + "</span></div>";
	}
	
	_g("searchResults").innerHTML = html;
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

	ajaxGet("work/checkusername.php?username=" + username);
}
function checkUsernameCallback(result) {
	var message = "";
	switch(result) {
		case 0:
			message = "Awh, somebody already took that :c";
		break;
		case 2:
			message = "Usernames must be letters and numbers only";
		break;
	}
	_g("username_callback").innerHTML = message;
}
function updateSettingsCallback(result) {
	var message = "";
	
	if (result == 1)
		message = "Your <b>current password</b> is incorrect.";
	
	_g("settings_result").innerHTML = message;
	_g("settings_result").className = result == 0 ? "ok" : "error";

	if (message == "") {
		_g("savesettings").value = "Saved";
		setTimeout(function() {
			_g("savesettings").value = "Save Settings";
		}, 4000);
	}
}

