#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 --port <PORT_NUMBER> --queue <QUEUE_NAME>')
  .demand('p')
  .nargs('p', 1)
  .alias('p', 'port')
  .describe('p', 'Specify the port HPMS is listening to')
  .demand('q')
  .nargs('q', 1)
  .alias('q', 'queue')
  .describe('q', 'Name of the queue received messages will be added to')
  .argv;


require('./hpms.js').startCluster({
  serverPort: argv.port
});
