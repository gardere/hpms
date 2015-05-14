#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 --port 1234')
  .demand('p')
  .nargs('p', 1)
  .alias('p', 'port')
  .describe('p', 'Specify the port HPMS is listening to').
  argv;


require('./hpms.js').startCluster({
  serverPort: argv.port
});
