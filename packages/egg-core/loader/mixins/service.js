const path = require('path');

module.exports = {
  loadService(options) {
    options = Object.assign({
      fieldClass: 'serviceClasses',
      // 暂时先只解析当前的 app/service 目录下的方法
      directory: path.join(this.options.baseDir, 'app/service'),
    }, options);

    const servicePath = options.directory;
    this.loadToContext(servicePath, 'service', options);
  },
};
