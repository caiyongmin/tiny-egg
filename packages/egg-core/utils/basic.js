const fs = require('fs');
const path = require('path');
const co = require('co');
const is = require('is-type-of');
const convert = require('koa-convert');

module.exports = {
  /**
   * 执行指定的函数
   * @param {Function} fn 需要执行的函数
   * @param {Array} args 参数数组
   * @param {Object} ctx 函数执行的上下文
   */
  async callFn(fn, args, ctx) {
    args = args || [];

    if (!is.function(fn)) {
      return undefined;
    }

    if (is.generatorFunction(fn) && is.asyncFunction(fn)) {
      fn = co.wrap(fn);
    }

    return ctx ? fn.call(ctx, ...args) : fn(...args);
  },

  /**
   * 用于支持 generator 中间件函数
   * @param {Function} fn 需要转换的函数
   */
  middleware(fn) {
    return is.generatorFunction(fn) ? convert(fn) : fn;
  },

  /**
   * 根据文件路径获取对应的文件内容
   * @param {String} filepath 文件路径
   */
  loadFile(filepath) {
    try {
      // 非 js 模块，直接返回读取到的内容
      const extname = path.extname(filepath);
      if (extname && !require.extensions[extname]) {
        return fs.readFileSync(filepath);
      }

      // 获取 js 模块
      const obj = require(filepath);
      if (!obj) {
        return obj;
      }
      // 并且是 ES 模块
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;

      return obj;
    } catch (err) {
      err.message = `[egg-core] load file: ${filepath}, error: ${err.message}`;
      throw err;
    }
  },
};
