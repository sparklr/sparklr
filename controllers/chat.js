function before(data, fragments, scope) {
	scope.user = fragments[2] || fragments[1];
	scope.convoid = user + "," + CURUSER;
}

function after(data, fragments, scope) {
	chatTimes[scope.convoid] = [];

	for (var i = data.length - 1; i >= 0; i--) {
		addChatMessage(data[i].from, data[i].to, data[i].message, data[i].time, false);
	}

	var e = _g('scrollUpContent_'+convoid);
	e.addEventListener("DOMMouseScroll", scrollUpHandler);
	e.addEventListener("mousewheel", scrollUpHandler);
	_g("composer_chat_"+user).focus();
	window.onload = function() {
		_g("scrollUpContent_"+convoid).scrollTop = 0xFFFFFF; 
	};

	setWindowTitle('m'+convoid, getDisplayName(user));
}

//TODO: USE EXPORTS
