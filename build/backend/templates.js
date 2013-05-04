exports.parse = function(data) {
	var obj = "" + data;
	obj = obj.replace(/\"/g, "\\\"");

	obj = obj.replace(/\{([^\n}]*)\}/g, function(match,m1) {
		return "\"+" + m1 + "+\"";
	});

	obj = obj.replace(/(\<\%\ if\ )(\((.*)\))(\ \%\>)/g, function(match,m1, m2) {
		return "\"+((" + m2 + ")?(\"";
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

	obj = obj.replace(/\n/gm, "");
	obj = obj.replace(/\r/gm, "");
	obj = obj.replace(/\t/gm, "");

	return "var html = \"" + obj + "\";";

}
