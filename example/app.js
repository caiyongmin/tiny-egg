const EggApplication = require('./../packages/egg').EggApplication;
const http = require('http');

const app = new EggApplication({
  baseDir: __dirname,
  type: 'application',
});
const server = http.createServer(app.callback());

server.once('error', err => {
  console.log('[app_worker] server got error: %s, code: %s', err.message, err.code);
  process.exit(1);
});

server.listen(8001, () => {
  console.log('server started at localhost:8001');
});

