const path = require('path');
const extend = require('extend2');

module.exports = {
  loadConfig() {
    // 这里先只加载应用的 config 文件
    const appConfig = this._preloadAppConfig();

    this.config = appConfig;
  },

  /**
   * 应用本身的配置文件，包括 config.default.js 和 `config.${this.serverEnv}.js` 文件
   */
  _preloadAppConfig() {
    const names = [
      'config.default',
      `config.${this.serverEnv}`,
    ];
    const target = {};

    for (const filename of names) {
      const config = this._loadConfig(this.options.baseDir, filename);
      extend(true, target, config);
    }

    return target;
  },

  /**
   * 加载 config 文件
   * @param {String} dirpath 根目录
   * @param {String} filename 文件名
   */
  _loadConfig(dirpath, filename) {
    let filepath = this.resolveModule(path.join(dirpath, 'config', filename));
    // 适配 config.js 配置文件
    if (filename === 'config.default' && !filepath) {
      filepath = this.resolveModule(path.join(dirpath, 'config/config'));
    }

    const config = this.loadFile(filepath, this.appInfo);

    if (!config) {
      return null;
    }

    return config;
  },
};
