CONTROLLERS['settings'] = {
	"before": function (data, fragments) {
		data.page = fragments[1];
	},

	"after": function(data, fragments) {
		USERHANDLES[CURUSER] = data.username;
		var blacklist = (data.blacklist || "").split(",");
		for (i in blacklist) {
			if (!blacklist[i]) continue;
			addUserToList(0, blacklist[i]);
		}
	}
};

