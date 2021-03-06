---
title:  'Vue使用小结'
date:   '2017-08-10'
---

#### 一、数据处理
##### 1.引用类型的坑

开发时，通信数据的格式一般由前端来拟定。

得益于vue框架的数据驱动视图思想，通常我拟定的格式同在实际使用中绑定在视图上的数据格式是同一个数据源。这样的所见即所得咋一看没问题，但存一些特殊情况。

假设对一个表格的数据进行编辑，为了减少请求，通过赋值直接使用表格上的数据来进行回显，就会出现我只是修改了数据，但没有点保存，关闭编辑框后页面上的数据却显示已经被修改了，刷新页面后又恢复过来。

这是因为我只是把数据源的值复制了一份，而对象是引用类型，应该对该数据进行深度复制才对。

还有对于数组长度的更改、通过索引修改数组的值，对象属性的添加或删除，界面都不会得到及时更新，需要用相应的方法做特殊处理。

以前模拟过一次数据绑定的实现，简单的实现就是遍历对象或数组，分别给每个属性的访问器属性( getter/setter )添加特殊处理，但这种绑定是一次性的，且对于新增或者删除的方法是不生效的，我们还需要监听常用的对象或数组方法，在触发事件时，重新执行绑定。
[代码在这里](https://github.com/bulgerxie/bulgerxie.github.io/blob/master/assets/example/dataBind.js)

##### 2.数据转换和监听
为了把原始数据转换成我们实际需要的数据，可以使用很多方法，但是各有利弊。

* filters(过滤器)用于文本转换
* computed(计算属性)用来设置一个需要依赖其他值计算所得出的值
* watch用于监听数据变化，执行异步操作或者开销更大的操作

##### 3.被忽略的v-html指令
有时我们会需要把数据库里存储的富文本信息(HTML片段)异步获取到来显示，但是使用双大括号 \{\{}}来绑定数据渲染后的结果是纯文本，需要使用`v-hmtl`指令来输出真正的HTML。

##### 4.key属性
vue默认会重复使用一些可复用的元素，给元素加上key属性意味着当前元素不可复用。

实例:使用element时，遍历数组来输出一个`select`控件的`option`时，如果不加key属性的话，在虚拟的dom结构里，找不到key属性，就共用一个option来渲染，导致其它的属性值出错。

#### 二、组件化
##### 1.结构

尽管element已经提供了很多元组件，但在实际的业务中，还是会有较多高频使用的结构，比如表格 + 过滤条件 + 分页
![multiple-table](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202017-10-16%20%E4%B8%8B%E5%8D%887.06.03.png)

像这种高度定制化的组件，特定场景下还是很有必要的，但是它的拓展性不是那么好，因为结构已经写死了，我们只能通过传参来控制相关的显示逻辑，但如果你想加一个`是否VIP`的过滤条件，那不是得重写了?

这时候就该让`slot`登场了，slot是插槽的意思，这样在使用的时候如果想加结构，使用slot传入即可。

##### 2.通信
* 父组件 ——> 子组件: 通过`props`属性传值
* 子组件 ——> 父组件: 虽然这样的方式有违数据单向流动的最佳实践，因为父组件的数据可能同时被几个子组件使用。我们可以通过让子组件触发自定义事件的形式来向上传参  
还可以通过router参数来给组件传值，增强组件的可复用性

#### 三、权限控制
在一般CMS里，假设只有管理员才能执行删除操作，普通用户点击操作后被告知"权限不足，无法删除"，是不是很蛋疼?这样没法给到用户很好的用户体验。

前端的权限控制，在这里可以分为三类:   
* 路由权限控制
* 菜单权限控制
* 功能权限控制

现在我们要求用户登录后返回的权限数据如下:
<pre class="language-javascript"><code>
{
  authData: {
    userName: "root",
    // 菜单权限
    menus: [
      {
        auth: "base",
        index: "/base",
        menu: "主菜单",
        data: [
          {
            auth: "menu1",
            index: "/menu1",
            menu: "菜单1"
          },           
          {
            auth: "menu2",
            index: "/menu2",
            menu: "菜单1"
          },
          ...
        ]
      }
    ],
    // 功能权限
    permissionList: [
      "edit",
      "search",
      "delete",
      ...
    ],
    // 路由权限
    routeList: [
      "/menu1",
      "/menu2",
      ...
    ]
  }
}
    </code></pre>


##### 1. 路由权限控制
使用vue router提供的钩子`router.beforeEach`在每次做跳转请求时同`authData.routeList`数据做匹配，判断用户是否有权限访问。

<pre class="language-javascript"><code>
import {getAuth} from 'XXX';
    
const checkPermission = function(path) {
  let routeList = getAuth('routeList');
  if (routeList.indexOf(path) > -1) {
    return true;
  }
  return false;
};

const requireAuth = function(to, from, next) {
  let path = to.path;
  const allowList = ['/', '/404', '/403', '/login'];
  if (allowList.indexOf(path) > -1) {
    next();
    return;
  }

  if (checkPermission(path)) {
    next();
    return;
  } else {
    next('/403');
  }
};

export default {
  requireAuth,
  checkPermission
};
    </code></pre>

##### 2.菜单权限控制
直接使用`authData.menus`的数据来渲染菜单组件即可

##### 3.功能权限控制
添加一个directive，根据用户权限判断各个按钮的显示与否。
<pre class="language-javascript"><code>
import {getAuth} from 'XXX';
    
const has = function(permission) {
  let permissionList = getAuth('permissionList');
  if (permissionList.indexOf(permission) > -1) {
    return true;
  }
  return false;
};

const bind = function(el, binding, vnode) {
  if (!has(binding.expression)) {
    el.parentNode.removeChild(el);
  }
};

export default {
  bind
};
    </code></pre>

使用:
<pre class="language-javascript"><code>
import auth from 'XXX';
export default {
    ...
    directives: {
      auth
    }
}
<el-button type="danger" @click="handleDelete" v-auth="delete">删除</el-button>
    </code></pre>
