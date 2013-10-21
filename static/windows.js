var activeWindows = [];
var closeActions = {};

function addWindow(id,closeAction) {
	if (_g("window_" + id)) return "window_" + id;
	var ele = document.createElement("div");
	ele.className = 'window';
	ele.id = "windowc_" + id;
	ele.innerHTML = "<div class='title'><span id='windowtitle_" + id + "'></span><a id='windowclose_" + id + "'>X</a></div><div class='windowcontent' id='window_" + id + "'></div>";

	_g("windowcontainer").appendChild(ele);

	activeWindows.push(id);
	closeActions[id] = closeAction;

	_g('windowclose_'+id).onclick = closeWindow;
	var sc = _g('window_'+id)
	sc.onmousewheel = function(e) { 
		if (e.wheelDelta < 0 && sc.scrollTop >= sc.scrollHeight - sc.clientHeight) 
			e.preventDefault(); 
		if (e.wheelDelta > 0 && sc.scrollTop == 0)
			e.preventDefault();
	};

	positionWindows();

	handleNotifications();

	return "window_" + id;
}

function setWindowTitle(id,title) {
	if(title.length < 45){
		_g("windowtitle_"+id).innerHTML = title;
	}
	else{
		_g("windowtitle_"+id).innerHTML = title.substring(0, 42) + "...";
	}
}

function closeWindow(e) {
	var id = e.target.id.split("_")[1];
	closeActions[id]();
	console.log(activeWindows);
	console.log(id);
	activeWindows.splice(activeWindows.indexOf(id),1);
	var ele = _g("windowc_"+id);
	ele.parentElement.removeChild(ele);
	ele = null;
	positionWindows();
}

function positionWindows() {
	var x = 20;
	console.log(activeWindows);
	for (i in activeWindows) {
		_g("windowc_"+activeWindows[i]).style.left = x + "px";
		x += 380;
		console.log(i);
	}
}
