const FileLoader = require('./file_loader');

class ContextLoader extends FileLoader {
  constructor(options) {
    if (!options.property) {
      throw new Error('options.property is required');
    }

    if (!options.inject) {
      throw new Error('options.inject is required');
    }

    const target = options.target = {};
    if (options.fieldClass) {
      options.inject[options.fieldClass] = target;
    }
    super(options);

    // const app = this.options.inject;
    // const property = options.property;
  }

  load() {}
}

module.exports = ContextLoader;
