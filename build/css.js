var fs = require("fs");
var os = require("os");
var toolbox = require("./toolbox");
var exec = require("child_process").execFile;

var cleanCSS = require("clean-css");

exports.build = function(callback) {
	console.log("Building CSS...");

	// Load the source CSS
	var css = fs.readFileSync("../static/app.css").toString();

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

		args.push("-background");
		args.push("none");

		for (i in sorted) { // add each file
			args.push("../static/" + sorted[i]);
		}

		args.push("-tile");
		args.push("1x");
		args.push("-geometry");
		args.push("+0+2");

		var outputFileName = os.tmpdir() + "/p18_sprite.png";
		args.push(outputFileName);

		exec("montage", args, function(err) {
			if (err) {
				console.log(err);
				process.exit();
			}

			var spritehash = toolbox.sha1(fs.readFileSync(outputFileName));

			css = css.replace(spriteRegex, function(match,img) {
				var y = 2;
				for (i in sorted) {
					if (sorted[i] == img) break;
					y += imgHeight[sorted[i]] + 4;
				}
				return "image: url(" + spritehash + ".png);\nbackground-position: 0px -" + y + "px;";
			});

			fs.writeFileSync("out/" + spritehash + ".png", fs.readFileSync(outputFileName));

			// CSS Sprite is now generated. Next step.
			buildCSSPrefixes();

		});
	};

	var buildCSSPrefixes = function() {
		var prefixes = ["", "-webkit-"];
		var prefix = "";
		var propertyRegex = /\-webkit\-(.*)\;/g;

		var replacefunc = function(match,property) {
			var result = "";
			result += prefix + property + ";\n";
			return result;
		};

		var lines = css.split("\n");
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].substring(0,9) == "@-webkit-" && lines[i].indexOf("{") != -1) {
				var parens = 1;
				var content = "";
				var l = i;
				while (parens != 0) {
					l++;
					for (var c = 0; c < lines[l].length; c++) { // never gets old 
						if (lines[l][c] == "{")
							parens += 1;
						if (lines[l][c] == "}")
							parens -= 1;
					}
					if (parens != 0)
						content += lines[l] + "\n";
					if (l >= lines.length) break;
				}
				var property = lines[i].replace("@-webkit-","");
				var newdata = "";
				for (n in prefixes) {
					var block = "\n@" + prefixes[n] + property;
					block += content + "\n}";

					prefix = prefixes[n];
					block = block.replace(propertyRegex, replacefunc);

					newdata += block;
				}
				for (var c = i; c <= l; c++) {
					lines[c] = "";
				}
				
				lines[i] = newdata;
			} else {
				if (propertyRegex.exec(lines[i])) {
					var newdata = "";
					for (n in prefixes) {
						prefix = prefixes[n];
						newdata += lines[i].replace(propertyRegex, replacefunc) + "\n";
					}
					lines[i] = newdata;
				}
			}
		}
		css = lines.join("\n");	

		writeCSS();
	};

	var writeCSS = function() {
		// Last step: minify it 
		css = cleanCSS.process(css);

		fs.writeFileSync("out/" + cssHash + ".css", css);
		console.log("CSS written: " + cssHash);
		callback(cssHash);
	};

}

