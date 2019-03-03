/**
 * BaseContextClass is a base class that can be extend,
 * it's instantiated in context level,
 * {@link Helper}, {@link Service} is extend it.
 */
class BaseContextClass {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;
    // this.config = ctx.app.config;
    // this.service = ctx.service;
  }
}

module.exports = BaseContextClass;
