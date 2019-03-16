const staticCache = require('koa-static-cache');
const mkdirp = require('mkdirp');

module.exports = (options) => {
  mkdirp.sync(options.dir);

  return staticCache(options);
};

