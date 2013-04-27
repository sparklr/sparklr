// A series of useful tools 
//

exports.time = function() {
	var date = new Date();
	return Math.floor(date.getTime() / 1000);
}
