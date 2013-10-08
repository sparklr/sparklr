var activeWindows = [];
var closeActions = {};

function addWindow(id,closeAction) {
	if (_g("window_" + id)) return "window_" + id;
	var ele = document.createElement("div");
	ele.className = "window";
	ele.id = "windowc_" + id;
	ele.innerHTML = "<div id='window_" + id + "'></div><a id='windowclose_" + id + "'>Exit</a>";
	ele.onmousewheel = function(e) { 
		if (e.wheelDelta < 0 && ele.scrollTop >= ele.scrollHeight - ele.clientHeight) 
			e.preventDefault(); 
		if (e.wheelDelta > 0 && ele.scrollTop == 0)
			e.preventDefault();
	};

	_g("windowcontainer").appendChild(ele);

	activeWindows.push(ele.id);
	closeActions[id] = closeAction;

	_g('windowclose_'+id).onclick = closeWindow;

	positionWindows();

	return "window_" + id;
}

function closeWindow(e) {
	var id = e.target.id.split("_")[1];
	closeActions[id]();
	activeWindows.splice(activeWindows.indexOf(id),1);
	var ele = _g("windowc_"+id);
	ele.parentElement.removeChild(ele);
	ele = null;
	positionWindows();
}

function positionWindows() {
	var x = 10;
	for (i in activeWindows) {
		_g(activeWindows[i]).style.right = x + "px";
		x += 320;
	}
}
