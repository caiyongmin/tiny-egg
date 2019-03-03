const co = require('co');
const is = require('is-type-of');

module.exports = {
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
};
