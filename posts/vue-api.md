---
title:  'Vue源码之核心API的具体实现'
date:   '2018-04-13'
---

在使用Vue时，很多时候会使用它原型上的全局方法，但不清楚它们背后运行的原理，总是会出现一些莫名的bug让我没有头绪，为此我想来从源码里看看它们的一一实现。

Vue自带的方法肯定都是在初始化时完成定义的，所以接下来我就先从Vue的构造函数看起，

#### 全局方法
1. [$data和$props](#1)
2. [$set](#2)
3. [$delete](#3)
4. [$watch](#4)
5. [$on](#5)
6. [$once](#6)
7. [$off](#7)
8. [$emit](#8)
9. [$nextTick](#9)


#### 初始化Vue实例
`src/core/instanse/index.js`
<pre class="language-javascript"><code>
...
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue) 
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
    </code></pre>
可以看到，在Vue进行初始化时，会把原型上`options`属性和实例化Vue对象时传入的参数进行合并，得到一个新的`options`，接下来一个个的来看看它们做了什么事

##### 1.initMixin(Vue)
在这个步骤了，Vue主要是给自身添加了一些用于性能追踪的tag，调用merge合并options的方法，然后调用一系列的初始化方法

`src/core/instanse/init.js`
<pre class="language-javascript"><code>
...
initLifecycle(vm)
initEvents(vm)
initRender(vm)
callHook(vm, 'beforeCreate')
initInjections(vm) // resolve injections before data/props
initState(vm)
initProvide(vm) // resolve provide after data/props
callHook(vm, 'created')
...
    </code></pre>
从以上代码可以看出，`data`的初始化是在调用钩子函数`beforeCreate`和`created`之间的，接下来看`initState`方法

`src/core/instanse/state.js`
<pre class="language-javascript"><code>
...
if (opts.props) initProps(vm, opts.props)
if (opts.methods) initMethods(vm, opts.methods)
if (opts.data) {
    initData(vm)
} else {
    observe(vm._data = {}, true /* asRootData */)
}
if (opts.computed) initComputed(vm, opts.computed)
if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
}
...
    </code></pre>
在这个方法里，我们可以得知，先初始化了`Props`、`Methods`，才多数据进行双向数据绑定，这也就是为什么在`data`里能够通过`this`来获取到`Props`、`Methods`的原因，他们先于`data`被初始化。

至于双向数据绑定，这个概念就不细谈了，我在另一篇博文里提及过，也具体实践过，不过源码里值得学习的地方在于它代码的组织形式、边界值的判定和对性能的要求。

##### 2.stateMixin(Vue)
`src/core/instanse/state.js`
<pre class="language-javascript"><code>
...
const dataDef = {}
dataDef.get = function () { return this._data }
const propsDef = {}
propsDef.get = function () { return this._props }
...
Object.defineProperty(Vue.prototype, '$data', dataDef)
Object.defineProperty(Vue.prototype, '$props', propsDef)

Vue.prototype.$set = set
Vue.prototype.$delete = del
Vue.prototype.$watch = ...
...
    </code></pre>

它主要干的事情，是在Vue的构造函数里添加静态属性`$data`、`$props`和方法`$set`、`$delete`、`$watch`

<a id="1" href="javascript:void(0)"></a>
###### 2.1 $data和$props
在`src/core/instanse/state.js`文件中，方法`initData`和`initProps`的最后，都调用了代理方法`proxy`
<pre class="language-javascript"><code>
...
proxy(vm, `_data`, key)
...
proxy(vm, `_props`, key)
...
    </code></pre>
将`_data`和`_props`挂载到了原型上，在`stateMixin`方法中，只是做了取到这两个值，放到`$data`和`$props`的操作而已

<a id="2" href="javascript:void(0)"></a>
###### 2.2 $set
在源码中找到`$set`函数的最终实现方法

`src/core/observer/index.js`
<pre class="language-javascript"><code>
export function set (target: Array | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}
    </code></pre>

从代码中可以看到，如果目标是一个数组，那么就执行`Array.splice()`方法；如果目标时一个对象，那就直接给属性复制；如果目标是Vue实例本身，就会发出提示，避免在Vue实例上或根`$data`上添加响应式属性，最后再对已设置的属性进行数据绑定，触发依赖。

<a id="3" href="javascript:void(0)"></a>
###### 2.3 $delete
`src/core/observer/index.js`
<pre class="language-javascript"><code>
export function del (target: Array | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}
    </code></pre>
类似于，`$set`方法，对数组使用`Array.splice()`，对象的话使用`delete`命令，同样不能删除实例本身和根`$data`上的属性，最后触发依赖。

<a id="4" href="javascript:void(0)"></a>
###### 2.4 $watch
`src/core/observer/index.js`
<pre class="language-javascript"><code>
Vue.prototype.$watch = function (
  expOrFn: string | Function,
  cb: any,
  options?: Object
): Function {
  const vm: Component = this
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options)
  }
  options = options || {}
  options.user = true
  const watcher = new Watcher(vm, expOrFn, cb, options)
  if (options.immediate) {
    try {
      cb.call(vm, watcher.value)
    } catch (error) {
      handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
    }
  }
  return function unwatchFn () {
    watcher.teardown()
  }
}
    </code></pre>

如果参数`cb`是一个纯对象，那么就执行`createWatcher`，该方法其实是一个递归，最后还是会回到`$watch`方法里来

核心是`new Watcher()`实例化，该对象的构造函数主要做了一件事，借助于双向数据绑定的功能，主动执行渲染函数，通过触发被监听对象的`get`拦截器函数，完成依赖收集。

然后判断是否需要立即执行回调函数。

##### 3.eventsMixin(Vue)
`src/core/instance/events.js`
<pre class="language-javascript"><code>
...
Vue.prototype.$on = ...
Vue.prototype.$once = ...
Vue.prototype.$off = ...
Vue.prototype.$emit = ...
...
    </code></pre>

该方法使用观察者模式，挂载了和自定义事件相关的4个方法，接下来我们一一来看他们的具体实现

<a id="5" href="javascript:void(0)"></a>
###### 3.1 $on
<pre class="language-javascript"><code>
Vue.prototype.$on = function (event: string | Array, fn: Function): Component {
  const vm: Component = this
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      vm.$on(event[i], fn)
    }
  } else {
    (vm._events[event] || (vm._events[event] = [])).push(fn)
    // optimize hook:event cost by using a boolean flag marked at registration
    // instead of a hash lookup
    if (hookRE.test(event)) {
      vm._hasHookEvent = true
    }
  }
  return vm
}
    </code></pre>
使用一个递归，保证每个事件都能添加到事件容器数组`vm._events`中去，最后做一个是否包含钩子函数事件的标识判断

<a id="6" href="javascript:void(0)"></a>
###### 3.2 $once
<pre class="language-javascript"><code>
Vue.prototype.$once = function (event: string, fn: Function): Component {
  const vm: Component = this
  function on () {
    vm.$off(event, on)
    fn.apply(vm, arguments)
  }
  on.fn = fn
  vm.$on(event, on)
  return vm
}
    </code></pre>

添加一个`on`方法作为`$on`方法的回调函数，在执行后调用`$off`方法删除该方法，从而保证该方法只能运行一次

<a id="7" href="javascript:void(0)"></a>
###### 3.3 $off
<pre class="language-javascript"><code>
Vue.prototype.$off = function (event?: string | Array, fn?: Function): Component {
  const vm: Component = this
  // all
  if (!arguments.length) {
    vm._events = Object.create(null)
    return vm
  }
  // array of events
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      vm.$off(event[i], fn)
    }
    return vm
  }
  // specific event
  const cbs = vm._events[event]
  if (!cbs) {
    return vm
  }
  if (!fn) {
    vm._events[event] = null
    return vm
  }
  // specific handler
  let cb
  let i = cbs.length
  while (i--) {
    cb = cbs[i]
    if (cb === fn || cb.fn === fn) {
      cbs.splice(i, 1)
      break
    }
  }
  return vm
}
    </code></pre>

通过递归的形式，遍历特定事件类型的存储容器`vm._events`，使用数组的`splice`方法将事件一一移除。

<a id="8" href="javascript:void(0)"></a>
###### 3.4 $emit
<pre class="language-javascript"><code>
Vue.prototype.$emit = function (event: string): Component {
  const vm: Component = this
  if (process.env.NODE_ENV !== 'production') {
    const lowerCaseEvent = event.toLowerCase()
    if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
      tip(
        `Event "${lowerCaseEvent}" is emitted in component ` +
        `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
        `Note that HTML attributes are case-insensitive and you cannot use ` +
        `v-on to listen to camelCase events when using in-DOM templates. ` +
        `You should probably use "${hyphenate(event)}" instead of "${event}".`
      )
    }
  }
  let cbs = vm._events[event]
  if (cbs) {
    cbs = cbs.length > 1 ? toArray(cbs) : cbs
    const args = toArray(arguments, 1)
    const info = `event handler for "${event}"`
    for (let i = 0, l = cbs.length; i < l; i++) {
      invokeWithErrorHandling(cbs[i], vm, args, vm, info)
    }
  }
  return vm
}
    </code></pre>

遍历存储容器`vm._events`，执行每一个事件的回调函数

##### 4 lifecycleMixin(Vue)
该方法主要就是定义生命周期中所调用钩子函数在回调之前之后，对Vue做一些诸如标记的工作，按下不表。

<a id="9" href="javascript:void(0)"></a>
##### 5 renderMixin(Vue)
此方法了主要定义了`$nextTick`方法

找到该方法的实现源码（代码太多就不贴了），总结得出4中实现`$nextTick`的方法，从上至下按它们的优先级排列：

* `promise` 
* `mutationObserver`：有着广泛的支持，但是在IOS版本>=9.3.3的情况下，UIWebView在触发几次后就会完全停止工作，适用于ios7.X版本
* `setImmediate`：仅IE支持，相对于setTimeout的优势在将回调函数注册为macrotask之前不会一直做超时检测
* `setTimeout`
