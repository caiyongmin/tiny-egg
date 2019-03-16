const path = require('path');

// use staticCache plugin
exports.staticCache = {
  enable: true,
  path: path.join(__dirname, './../lib/plugin/egg-static-cache'),
};
