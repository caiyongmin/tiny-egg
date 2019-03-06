const fs = require('fs');
const path = require('path');
const is = require('is-type-of');
const FileLoader = require('./../utils/file_loader');
const ContextLoader = require('./../utils/context_loader');

/**
 * EggLoader 负责加载文件、提供往 this.app 和 this.context 对象上挂载属性的方法
 * 还有往 EggLoader.prototype 原型对象上挂载各种加载方法，来加载框架约定好的文件目录下的文件
 * 后面的 AppWorkLoader 会基于 EggLoader 来处理具体的加载操作，比如 loadRouter、loadController
 */
class EggLoader {
  constructor(options) {
    this.options = options;
    this.app = this.options.app;
  }

  /**
   * 加载文件内容
   * @param {String} filePath 文件路径
   * @param  {...any} inject 参数列表
   */
  loadFile(filePath, ...inject) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const extname = path.extname(filePath);
    if (!['.js', '.json', '.node', ''].includes(extname)) {
      return fs.readFileSync(filePath);
    }

    const ret = require(filePath);
    if (inject.length === 0) {
      inject = [this.app];
    }

    if (is.function(ret) && !is.class(ret)) {
      return ret(...inject);
    }

    return ret;
  }

  /**
   * 往 this.app 对象上挂载属性
   */
  loadToApp(directory, property, options) {
    const target = this.app[property] = {};
    options = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, options);

    new FileLoader(options).load();
  }

  /**
   * 往 this.ctx 对象上挂载属性
   */
  loadToContext(directory, property, options) {
    options = Object.assign({
      directory,
      property,
      inject: this.app,
    }, options);

    new ContextLoader(options).load();
  }
}

/**
 * 挂载到 EggLoader.prototype 对象上一些加载方法
 * 来指定加载哪些文件夹下的哪些文件，把它们赋值到对应的属性对象上，比如 this.ctx 和 this.app.controller
 */
const loaders = [
  require('./mixins/service'),
  require('./mixins/router'),
  require('./mixins/controller'),
];

for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

module.exports = EggLoader;
