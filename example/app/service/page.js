const Service = require('./../../../packages/egg').Service;

class PageService extends Service {
  async home() {
    const content = await '233';

    return content;
  }
}

module.exports = PageService;
