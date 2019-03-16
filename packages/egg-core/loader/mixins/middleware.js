const path = require('path');
const pathMatching = require('egg-path-matching');
const utils = require('./../../utils/basic');

module.exports = {
  loadMiddleware(opt) {
    const app = this.app;

    opt = Object.assign({
      call: false,
      override: true,
      // 暂时先只解析当前的 app/middleware 目录下的方法
      directory: this.getLoadUnits().map(unit => path.join(unit.path, 'app/middleware')),
    }, opt);

    // 这里先把结果赋值到 app.middlewares 上，而不是 middleware
    this.loadToApp(opt.directory, 'middlewares', opt);

    // ------------ 加载完成后的处理 --------------

    // 根据 app.middlewares，定义 app.middleware
    for (const name in app.middlewares) { // eslint-disable-line
      Object.defineProperty(app.middleware, name, {
        get() {
          return app.middlewares[name];
        },
        enumerable: false,
        configurable: false,
      });
    }

    const middlewareNames = this.config.middleware; // 拿到配置中启用的 middleware
    const middlewaresMap = new Map();

    for (const name of middlewareNames) {
      if (!app.middlewares[name]) {
        throw new TypeError(`Middleware ${name} not found`);
      }

      if (middlewaresMap.has(name)) {
        throw new TypeError(`Middleware ${name} redefined`);
      }

      middlewaresMap.set(name, true);

      // 拿到 middleware 的配置项
      const options = this.config[name] || {};
      let mw = app.middlewares[name];
      mw = mw(options, app);

      mw._name = name;
      /**
       * 对中间件进行处理，根据它的 options
       * options 中的 enable、ignore、match 属性值可以决定是否使用这个中间件
       * 所以下面需要判断一下 mw 是否还存在，存在则调用
       */
      mw = wrapMiddleware(mw, options);

      // 最后 mw 还存在，则 app 使用这个中间件
      if (mw) {
        app.use(mw);
      }
    }
  },
};

/**
 * 根据配置项对中间件进行处理，返回最后要使用的中间件
 * @param {Function} mw 中间件
 * @param {Object} options 配置项
 */
function wrapMiddleware(mw, options) {
  // 支持 options.enable
  if (options.enable === false) {
    return null;
  }

  // 支持 generator 函数
  mw = utils.middleware(mw);

  // 如果没有设置 options.match 和 options.ignore
  if (!options.match && !options.ignore) {
    return mw;
  }

  // 支持 options.match 和 options.ignore
  const match = pathMatching(options);
  const fn = (ctx, next) => {
    if (!match(ctx)) return next();
    return mw(ctx, next);
  };
  fn._name = mw._name + 'middlewareWrapper';
  return fn;
}
