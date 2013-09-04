var cluster = require("cluster");

if (cluster.isMaster) {
	console.log("As for our destination, the wind will guide us!");
	console.log("PID: " + process.pid);
	require("fs").writeFile("../../luna.pid", process.pid);

	var numCPUs = 1 || require('os').cpus().length;

	for (var i = 0; i < numCPUs; i++) {
		var w = cluster.fork();
	}

	cluster.on("exit", function(worker, code) {
		console.log("Debug: Worker exitted with code: " + code);
		if (code != 0)
			cluster.fork();
	});

	process.on("SIGUSR2", function() {
		console.log((new Date).toString() + ": Reloading app...");

		delete require.cache;

		var workersKilled = 0;
		var workerIds = Object.keys(cluster.workers);

		var shutdownWorker = function() {
			if (workersKilled == workerIds.length) {
				console.log("Reloading complete.");
				shutdownWorker = null;
				return;
			}

			console.log("Debug: Disconnecting " + workerIds[workersKilled]);

			cluster.workers[workerIds[workersKilled]].disconnect();
			var newWorker = cluster.fork();
			newWorker.once("listening", function() {
				console.log("Debug: Replacement online.");
				workersKilled++;
				shutdownWorker();
			});
		}
		shutdownWorker();
	});

} else {
	var backend = require("./backend");
}

