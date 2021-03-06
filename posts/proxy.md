---
title:  '这一次，搞定开发阶段的跨域调试'
date:   '2018-01-09'
---

受限于同源策略的制约，开发阶段的跨域调试，一直是前端不可避免的问题，以前使用`JSONP`或者`CORS`的方式，都需要后端配合才能搞上一搞，可是大家都很忙的，还是自己动脑吧！

接下来介绍三种方式，由简单到复杂：

#### 一、禁用同源策略
既然受限于它，那么关掉它不就好了，简单粗暴。

启动浏览器的时候添加一个参数`--disable-web-security `就好，简单到哭。

本例只针对chrome浏览器
##### 1.Windows

桌面浏览器图标右键查看属性，选中`快捷方式`标签，在`目标`一栏添加启动参数即可：
![windows](/images/20180109/windows.png)

##### 2.mac

关掉所有`chrome`窗口，然后执行命令：
<pre class="language-bash"><code>
> open -n /Applications/Google\ Chrome.app/ --args --disable-web-security --user-data-dir=/Users/用户名/MyChromeDevUserData
    </code></pre>

要是觉得一大串难记的话就再弄个`alias`简直不要太爽

#### 二、服务器转发请求
同源策略是针对于浏览器的，使用服务器发送请求并不会受到它的制约。
在使用`vue-cli`做开发，初始化项目选定`template`为`webpack`时，添加一个简单的配置即可实现：
<pre class="language-javascript">
<code>
// config/index.js
module.exports = {
  // ...
  dev: {
    proxyTable: {
      // 代理所有的 /api 请求到 jsonplaceholder
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
    </code></pre>

例如请求`/api/getData`，实际请求`http://jsonplaceholder.typicode.com/getData`

这个方式的实现原理是使用了`NodeJS`的[http-proxy-middleware ](https://github.com/chimurai/http-proxy-middleware)模块。
当检测到对应的请求后，该模块会虚拟一个服务端接收你的请求，然后帮你代发给目标服务器，这样就避免了同源策略。

#### 三、正向代理
配置正向代理将目标服务器的资源映射为本地资源。

这里我使用了工具[whistle](https://github.com/avwo/whistle)，它的优势在于跨平台和功能强大。

##### 1.使用whistle
<pre class="language-bash">
<code>
安装
> npm install -g whistle

启动
> w2 start

退出
> w2 stop
    </code></pre>

##### 2.配置代理
安装浏览器代理插件[whistle-for-chrome](https://chrome.google.com/webstore/category/extensions)

打开插件，点击`create`新建一个`test`分组，然后配置`hosts`如下：
![windows](/images/20180109/whistle.png)
假设现在有一个`example.com`页面，`example.com`页面里会请求`example.com/getData`拿数据。

现在我们访问`example.com`，请求会被转发到本地的`8080`端口

我们设置`8080`端口里的页面向`example.com/getData`发起请求，`example.com`检查请求头的`host`字段，发现是`example.com`，没有跨域，就会将结果返回给浏览器，实现跨域调试。
