//Location should be used if mobile computing

//HTML
var HTML_LOCATION_FAILEDTOGETLOCATION = "<div style='text-align:center'><h2>location unavailable</h2>" + "Instancy does not have permission to access your location.<br>";

var currentLocation = "";

function updateLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(locationCallback, failedToGetLocation);
	}
}

function locationCallback(loc) {
	
	hideBanner('locusage');
	
	var data = [];
	data["loc"] = loc.coords.latitude + "," + loc.coords.longitude;
	
	ajaxGet("work/updatelocation.php", data);
	if (location.hash == "#/nearby") {
		updatePages();
	} //HACK
	
	currentLocation = data["loc"];
}

function failedToGetLocation() {
	_g("content").innerHTML = HTML_LOCATION_FAILEDTOGETLOCATION;
}

