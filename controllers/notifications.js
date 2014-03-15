CONTROLLERS['notifications'] = {};

CONTROLLERS['notifications'].after = function(data, fragments) {
	for(var i = data.length-1; i >= 0; i--){
		if(!data[i]) continue;
		addNotificationToPage(data[i]);
	}
}

