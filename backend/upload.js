var fs = require("fs");
var os = require("os");
var spawn = require("child_process").spawn;

var start = (new Date()).getTime().toString(36);
var id = 0;

exports.handleUpload = function(data, userobj, args, callback) {
	id++;
	var imgid = args.id || (userobj.id + "_" + start + "_" + id.toString(36));

	var tmpfile = os.tmpdir() + "/upload_" + imgid;

	var outfile = global.storageDir + "/" + (args.category || "");

	if (!args.allowGif) {
		imgid += ".jpg";
	} else {
		if (data.substring(0,16).indexOf("image/gif") != -1) {
			imgid += ".gif";
		} else {
			imgid += ".jpg";
		}
	}

	var outthumb = outfile + "t" + imgid;
	outfile += imgid;


	fs.writeFile(tmpfile, data.substring(data.indexOf(",") + 1), "base64", function(err) {
		data = null;

		if (err) callback(err);
		resizeImage(tmpfile, outfile, function() {
			if (args.width) {
				makeThumb(tmpfile, outthumb, args, function() {
					callback(null,imgid);
				});
			} else 
				callback(null,imgid);
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
						"-dispose",
						"background",
						"-gravity",
						"center",
						"-thumbnail",
						(size.width) + "x" + (size.height) + ">" + (size.fill ? "^" : ""),
						"-crop",
						size.width + "x" + size.height + "+0+0",
						"-strip",
						output
	]);
	process.stderr.on("data", function(data) {
		console.log("UploadErr: " + data);
	});
	process.on("close", function(code) {
		callback(code);
	});
}
