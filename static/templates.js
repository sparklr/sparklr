/* Sparklr
 * templates.js: Very small, simple template engine
 */

// define templates, or, if compiled, it already exists
var TEMPLATES = TEMPLATES || {};
var CONTROLLERS = CONTROLLERS || {};

function renderPageFromTemplate() {
	renderTemplate(location.hash.substring(2),'content',function() {
		defaultSidebar();
	});
}

function renderTemplate(page,destination,callback) {
	var fragments = page.split("/");
	var cb = function(data, xhr) {
		if (xhr && xhr.status === 404) {
			return _g(destination).innerHTML = getTemplate("404")();
		}
		if (data && data.error === true) return;

		if (spc = _g("sidepost_container"))
			spc.innerHTML = "";

		controller = CONTROLLERS[fragments[0]];

		if (controller && controller.before)
			controller.before(data, fragments);

		var html = getTemplate(fragments[0])(data);
		_g(destination).innerHTML = html;

		if (controller && controller.after)
			controller.after(data, fragments);

		scrollHandler();
		updateUI();

		if (callback)
			callback();
	}
	if (callback !== false)
		ajax(page, null, cb);
	else
		cb();
}

function getTemplate(id) {
	if (!TEMPLATES[id]) {
		templatedata = getStaticFile(STATICHOST + "../templates/" + id + ".html");
		TEMPLATES[id] = new Function("it", t(templatedata));
	}
	return TEMPLATES[id];
}

function getStaticFile(url) {
	if (LIVE) return null;

	var data = "";
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			data = xhr.responseText;
		}
	}
	xhr.open("GET", url, false);
	xhr.send(null);

	return data;
}

/*
 * string -> html = "string"
 * {{ expression }} -> " + expression + "
 * <script>expression</script> -> "; (expression) html += "
 */
function t(data) {
	var obj = "" + data;
	obj = obj.replace(/\"/g, "\\\"");

	obj = obj.replace(/\$/g, "it.");

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

	obj = obj.replace(/<\?((.|\n|\r)*?)\?\>/g, function(match) {
		return match.replace(/\\\"/g, "\"");
	});

	obj = obj.replace(/\<\?/g, "\";");
	obj = obj.replace(/\?\>/g, "html+=\"");

	obj = obj.replace(/\n/gm, "");
	obj = obj.replace(/\r/gm, "");
	obj = obj.replace(/\t/gm, "");

	return "var html = \"" + obj + "\";return html;";
}
if (typeof(exports) !== "undefined")
	exports.t = t;

