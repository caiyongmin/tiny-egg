const HELPER = Symbol('Context#helper');

/**
 * BaseContextClass is a base class that can be extend,
 * it's instantiated in context level
 */
class BaseContextClass {
  constructor(ctx) {
    this.ctx = ctx;

    // 保持与 egg.js 同样的用法
    this.ctx.helper = this.helper;

    this.app = ctx.app;

    this.config = ctx.config;

    this.service = ctx.service;
  }

  /**
   * 获取 EggApplication 的 helper 实例
   */
  get helper() {
    if (!this[HELPER]) {
      this[HELPER] = new this.ctx.app.Helper(this.ctx);
    }
    return this[HELPER];
  }
}

module.exports = BaseContextClass;
