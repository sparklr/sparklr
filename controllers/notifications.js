function after(scope) {
	for(var i = scope.data.length-1; i >= 0; i--){
		if(!scope.data[i]) continue;
		addNotificationToPage(scope.data[i]);
	}
}
