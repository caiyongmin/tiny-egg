const Controller = require('./../../../packages/egg').Controller;

class PageController extends Controller {
  async index() {
    this.ctx.body = 'hello egg.js';
  }

  async home() {
    // get data from page.home service
    const data = await this.service.page.home();
    this.ctx.body = data;
  }
}

module.exports = PageController;
