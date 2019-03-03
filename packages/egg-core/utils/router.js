const KoaRouter = require('koa-router');

class EggRouter extends KoaRouter {
  constructor(options, app) {
    super(options);

    this.app = app;
  }
}

module.exports = EggRouter;
