var fs = require("fs");
var os = require("os");
var toolbox = require("./toolbox");
var exec = require("child_process").execFile;

exports.build = function() {
	console.log("Building CSS...");

	// Load the source CSS
	var css = fs.readFileSync("../static/app.css");

	// Generate a sha1 hash for the file name 
	var cssHash = toolbox.sha1(css);

	// regex for: background-image: url(someimage.png)
	var spriteRegex = /\image: url\((.*)\)/g;

	// Keep track of how many identify commands have completed
	var identCounter = 0;
	var imgHeight = {};

	css = css.toString().replace(spriteRegex, function(match, img) {
		// Identify the image to get its dimensions
		exec("identify", ["../static/" + img], function(err,data) {
			var flags = data.toString().split(" ");
			imgHeight[img] = parseInt(flags[2].split("x")[1]);
			identCounter--;

			if (identCounter == 0) {
				buildCSSSprite();
			}
		});
		identCounter++;

		return match;;
	});

	var buildCSSSprite = function() {
		var sorted = Object.keys(imgHeight);

		sorted.sort(function(a,b) { // sort the file names, so that the sprites maintain order
			return (a.localeCompare(b));
		});

		var args = [];
		for (i in sorted) { // add each file
			args.push("../static/" + sorted[i]);
		}

		args.push("-append");

		var outputFileName = os.tmpdir() + "/p18_sprite.png";
		args.push(outputFileName);

		exec("convert", args, function(err) {
			if (err) {
				console.log(err);
				process.exit();
			}

			var spritehash = toolbox.sha1(fs.readFileSync(outputFileName));

			css = css.replace(spriteRegex, function(match,img) {
				var y = 0;
				for (imgs in imgHeight) {
					if (imgs == img) break;
					y += imgHeight[imgs];
				}
				return "image: url(" + spritehash + ".png);\nbackground-position: 0px -" + y + "px;";
			});

			fs.writeFileSync("../static/out/" + cssHash + ".css", css);
			console.log("CSS Out: " + cssHash);
		});
	};
}

