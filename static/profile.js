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

