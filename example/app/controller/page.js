const Controller = require('./../../../packages/egg').Controller;

class PageController extends Controller {
  async home(ctx) {
    // this.ctx.body = 'hello world';
    ctx.body = 'hello world';
  }

  async index(ctx) {
    ctx.body = 'hello index';
  }
}

module.exports = PageController;
