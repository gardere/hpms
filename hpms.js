var cluster = require('cluster');
var q = require('q');
var amqplib = require('amqplib/callback_api');
var _ = require('lodash');
 
var queueName = 'events';
 
var nbrOfRequestsServed = 0;
 
 
function openMQChannel() {
  var deferred = q.defer();
 
  amqplib.connect('amqp://localhost', function(err, conn) {
    if (err != null) throw err;
    conn.createChannel(function(err, channel) {
      if (err != null) throw err;
      deferred.resolve(channel);
    });
  });
 
  return deferred.promise;
}
 
function startCluster(options) {
  if (cluster.isMaster) {
  	startWorkers();
  	startServerStatsReport();
  } else {
  	startWorker(options.serverPort);
  }
}
 
function startWorkers() {
  var cpuCount = require('os').cpus().length;
 
  for (var i = 0; i < cpuCount; i += 1) {
    var worker = cluster.fork();
    worker.on('message', function(nbr) {
    	nbrOfRequestsServed += nbr;
    });
  }
  console.log('microservice ready!');
}
 
function startWorker(serverPort) {
  	openMQChannel().
    then(_.partial(startWebServer, serverPort));
 
    startWorkerStatsReport();
}
 
function startWebServer(messageChannel, serverPort) {
  console.log('starting web server');
  var http = require('http');
 
  var server = http.createServer(function(req, res) {
 
    var msg = req.url.substring(1);
    messageChannel.assertQueue(queueName);
    messageChannel.sendToQueue(queueName, new Buffer(msg));
 
    res.writeHead(200);
    res.end();
 
    nbrOfRequestsServed++;
  });
  server.listen(serverPort);
}
 
 
cluster.on('exit', function(worker) {
  console.log('Worker ' + worker.id + ' died :(');
  cluster.fork();
});
 
 
function startWorkerStatsReport() {
	//Report stats every  minute
	setInterval(reportWorkerStats, 60000);
}
 
function startServerStatsReport() {
	//Output stats to the console every 5 minutes
	setInterval(function() {
		console.log('number of requests served: ' + nbrOfRequestsServed);
	}, 30000)
}
 
function reportWorkerStats() {
	process.send(nbrOfRequestsServed);
	nbrOfRequestsServed = 0;
}

module.exports.startCluster = startCluster;
