const is = require('is-type-of');
const FileLoader = require('./file_loader');

const CLASSLOADER = Symbol('classLoader');
const EXPORTS = FileLoader.EXPORTS;

/**
 * 从 app 指定目录下加载文件，拿到 target 对象，定义 app.context.property 对象，也就是 this.context.property 对象
 * 例如：`app/service/repo.js` 下的文件内容
 *
 * ```
 * class RepositoryService extends app.Service {
 *    async list() {}
 * }
 * ```
 *
 * 会得到 `this.context.service.repo.list` 值是对应的 async 函数
 * BaseContextClass 类中，把 this.ctx.service 赋值给了 this.service
 * 所以之后可以通过 this.service 访问到 app/service 目录文件里面定义的一些方法
 */
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

    const app = this.options.inject; // inject 对象属性为 this.app，也就是 eggCore 中的 this
    const property = options.property;

    /**
     * 采用懒加载的形式，定义 this.context 对象上的属性，例如 service 属性
     */
    Object.defineProperty(app.context, property, {
      get() {
        if (!this[CLASSLOADER]) {
          this[CLASSLOADER] = new Map();
        }
        const classLoader = this[CLASSLOADER];

        let instance = classLoader.get(property);
        if (!instance) {
          instance = getInstance(target, this);
          classLoader.set(property, instance);
        }
        return instance;
      },
    });
  }
}

/**
 * 继续根据 properties 获得实例
 */
class ClassLoader {

  constructor(options) {
    const properties = options.properties;
    this._cache = new Map();
    this._ctx = options.ctx;

    for (const property in properties) {
      this.defineProperty(property, properties[property]);
    }
  }

  defineProperty(property, values) {
    Object.defineProperty(this, property, {
      get() {
        let instance = this._cache.get(property);
        if (!instance) {
          // 递归定义属性
          instance = getInstance(values, this._ctx);
          this._cache.set(property, instance);
        }
        return instance;
      },
    });
  }
}

/**
 * 获取实例，会一层层递归
 * @param {Array} values FileLoader 解析出来的 items 数组
 * @param {Object} ctx this 对象
 */
function getInstance(values, ctx) {
  // 判断是否有导出，之前 FileLoader 在解析的时候会有标记
  const Class = values[EXPORTS] ? values : null;

  let instance;
  if (Class) {
    instance = is.class(Class) ? new Class(ctx) : Class;
  }
  else if (is.primitive(values)) {
    instance = values;
  }
  else {
    // 递归获得实例
    instance = new ClassLoader({ ctx, properties: values });
  }
  return instance;
}

module.exports = ContextLoader;
