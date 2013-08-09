var fs = require("fs");
var os = require("os");
var spawn = require("child_process").spawn;
var async = require("async");

var start = (new Date()).getTime().toString(36);
var id = 0;

exports.handleUpload = function(data, userobj, args, callback) {
	id++;
	var imgid = start + "_" + id.toString(36);

	var tmpfile = os.tmpdir() + "/upload_" + imgid;

	var outfile = global.storageDir + "/" + args.folder;
	if (args.id) {
		outfile += "/" + args.id;
	} else {
		outfile += "/" + imgid;
	}

	var outthumb = outfile + "_thumb.jpg";
	outfile += ".jpg";

	fs.writeFile(tmpfile, data.substring(data.indexOf(",") + 1), "base64", function(err) {
		if (err) callback(err);

		async.parallel([
			function(callback) {
				if (args.width)
					makeThumb(tmpfile, outthumb, args, callback);
				else
					callback();
			},
			function(callback) {
				resizeImage(tmpfile, outfile, callback);
			}
		], function(err) {
			console.log("hi");
			callback(err, imgid);
		});
	});
}

function resizeImage(input, output, callback) {
	var process = spawn("convert", [input, "-resize", ">1920x1080", "-strip", output]);
	process.on("close", function(code) {
		callback(code);
	});
}

function makeThumb(input, output, size, callback) {
	var process = spawn("convert", [input,
						"-gravity",
						"center",
						"-thumbnail",
						">" + size.width + "x" + size.height + "^",
						"-crop",
						size.width + "x" + size.height + "+0+0",
						"-strip",
						output
	]);
	process.stderr.on("data", function(data) {
		console.log("Err: " + data);
	});
	process.on("close", function(code) {
		callback(code);
	});
}
