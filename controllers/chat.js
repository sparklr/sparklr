function before(scope) {
	scope.user = scope.fragments[1] || scope.fragments[0];
	scope.convoid = scope.user + "," + CURUSER;
}

function after(scope) {
	chatTimes[scope.convoid] = [];

	for (var i = scope.data.length - 1; i >= 0; i--) {
		addChatMessage(scope.data[i].from, scope.data[i].to, scope.data[i].message, scope.data[i].time, false);
	}

	var e = _g('scrollUpContent_'+scope.convoid);
	e.addEventListener("DOMMouseScroll", scrollUpHandler);
	e.addEventListener("mousewheel", scrollUpHandler);
	_g("composer_chat_"+scope.user).focus();
	window.onload = function() {
		_g("scrollUpContent_"+scope.convoid).scrollTop = 0xFFFFFF; 
	};

	setWindowTitle('m'+scope.convoid, getDisplayName(scope.user));
}

