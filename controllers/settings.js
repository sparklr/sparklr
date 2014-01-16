function after(scope) {
	USERHANDLES[CURUSER] = scope.data.username;
	var blacklist = (scope.data.blacklist || "").split(",");
	for (i in blacklist) {
		if (!blacklist[i]) continue;
		addUserToList(0, blacklist[i]);
	}
}
