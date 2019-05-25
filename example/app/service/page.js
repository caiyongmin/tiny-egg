const Service = require('./../../../packages/egg').Service;

class PageService extends Service {
  async home() {
    const data = await '\'233\' from page.home service';

    return data;
  }
}

module.exports = PageService;
