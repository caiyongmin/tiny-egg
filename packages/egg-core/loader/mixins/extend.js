const path = require('path');
const utils = require('./../../utils/basic');

const originalPrototypes = {
  request: require('koa/lib/request'),
  response: require('koa/lib/response'),
  context: require('koa/lib/context'),
  application: require('koa/lib/application'),
};

module.exports = {
  loadRequestExtend() {
    this.loadToExtend('request', this.app.request);
  },

  loadResponseExtend() {
    this.loadToExtend('response', this.app.response);
  },

  loadContextExtend() {
    this.loadToExtend('context', this.app.context);
  },

  loadApplicationExtend() {
    this.loadToExtend('application', this.app);
  },

  loadHelperExtend() {
    if (this.app && this.app.Helper) {
      this.loadToExtend('helper', this.app.Helper.prototype);
    }
  },

  /**
   * 获取扩展文件的路径
   * @param {String} name 扩展名
   */
  getExtendFilePaths(name) {
    return this.getLoadUnits().map(unit => path.join(unit.path, 'app/extend', name));
  },

  /**
   * 加载 app/extend/xx.js 到 proto 对象上
   * @param {String} name - 文件名，之后的格式会是这样子：`app/extend/{name}.js`
   * @param {Object} proto - 挂载的 proto 对象
   */
  loadToExtend(name, proto) {
    // 拿到需要取遍历的文件路径
    const filepaths = this.getExtendFilePaths(name);

    for (let i = 0, l = filepaths.length; i < l; i++) {
      const filepath = filepaths[i];
      if (this.serverEnv) {
        // 还要带上对应环境变量的文件
        filepaths.push(`${filepath}.${this.serverEnv}`);
      }
    }

    // 记录定义过哪些属性
    const mergeRecord = new Map();

    for (let filepath of filepaths) {
      filepath = this.resolveModule(filepath);

      if (!filepath) {
        continue;
      }

      // 获取导出的文件内容
      const ext = utils.loadFile(filepath);

      const properties = Object.getOwnPropertyNames(ext)
        .concat(Object.getOwnPropertySymbols(ext)); // 包括 Symbol 类型的属性

      for (const property of properties) {
        if (mergeRecord.has(property)) {
          console.warn('Property: "%s" already exists in "%s"，it will be redefined by "%s"',
            property, mergeRecord.get(property), filepath);
        }

        // 拿到属性的 descriptor
        let descriptor = Object.getOwnPropertyDescriptor(ext, property);
        // 获取 proto 对应定义的 description
        let originalDescriptor = Object.getOwnPropertyDescriptor(proto, property);

        if (!originalDescriptor) {
          // 如果没有 originalDescriptor，看 Koa 里面是否定义过这个属性
          const originalProto = originalPrototypes[name];
          if (originalProto) {
            originalDescriptor = Object.getOwnPropertyDescriptor(originalProto, property);
          }
        }

        if (originalDescriptor) {
          // don't override descriptor
          descriptor = Object.assign({}, descriptor);

          // 补齐 descriptor 的 get 或者 set 方法
          if (!descriptor.get && originalDescriptor.get) {
            descriptor.get = originalDescriptor.get;
          }
          if (!descriptor.set && originalDescriptor.set) {
            descriptor.set = originalDescriptor.set;
          }
        }

        // 真正定义属性
        Object.defineProperty(proto, property, descriptor);
        mergeRecord.set(property, filepath);
      }
    }
  },
};
