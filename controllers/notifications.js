function after() {
	for(var i in currentNotifications){
		if(!currentNotifications[i]) continue;
		addNotificationToPage(currentNotifications[i]);
	}
}
