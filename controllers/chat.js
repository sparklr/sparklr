CONTROLLERS['chat'] = {
	"before": function(data, fragments) {
		data.user = fragments[1] || fragments[0];
		data.convoid = data.user + "," + CURUSER;
	},

	"after": function(data, fragments) {
		chatTimes[data.convoid] = [];

		for (var i = data.length - 1; i >= 0; i--) {
			addChatMessage(data[i], false);
		}

		var e = _g('chat_'+data.convoid);
		e.addEventListener("DOMMouseScroll", scrollUpHandler);
		e.addEventListener("mousewheel", scrollUpHandler);
		_g("composer_chat_"+data.user).focus();
		window.onload = function() {
			_g("chat_"+data.convoid).scrollTop = 0xFFFFFF;
		};

		setWindowTitle('m'+data.convoid, getDisplayName(data.user));
	}
}

