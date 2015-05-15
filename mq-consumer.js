var amqplib = require('amqplib/callback_api');
var cluster = require('cluster');

function ConsumerProcess() {

}

function startConsumer(options) {
  if (cluster.isMaster) {
    startWorkers();
  } else {
    startWorker(options);
  }
}

function startWorkers() {
  var cpuCount = require('os').cpus().length;
 
  for (var i = 0; i < cpuCount; i += 1) {
    var worker = cluster.fork();
    worker.on('message_received', messageReceived);
  }
  console.log('microservice ready!');
}

module.exports.startConsumer = startConsumer;
