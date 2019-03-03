const path = require('path');

module.exports = {
  loadRouter() {
    const filePath = path.join(this.options.baseDir + '/app/router.js');

    this.loadFile(filePath);
  }
};
