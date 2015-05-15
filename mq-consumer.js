var cluster = require('cluster');
var events = require('events');
var q = require('q');

var amqplib = require('amqplib/callback_api');
var messagesProcessedByConsumers = 0;


function ConsumerProcess(options) {
  var _options = options;
  var _channel;
  var self = this;

  var openMQChannel = function(options) {
    var deferred = q.defer();

    amqplib.connect(options.mqServerAddress, function(err, conn) {
      if (err != null) throw err;
      conn.createChannel(function(err, channel) {
        _channel = channel
        deferred.resolve();
      });
    });

    return deferred.promise;
  }

  this.start = function() {
    openMQChannel(_options).
    then(function() {
      _channel.assertQueue(_options.queueName);
      _channel.consume(_options.queueName, messageReceived);
    });
  };

  var messageReceived = function(message) {
    var messageContent = message.content.toString();
    try {
      if (_options.messageProcessor) {
        messageContent = _options.messageProcessor(messageContent);
      }
      self.emit('message_received', messageContent);
      _channel.ack(message);
    } catch (error) {
      console.log('error: ' + error);
    }
  };

  return this;
}

ConsumerProcess.super_ = events.EventEmitter;
ConsumerProcess.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: ConsumerProcess,
    enumerable: false
  }
});


function startConsumer(options) {
  if (cluster.isMaster) {
    startWorkers();
    setInterval(reportStats, 30000);
  } else {
    startWorker(options);
  }
}

function reportStats() {
  console.log(messagesProcessedByConsumers + ' messages consumed and processed');
}

function messageReceived(message) {
  messagesProcessedByConsumers++;
}

function startWorkers() {
  var cpuCount = require('os').cpus().length;

  for (var i = 0; i < cpuCount; i += 1) {
    var worker = cluster.fork();
    worker.on('message', messageReceived);
  }
}

function startWorker(options) {
  var consumer = new ConsumerProcess(options);
  consumer.on('message_received', function (data) {
    process.send(data);
  });
  consumer.start();
}

module.exports.startConsumer = startConsumer;
