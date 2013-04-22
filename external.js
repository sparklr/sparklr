exports.run = function(request, response) {
	response.writeHeader(200, { "Content-type": "text/html" });
	response.write("Hello, world. <a href='work/signin'>Sign in</a>");
	response.end();
}
