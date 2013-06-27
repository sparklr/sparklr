// Main entry for p18 build script

var cssBuilder = require("./css");
var templatesBuilder = require("./templates");

templatesBuilder.build();
cssBuilder.build();

