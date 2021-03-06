var cluster = require('cluster');
var q = require('q');
var amqplib = require('amqplib/callback_api');
var _ = require('lodash');

var queueName = 'events';

var nbrOfRequestsServed = 0;


function openMQChannel(options) {
  var deferred = q.defer();

  amqplib.connect(options.mqServerAddress, function(err, conn) {
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
    startWorker(options);
  }
}

function forkThat() {
  var worker = cluster.fork();
  worker.on('message', function(nbr) {
    nbrOfRequestsServed += nbr;
  });
}

function startWorkers() {
  var cpuCount = require('os').cpus().length;

  for (var i = 0; i < cpuCount; i += 1) {
    forkThat();
  }
  console.log('microservice ready!');
}

function startWorker(options) {
  openMQChannel(options.mqServerAddress).
  then(_.partial(startWebServer, options));

  startWorkerStatsReport();
}

function startWebServer(options, messageChannel) {
  console.log('starting web server on port ' + options.serverPort);
  var http = require('http');
  var queueName = options.queueName;

  var server = http.createServer(function(req, res) {
    var msg = req.url.substring(1);
    messageChannel.assertQueue(queueName);
    messageChannel.sendToQueue(queueName, new Buffer(msg));

    res.writeHead(200);
    res.end();

    nbrOfRequestsServed++;
  });
  server.listen(options.serverPort);
}

cluster.on('exit', function(worker) {
  console.log('Worker ' + worker.id + ' died :(');
  forkThat();
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
