const EggLoader = require('./../../egg-core').EggLoader;

/**
 * 基于 Eggloader 来开发
 * 处理需要加载哪些文件内容
 */
class AppWorkerLoader extends EggLoader {
  /**
   * 加载所有需要加载的文件
   */
  loadAll() {
    this.loadController();
    this.loadRouter();
  }
}

module.exports = AppWorkerLoader;
