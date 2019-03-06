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
 * 从 app 指定目录下加载文件，赋值到 target 对象上
 * 例如：`app/controller/group/repo.js` => `target.group.repo`
 */
class FileLoader {
  /**
   * @param {String|Array} options.directory - 要加载的目录
   * @param {Object} options.target - target 对象
   * @param {String} options.match - glob 文件匹配规则
   * @param {String} options.ignore - glob 文件匹配时的忽略规则
   * @param {Function} options.initializer - 对加载到的文件内容做自定义处理
   * @param {Object} options.inject - 注入给加载到的文件的函数执行时的参数
   * @param {Function} options.filter - 文件过滤规则
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
   * 将解析出来的 items 数组，赋值到 target 对象上，例如：
   * items: [{
   *   properties: ['group',' repository']
   *   exports: {
   *      list() {}   - a promise function
   *      getRepo() {}  - a promise function
   *   }
   *   fullpath: 'path/to/file'
   * }]
   * 会转化成 target.group.repository = exports
   * @return {Object} target
   */
  load() {
    const items = this.parse();
    const target = this.options.target;

    items.forEach(item => {
      item.properties.reduce((_target, property, index) => {
        let obj;

        if (index === item.properties.length - 1) {
          obj = item.exports;

          if (obj && !is.primitive(obj)) {
            obj[FULLPATH] = item.fullpath;
            // 记录有导出的标识
            obj[EXPORTS] = true;
          }
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
   * 解析指定的目录下的文件，返回 items 数组
   * 例如，解析 `app/controller/group/repository.js` 文件，它的内容是
   * ```
   * class RepositoryController extends app.Controller {
   *  async list() {}
   *  async getRepo() {}
   * }
   * ```
   * 会得到这样一个 item
   * ```
   * {
   *    properties: ['group', 'repository']
   *    exports: {
   *      list() {}   - a promise function
   *      getRepo() {}  - a promise function
   *    }
   *    fullpath: 'path/to/file'
   * }
   * ```
   * `properties` 是一个表示文件目录的数组
   * `exports` 是文件导出的内容，如果它是一个函数，将会立即执行，如果指定了 options.initializer，可以对导出的内容做自定义处理
   * 最后解析出的所有文件所得到的 item，组成一个 items 数组返回
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
        // app/controller => controller.foo.bar
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
 * 将文件目录转成一个数组形式来表示
 * 例如：foo/bar.js 会转化成 ['foo', 'bar']
 * @param {String} filepath
 */
function getProperties(filepath) {
  const properties = filepath
    .substring(0, filepath.lastIndexOf('.'))
    .split('/');

  return properties.map(property => {
    /**
     * 校验文件名是否符合规则
     */
    if (!/^[a-z][a-z0-9_-]*$/i.test(property)) {
      throw new Error(`${property} is not match 'a-z0-9_-' in ${filepath}`);
    }

    /**
     * 转换文件名，删除 `-` 和 `_` 字符，大写它们下一个字符
     * 例如把 foo_bar 转换成 fooBar
     */
    property = property
      .replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase());

    return property;
  });
}

/**
 * 根据文件路径得到文件导出的内容
 */
function getExports(fullpath, { initializer, inject }, pathName) {
  let exports = require(fullpath);

  // 如果指定了 options.initializer，可以对导出的内容做自定义处理
  if (initializer) {
    exports = initializer(exports, { path: fullpath, pathName });
  }

  // 如果它是一个函数，将会立即执行
  if (is.function(exports) && !is.class(exports)) {
    return exports(inject);
  }

  return exports;
}

module.exports = FileLoader;
module.exports.FULLPATH = FULLPATH;
module.exports.EXPORTS = EXPORTS;
