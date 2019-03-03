const path = require('path');
const is = require('is-type-of');
const utils = require('./../../utils/basic');

module.exports = {
  /**
   * Load app/controller
   * @param {Object} options - LoaderOptions
   */
  loadController(options) {
    options = Object.assign({
      directory: path.join(this.options.baseDir, 'app/controller'),
      // return class if it exports a function
      // ```js
      // module.exports = app => {
      //    return class HomeController extends app.Controller {};
      // }
      // ```
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

        // TODO: need support object , generator function and async function

        return exports;
      },
    }, options);

    const controllerBase = options.directory;
    this.loadToApp(controllerBase, 'controller', options);
  },
};

// wrap the class, yield a object with middleware
function wrapClass(Controller) {
  let proto = Controller.prototype;
  const ret = {};

  while (proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (const index in keys) {
      const key = keys[index];
      if (key === 'constructor') {
        continue;
      }

      const d = Object.getOwnPropertyDescriptor(proto, key);
      if (is.function(d.value) && !({}).hasOwnProperty.call(ret, key)) {
        ret[key] = methodToMiddleware(Controller, key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }

  function methodToMiddleware(Controller, key) {
    return function classControllerMiddleware(...args) {
      const controller = new Controller(this);
      console.info('args', args);
      if (!args.length) {
        args = [this];
      }

      return utils.callFn(controller[key], args, controller);
    };
  }

  return ret;
}
