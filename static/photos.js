//photos page obvi

function showPhotosPage(data) {
	// sorry for touching this i wanted to make sure everything still works bby
	var html = "<div class='contentwrapper'><h2>photos</h2>";
	
	for (var i = 0; i < data.photos.length; i++) {
		var meta = data.photos[i].meta.split(",");
		var author = data.photos[i].from;
		var id = data.photos[i].id;
		html  += "<div class='photos fadein' onClick='location.href=\"#/post/" + id + "\";' style='background: url(" + STATICHOST + "/storage/images/" + meta[0] + "_thumb.jpg);'><div class='lucille'>" + getDisplayName(author) + "</div></div>";
	}
	
	html += "</div>";

	_g("content").innerHTML = html;
	
	_g("sidebar").innerHTML = "";
	
}

