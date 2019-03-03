const path = require('path');

module.exports = {
  loadService(options) {
    options = Object.assign({
      fieldClass: 'serviceClasses',
      // just support current app service
      directory: path.join(this.options.baseDir, 'app/service'),
    }, options);

    const servicePath = options.directory;
    this.loadToContext(servicePath, 'service', options);
  },
};
