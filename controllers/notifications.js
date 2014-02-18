function after(scope) {
	for(var i in scope.data){
		if(!scope.data[i]) continue;
		addNotificationToPage(scope.data[i]);
	}
}
