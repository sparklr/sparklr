/* Sparklr
 * Handle windows (little popups within the page)
 */

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

	positionWindows();

	handleNotifications();

	return "window_" + id;
}

function setWindowTitle(id,title) {
	var g = _g("windowtitle_"+id);
	if (!g) return;

	if(title.length < 45){
		g.innerHTML = title;
	}
	else{
		g.innerHTML = title.substring(0, 42) + "...";
	}
}

function closeWindow(e,id) {
	if (!id)
		var id = e.target.id.split("_")[1];
	closeActions[id]();

	activeWindows.splice(activeWindows.indexOf(id),1);
	var ele = _g("windowc_"+id);
	ele.parentElement.removeChild(ele);
	ele = null;
	positionWindows();
}

function positionWindows() {
	var x = 40;
	for (i in activeWindows) {
		_g("windowc_"+activeWindows[i]).style.left = x + "px";
		x += 380;
	}
}

