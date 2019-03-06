const path = require('path');
const is = require('is-type-of');
const utils = require('./../../utils/basic');

module.exports = {
  /**
   * 加载 app/controller
   * @param {Object} options - LoaderOptions
   */
  loadController(options) {
    options = Object.assign({
      directory: path.join(this.options.baseDir, 'app/controller'),
      /**
       * 如果导出的是一个函数，会执行以下返回里面的 class
       * ```js
       * module.exports = app => {
       *    return class HomeController extends app.Controller {};
       * }
       * ```
       */
      initializer: (exports, opt) => {
        if (
          is.function(exports)
          && !is.generatorFunction(exports)
          && !is.asyncFunction(exports)
          && !is.class(exports)
        ) {
          exports = exports(this.app);
        }

        if (is.class(exports)) {
          exports.prototype.pathName = opt.pathName;
          exports.prototype.fullpath = opt.fullpath;
          return wrapClass(exports);
        }

        return exports;
      },
    }, options);

    const controllerBase = options.directory;
    this.loadToApp(controllerBase, 'controller', options);
  },
};

/**
 * 包括 Controller 成一个对象
 * 对象 key 是 Controller 的属性，只解析属性值是函数的属性
 * 不过这个属性值函数被包装了一层函数，详见下面的 methodToMiddleware 函数
 * @param {Class} Controller exports 出来的 Controller 类
 * @return {Object} ret
 */
function wrapClass(Controller) {
  let proto = Controller.prototype;
  const ret = {};

  // 遍历 Controller 原型链上的原型对象
  while (proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);

    for (const index in keys) {
      const key = keys[index];
      if (key === 'constructor') {
        continue;
      }

      const d = Object.getOwnPropertyDescriptor(proto, key);
      if (is.function(d.value) && !({}).hasOwnProperty.call(ret, key)) {
        ret[key] = methodToMiddleware(key);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  /**
   * 包装控制器函数
   * controller 函数其实也是一种中间件
   */
  function methodToMiddleware(key) {
    return function classControllerMiddleware(...args) { // 现在发现的 args 的值暂时为 ctx 和 next
      const controller = new Controller(args[0] || this);

      if (!args.length) {
        args = [this];
      }

      return utils.callFn(controller[key], args, controller);
    };
  }

  return ret;
}
