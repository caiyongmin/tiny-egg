/**
 * BaseContextClass is a base class that can be extend,
 * it's instantiated in context level
 */
class BaseContextClass {
  constructor(ctx) {
    this.ctx = ctx;

    this.app = ctx.app;

    this.config = ctx.config;

    this.service = ctx.service;
  }
}

module.exports = BaseContextClass;
