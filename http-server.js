#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 --port <PORT_NUMBER> --queue-name <QUEUE_NAME> --m <MQ_SERVER_ADDRESS>')
  .demand('p')
  .nargs('p', 1)
  .alias('p', 'port')
  .describe('p', 'Specify the port HPMS is listening to')
  .demand('q')
  .nargs('q', 1)
  .alias('q', 'queue-name')
  .describe('q', 'Name of the queue received messages will be added to')
  .nargs('m', 1)
  .default('m', 'amqp://localhost')
  .alias('m', 'MQ-server-address')
  .describe('m', 'Address of the MQ server')
  .argv;


require('./hpms.js').startCluster({
  serverPort: argv.p,
  mqServerAddress: argv.m,
  queueName: argv.q
});
