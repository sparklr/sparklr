/* Sparklr
 * templates.js: Very small, simple template engine
 */

// define templates, or, if compiled, it already exists
var TEMPLATES = TEMPLATES || {};
var CONTROLLERS = CONTROLLERS || {};

function renderPageFromTemplate() {
	renderTemplate(location.hash.substring(2),'content',function() {
		if (_g("sidebar_links")) {
			_g("sidebar").innerHTML = _g("sidebar_links").innerHTML;
			_g("sidebar_links").innerHTML = "";
		} else {
			defaultSidebar();
		}
	});
}

function renderTemplate(page,destination,callback) {
	var fragments = page.split("/");
	ajax("work/" + page, null, function(data) {
		console.log(data);
		if (data && data.error === true) return;

		var scope = { data: data, fragments: fragments };

		controller = getController(fragments[0]);

		if (controller && controller.before)
			controller.before(scope);

		var templateData = getTemplate(fragments[0]);
		eval("with(scope){"+templateData+"}");

		_g(destination).innerHTML = html;

		if (controller && controller.after)
			controller.after(scope);

		updateUI();
		callback();
	});
}

function getTemplate(id) {
	if (!TEMPLATES[id]) {
		templatedata = getStaticFile(COMMONHOST + "../templates/" + id + ".html");
		TEMPLATES[id] = t(templatedata);
	}
	return TEMPLATES[id];
}

function getController(id) {
	if (!CONTROLLERS[id]) {
		controller = getStaticFile(COMMONHOST + "../controllers/" + id + ".js");
		eval(controller);
		if (typeof(before) === "undefined") return false;
		CONTROLLERS[id] = { before: before, after: after };
	}
	return CONTROLLERS[id];
}

function getStaticFile(url) {
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

