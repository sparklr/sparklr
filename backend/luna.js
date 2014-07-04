/* Sparklr
 * Main backend entry
 * Loads the workers
 */

var cluster = require("cluster");
var log = require("./log");

if (cluster.isMaster) {
	log("As for our destination, the wind will guide us!");
	log("PID: " + process.pid);

	// calculate a random reboot key for internal server maintenance
	var rbkey = process.pid + Math.floor(Math.random() * 100000);
	log("RBKEY: " + rbkey);

	// store the rbkey for sending the reload call
	require("fs").writeFile("../../luna.pid", rbkey);

	var numCPUs = require('os').cpus().length;

	for (var i = 0; i < numCPUs / 2; i++) {
		var w = cluster.fork();
		w.on("message", handleMsg);
	}

	cluster.on("exit", function(worker, code) {
		log("Debug: Worker exitted with code: " + code);
		if (code != 0) {
			var w = cluster.fork();
			w.on("message", handleMsg);
		}
	});

	function handleMsg(data) {
		if (data != "R:" + rbkey) {
			for (id in cluster.workers) {
				cluster.workers[id].send(data);
			}
			return;
		}
		log("Reloading app...");

		require.cache = null;
		delete require.cache;

		var workersKilled = 0;
		var workerIds = Object.keys(cluster.workers);

		var shutdownWorker = function() {
			if (workersKilled == workerIds.length) {
				log("Reloading complete.");
				shutdownWorker = null;
				return;
			}

			var newWorker = cluster.fork();
			newWorker.once("listening", function() {
				log("Debug: Replacement online.");

				log("Debug: Disconnecting " + workerIds[workersKilled]);

				var prevWorker = cluster.workers[workerIds[workersKilled]];
				prevWorker.send('DIE');
				prevWorker.disconnect();
				setTimeout(function() {
					prevWorker.kill();
				}, 60000);

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

