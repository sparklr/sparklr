/* Sparklr
 * templates.js: Very small, simple template engine
 */

// define templates, or, if compiled, it already exists
var TEMPLATES = TEMPLATES || [];

function renderPageFromTemplate() {
	var fragments = location.hash.split("/");
	var renderPage = function(data) {
		// TODO
		if (data && data.error === true) return;

		var templateData = getTemplate(fragments[1]);
		eval(templateData);

		_g("content").innerHTML = html;
		if (_g("sidebar_links")) {
			_g("sidebar").innerHTML = _g("sidebar_links").innerHTML;
			_g("sidebar_links").innerHTML = "";
		} else {
			defaultSidebar();
		}
		updateUI();
	}
	if (staticPages[fragments[1]])
		renderPage();
	else
		ajax("work/" + location.hash.substring(2), null, renderPage);
}

function renderTemplate(page,destination) {
	var fragments = page.split("/");
	ajax("work/" + page, null, function(data) {
		console.log(data);
		var templateData = getTemplate(fragments[0]);
		console.log(templateData);
		eval(templateData);
		_g(destination).innerHTML = html;
	});
}

// TODO
function getTemplate(id) {
	if (!TEMPLATES[id]) {
		var templatedata = "";
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				templatedata = xhr.responseText;
			}
		}
		xhr.open("GET", COMMONHOST + "../templates/" + id + ".html", false);
		xhr.send(null);
		templatedata = t(templatedata);
		TEMPLATES[id] = templatedata;
		return templatedata;
	}
	else {
		return TEMPLATES[id];
	}
}

/*
 * string -> html = "string"
 * {{ expression }} -> " + expression + "
 * <script>expression</script> -> "; (expression) html += "
 */
function t(data) {
	var obj = "" + data;
	obj = obj.replace(/\"/g, "\\\"");

	obj = obj.replace(/\{([^\n}]*)\}/g, function(match,m1) {
		return "\"+" + m1 + "+\"";
	});

	obj = obj.replace(/(\<\%\ if\ )(\((.*)\))(\ \%\>)/g, function(match,m1, m2) {
		return "\"+((" + m2.replace(/\\\"/g, "\"") + ")?(\"";
	});

	obj = obj.replace(/(\<\%\ endif\ \%\>)/g, function(match,m1, m2) {

		return "\"):\"\")+\"";
	});

	obj = obj.replace(/(\<\%\ else\ \%\>)/g, function(match,m1, m2) {

		return "\"):(\"";
	});

	obj = obj.replace(/(\<\%\ endelse\ \%\>)/g, function(match,m1, m2) {

		return "\"))+\"";
	});

	obj = obj.replace(/<script\b[^>]*>((.|\n|\r)*?)<\/script>/g, function(match) {
		return match.replace(/\\\"/g, "\"");
	});

	obj = obj.replace(/\<script\>/g, "\";");
	obj = obj.replace(/\<\/script\>/g, "html+=\"");

	obj = obj.replace(/\n/gm, "");
	obj = obj.replace(/\r/gm, "");
	obj = obj.replace(/\t/gm, "");

	return "var html = \"" + obj + "\";";
}
if (typeof(exports) !== "undefined")
	exports.t = t;

