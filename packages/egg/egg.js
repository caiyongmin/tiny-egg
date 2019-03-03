const EggCore = require('./../egg-core').EggCore;
const AppWorkerLoader = require('./loader/app_worker_loader');

// 找到 egg 中的 EGG_LOADER
const EGG_LOADER = Symbol.for('egg#loader');
const EGG_PATH = Symbol.for('egg#path');

class EggApplication extends EggCore {
  constructor(options) {
    super(options);

    this.on('error', err => {
      console.log(err);
    });

    /**
     * 实例化 EggApplication 对象中加载需要加载的文件
     * 使用加载 AppWorkLoader 实例化之后的对象的 loadAll 方法来加载文件
     */
    this.loader.loadAll();
  }

  /**
   * 设置 this[EGG_LOADER] 的值
   */
  get [EGG_LOADER]() {
    return AppWorkerLoader;
  }

  get [EGG_PATH]() {
    return __dirname;
  }
}

module.exports = EggApplication;
