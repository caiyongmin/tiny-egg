const Controller = require('./../../../packages/egg').Controller;

class PageController extends Controller {
  async home() {
    this.ctx.body = 'hello world';
  }

  async index() {
    const content = await this.service.page.home();
    this.ctx.body = content;
  }
}

module.exports = PageController;
