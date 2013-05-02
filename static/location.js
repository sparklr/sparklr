//Location should be used if mobile computing

//HTML
var HTML_LOCATION_USAGE = "Your location is used purely for localization and is not shared with anyone.";
var HTML_LOCATION_FAILEDTOGETLOCATION = "<div style='text-align:center'><h2>location unavailable</h2>" + "Prototype18 does not have permission to access your location.<br>" + HTML_LOCATION_USAGE;

var infoPopup;

var currentLocation = "";

function updateLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(locationCallback, failedToGetLocation);
		infoPopup = setTimeout("showLocationInfoPopup();", 1000);
	}
}

function locationCallback(loc) {
	
	hideLocationInfoPopup();
	
	clearTimeout(infoPopup);
	
	var data = [];
	data["loc"] = loc.coords.latitude + "," + loc.coords.longitude;
	
	ajaxGet("work/updatelocation.php", data);
	if (location.hash == "#/nearby") {
		updatePages();
	} //HACK
	
	currentLocation = data["loc"];
}

function failedToGetLocation() {
	clearTimeout(infoPopup);
	
	hideLocationInfoPopup();
	
	_g("content").innerHTML = HTML_LOCATION_FAILEDTOGETLOCATION;
}

function showLocationInfoPopup() {
	var div = document.createElement("div");
	div.innerHTML = HTML_LOCATION_USAGE;
	div.id = "infopopup_location";
	div.className = "infopopup slideinfromtop";
	
	document.body.appendChild(div);
}

function hideLocationInfoPopup() {
	var e = _g("infopopup_location");
	if (e)
		document.body.removeChild(e);
}