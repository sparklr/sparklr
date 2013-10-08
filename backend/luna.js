var cluster = require("cluster");

if (cluster.isMaster) {
	console.log("As for our destination, the wind will guide us!");
	console.log("PID: " + process.pid);
	var rbkey = process.pid + Math.floor(Math.random() * 100000);
	console.log("RBKEY: " + rbkey);

	require("fs").writeFile("../../luna.pid", rbkey);

	var numCPUs = require('os').cpus().length;

	for (var i = 0; i < numCPUs; i++) {
		var w = cluster.fork();
		w.on("message", handleMsg);
	}

	cluster.on("exit", function(worker, code) {
		console.log("Debug: Worker exitted with code: " + code);
		if (code != 0) {
			var w = cluster.fork();
			w.on("message", handleMsg);
		}
	});

	function handleMsg(data) {
		console.log("Msg received: " + data);
		if (data != "R:" + rbkey) { 
			for (id in cluster.workers) {
				cluster.workers[id].send(data);
			}
			return;
		}
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
			newWorker.on("message", handleMsg);
		}
		shutdownWorker();
	};

} else {
	var backend = require("./backend");
}

