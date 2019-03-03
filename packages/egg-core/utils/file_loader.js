const path = require('path');
const is = require('is-type-of');
const globby = require('globby');
const fs = require('fs');

const FULLPATH = Symbol('EGG_LOADER_ITEM_FULLPATH');
const EXPORTS = Symbol('EGG_LOADER_ITEM_EXPORTS');

const defaultOptions = {
  directory: null,
  target: null,
  match: undefined,
  ignore: undefined,
  initializer: null,
  inject: undefined,
  filter: null,
};

/**
 * Load app files from directory to target object.
 */
class FileLoader {
  /**
   *
   * @param {String|Array} options.directory - directories to be loaded
   * @param {Object} options.target - attach the target object from loaded files
   * @param {String} options.match - match the files when load, support glob
   * @param {String} options.ignore - ignore the files when, support glob
   * @param {Function} options.initializer - custom file exports
   * @param {Object} options.inject - an object that be the argument when invoke the function
   * @param {Function} options.filter - a function that filter the exports which can be loaded
   */
  constructor(options) {
    if (!options.directory) {
      throw new Error('options.directory is required');
    }

    if (!options.target) {
      throw new Error('options.target is required');
    }

    this.options = Object.assign({}, defaultOptions, options);
  }

  /**
   * Attach items to target object, mapping the directory to properties.
   * `app/controller/group/repository.js` => `target.group.repo`
   * @return {Object} target
   */
  load() {
    const items = this.parse();
    const target = this.options.target;

    items.forEach(item => {
      // item  { properties: ['a', 'b', 'c'], exports }
      // => target.a.b.c = exports
      item.properties.reduce((_target, property, index) => {
        let obj;

        if (index === item.properties.length - 1) {
          obj = item.exports;
        }
        else {
          obj = _target[property] || {};
        }
        _target[property] = obj;

        return obj;
      }, target);
    });

    return target;
  }

  /**
   * Parse files from given directories, then return items list,
   * each item contianer properties and exports
   * For example, parse `app/controller/group/repository.js`
   * ```
   * class RepositoryController extends app.Controller {
   *  async list() {}
   *  async getRepo() {}
   * }
   * ```
   * It return a item
   * ```
   * {
   *    properties: ['group', 'repository']
   *    exports: {
   *      list() {}   - a promise function
   *      getRepo() {}  - a promise function
   *    }
   * }
   * ```
   * `properties` is an array that contains the directory of a filepath
   * `exports` depends on type, if exports is a function, it will be called.
   * if initializer is scpeified, it will be called with exports for customizing.
   * @return {Array} items
   */
  parse() {
    let files = this.options.match;
    if (!files) {
      files = ['**/*.js'];
    }
    else {
      files = Array.isArray(files) ? files : [files];
    }

    let ignore = this.options.ignore;
    if (ignore) {
      ignore = Array.isArray(ignore) ? ignore : [ignore];
      ignore = ignore.filter(f => !!f).map(f => '|' + f);
      files = files.concat(ignore);
    }

    let directories = this.options.directory;
    if (!Array.isArray(directories)) {
      directories = [directories];
    }

    const filter = is.function(this.options.filter) ? this.options.filter : null;
    const items = [];

    for (const directory of directories) {
      const filepaths = globby.sync(files, { cwd: directory });

      for (const filepath of filepaths) {
        const fullpath = path.join(directory, filepath);
        if (!fs.statSync(fullpath).isFile()) continue;
        // foo/bar.js => ['foo', 'bar']
        const properties = getProperties(filepath, this.options);
        // app/controller/foo/bar.js => controller.foo.bar
        const pathName = directory.split('/').slice(-1) + '.' + properties.join('.');
        // get exports from the file
        const exports = getExports(fullpath, this.options, pathName);

        // ignore exports when it's null or false returned by filter function
        if (exports === null || (filter && filter(exports) === false)) continue;

        if (is.class(exports)) {
          exports.prototype.pathName = pathName;
          exports.prototype.fullpath = fullpath;
        }

        items.push({ fullpath, properties, exports });
      }
    }

    return items;
  }
}

/**
 * convert file path to an array of properties
 * foo/bar.js => ['foo', 'bar']
 * @param {String} filepath
 */
function getProperties(filepath) {
  const properties = filepath.substring(0, filepath.lastIndexOf('.')).split('/');

  return properties.map(property => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(property)) {
      throw new Error(`${property} is not match 'a-z0-9_-' in ${filepath}`);
    }

    // use default camelize, remove `_` or `-` and capitalize the next letter
    // foo_bar.js > fooBar
    property = property.replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase());
    return property;
  });
}

// get exports from filePath
function getExports(fullpath, { initializer, inject }, pathName) {
  let exports = require(fullpath);

  if (initializer) {
    exports = initializer(exports, { path: fullpath, pathName });
  }

  if (is.function(exports) && !is.class(exports)) {
    return exports(inject);
  }

  return exports;
}

module.exports = FileLoader;
module.exports.FULLPATH = FULLPATH;
module.exports.EXPORTS = EXPORTS;
