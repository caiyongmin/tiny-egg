const path = require('path');
const fs = require('fs');
const utils = require('./../../utils/basic');

module.exports = {
  loadPlugin() {
    // 加载应用本身的 plugins
    const appPlugins = this.readPluginConfigs(
      path.join(this.options.baseDir, 'config/plugin.default')
    );

    this.allPlugins = {};
    this.appPlugins = appPlugins;

    // 这里只加载应用本身的 plugins
    this._extendPlugins(this.allPlugins, appPlugins);

    // 记录启用的 plugin 的 name
    const enabledPluginNames = [];
    const plugins = {};
    const env = this.serverEnv;
    for (const name in this.allPlugins) { // eslint-disable-line
      const plugin = this.allPlugins[name];

      // resolve the real plugin.path based on plugin or package
      plugin.path = this.getPluginPath(plugin, this.options.baseDir);

      // read plugin information from ${plugin.path}/package.json
      this.mergePluginConfig(plugin);

      // disable the plugin that not match the serverEnv
      if (env && plugin.env.length && !plugin.env.includes(env)) {
        plugin.enable = false;
        continue;
      }

      plugins[name] = plugin;
      if (plugin.enable) {
        enabledPluginNames.push(name);
      }
    }

    const enablePlugins = {};

    for (const name of enabledPluginNames) {
      enablePlugins[name] = plugins[name];
    }

    // 简单实现，这里不做 orderPlugins 操作

    this.plugins = enablePlugins;
  },

  // Read plugin information from package.json and merge
  // {
  //   eggPlugin: {
  //     "name": "",    plugin name, must be same as name in config/plugin.js
  //     "dep": [],     dependent plugins
  //     "env": ""      env
  //   }
  // }
  mergePluginConfig(plugin) {
    let pkg;
    let config;
    const pluginPackage = path.join(plugin.path, 'package.json');
    if (fs.existsSync(pluginPackage)) {
      pkg = require(pluginPackage);
      config = pkg.eggPlugin;
      if (pkg.version) {
        plugin.version = pkg.version;
      }
    }

    // const logger = this.options.logger;
    if (!config) {
      // logger.warn(`[egg:loader] pkg.eggPlugin is missing in ${pluginPackage}`);
      return;
    }

    if (config.name && config.name !== plugin.name) {
      // pluginName is configured in config/plugin.js
      // pluginConfigName is pkg.eggPlugin.name
      console.warn(
        `[egg:loader] pluginName(${plugin.name}) is different from pluginConfigName(${config.name})`
      );
    }

    // dep compatible
    depCompatible(config);

    for (const key of ['dependencies', 'optionalDependencies', 'env']) { // eslint-disable-line
      if (!plugin[key].length && Array.isArray(config[key])) {
        plugin[key] = config[key];
      }
    }
  },

  // Get the real plugin path
  getPluginPath(plugin) {
    if (plugin.path) {
      return plugin.path;
    }

    const name = plugin.package || plugin.name;
    const lookupDirs = [];

    // 尝试在以下目录找到匹配的插件
    //  -> {APP_PATH}/node_modules
    //    -> {EGG_PATH}/node_modules
    //      -> $CWD/node_modules
    lookupDirs.push(path.join(this.options.baseDir, 'node_modules'));

    // should find the $cwd/node_modules when test the plugins under npm3
    lookupDirs.push(path.join(process.cwd(), 'node_modules'));

    for (let dir of lookupDirs) {
      dir = path.join(dir, name);
      if (fs.existsSync(dir)) {
        return fs.realpathSync(dir);
      }
    }

    throw new Error(`Can not find plugin ${name} in "${lookupDirs.join(', ')}"`);
  },

  /*
   * Read plugin.js from multiple directory
   */
  readPluginConfigs(configPaths) {
    console.info('configPaths', configPaths);
    if (!Array.isArray(configPaths)) {
      configPaths = [configPaths];
    }

    // Get all plugin configurations
    // plugin.default.js
    // plugin.${scope}.js
    // plugin.${env}.js
    // plugin.${scope}_${env}.js
    const newConfigPaths = [];
    for (const filename of this.getTypeFiles('plugin')) {
      for (let configPath of configPaths) {
        configPath = path.join(path.dirname(configPath), filename);
        newConfigPaths.push(configPath);
      }
    }

    const plugins = {};
    for (const configPath of newConfigPaths) {
      let filepath = this.resolveModule(configPath);

      // 没有 plugin.default.js 文件时，适配成 plugin.js 文件
      if (configPath.endsWith('plugin.default') && !filepath) {
        filepath = this.resolveModule(configPath.replace(/plugin\.default$/, 'plugin'));
      }

      if (!filepath) {
        continue;
      }

      const config = utils.loadFile(filepath);

      for (const name in config) { // eslint-disable-line
        this.normalizePluginConfig(config, name, filepath);
      }

      this._extendPlugins(plugins, config);
    }

    return plugins;
  },

  /**
   * 标准化 plugin 定义
   * @param {Object} plugins 所有的插件
   * @param {String} name 插件名称
   * @param {String} configPath 插件路径
   */
  normalizePluginConfig(plugins, name, configPath) {
    const plugin = plugins[name];

    if (typeof plugin === 'boolean') {
      plugins[name] = {
        name,
        enable: plugin,
        dependencies: [],
        optionalDependencies: [],
        env: [],
        from: configPath,
      };
      return;
    }

    if (!('enable' in plugin)) {
      plugin.enable = true;
    }
    plugin.name = name;
    plugin.dependencies = plugin.dependencies || [];
    plugin.optionalDependencies = plugin.optionalDependencies || [];
    plugin.env = plugin.env || [];
    plugin.from = configPath;
    depCompatible(plugin);
  },

  _extendPlugins(target, plugins) {
    if (!plugins) {
      return;
    }

    for (const name in plugins) { // eslint-disable-line
      const plugin = plugins[name];
      let targetPlugin = target[name];

      if (!targetPlugin) {
        targetPlugin = target[name] = {};
      }

      if (targetPlugin.package && targetPlugin.package === plugin.package) {
        console.warn(
          'plugin %s has been defined that is %j, but you define again in %s',
          name, targetPlugin, plugin.from);
      }

      if (plugin.path || plugin.package) {
        delete targetPlugin.path;
        delete targetPlugin.package;
      }

      for (const prop in plugin) { // eslint-disable-line
        if (plugin[prop] === undefined) {
          continue;
        }
        if (targetPlugin[prop] && Array.isArray(plugin[prop]) && !plugin[prop].length) {
          continue;
        }
        targetPlugin[prop] = plugin[prop];
      }
    }
  },
};

/**
 * 适配插件依赖的属性定义
 * 把 dep 属性改成 dependecies 属性
 * @param {Object} plugin 插件对象
 */
function depCompatible(plugin) {
  if (plugin.dep && !(Array.isArray(plugin.dependencies) && plugin.dependencies.length)) {
    plugin.dependencies = plugin.dep;
    delete plugin.dep;
  }
}
