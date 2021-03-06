---
title:  'Web性能优化之HTTP2'
date:   '2017-10-24'
---

Web作为网络资源的访问入口，延迟其实才是目前性能优化的瓶颈。SPDY协议的开发者之一Mike Belshe在15年时测试了互联网上最热门的一些站点，结果如下
![不同带宽下的延迟](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E4%B8%8D%E5%90%8C%E5%B8%A6%E5%AE%BD%E4%B8%8B%E7%9A%84%E5%BB%B6%E8%BF%9F.png)
可以看出，带宽达到4Mbps以后，页面的加载时间变化不大，而延迟和页面加载时间完全是成正比关系。

#### HTTP1.1的瓶颈  

HTTP1.1时代里，每次TCP连接只能下载一个资源，比如向服务器请求index.html文件，浏览器拿到index.html文件，解析index.html时遇到`<link>`、`<script>`等标签时，又会发送请求获取对应的css、js等资源，这就引发两个问题：  

1.每请求一个资源就会来一次TCP连接，且有"队首阻塞"问题出现，这样在资源过多的情况下，TCP连接消耗的时间会逐渐增加  
2.每次发送请求的HTTP头部信息基本相同，造成头部信息冗长，耗费流量  
3.从获取解析index.html文件到碰撞`<link>`、`<script>`等标签时，中间流失的时间没有充分利用  

#### HTTP2  

一句话概述它的优点: 合并请求，并行下载，缩小数据，预先加载  

SPDY作为该协议的试验场，HTTP2以它为基础一直在不断地做出变化和改进。  

##### 1.二进制分帧层
之所以要递增一个大版本到2.0，主要是因为它新增了`二进制分帧层`作为客户端与服务器之间交换数据的新方式。
![二进制分帧](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E4%BA%8C%E8%BF%9B%E5%88%B6%E5%88%86%E5%B8%A7.png)
  
##### 2.多向请求与响应
在HTTP1.x中，需要使用多个TCP连接才可以让客户端发送多个并行请求，且每个连接只能接受一个响应。HTTP2突破了这些限制，不同于之前使用换行符分隔纯文本的方式，二进制分帧机制以二进制编码格式将HTTP消息分解为互不依赖的帧，然后乱序发送，在另一端把根据每个帧首部的流标识符重新组装。
![合并请求](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E5%90%88%E5%B9%B6%E8%AF%B7%E6%B1%82.jpeg)
从图中我们可以看出在这一条连接中客户端在传送stream5，也在接收stream3和stream3，请求之间互不影响，因此解决了HTTP1.x中存在的"队首阻塞"问题，且只用一个连接就可以发送多个请求和响应，避免了多次连接的时间消耗。

##### 3.服务器推送
同时，HTTP2新加入了一个推送功能，就是出了返回最初请求的资源外，服务器还可以推送额外的资源给客户端缓存，避免二次请求。
![服务器推送](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%8E%A8%E9%80%81.png)

##### 4.首部压缩
HTTP2通过"首部表"来对跟踪和存储之前发送过的首部键值对，如果数据相同，将只发送差异部分，且首部表在链接保持时会始终存在。
![首部差异化](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E9%A6%96%E9%83%A8%E5%B7%AE%E5%BC%82%E5%8C%96.png)
可以看到，在`请求#2`里的header帧将只发送差异部分。

#### 使用HTTP2
我们尝试在一个node服务里使用HTTP2

首先新建文件夹，在该目录下创建公私密钥:
<pre class="language-bash"><code>
> openssl req -new -newkey rsa:2048 -nodes -keyout localhost.key -out localhost.csr 

> openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt
    </code></pre>

创建package.json文件:
<pre class="language-bash"><code>
> npm init -y
    </code></pre>

再安装HTTP2包:
<pre class="language-bash"><code>
> npm i --save-dev http2
    </code></pre>

新建app.js文件
<pre class="language-javascript"><code>
const https = require('http2');
const fs = require('fs');

const options = {
  key: fs.readFileSync('localhost.key'),
  cert: fs.readFileSync('localhost.crt')
};

https.createServer(options, function (request, response) {
  response.writeHead(200);
  response.end('welcome to use HTTP2');
}).listen(443);
    </code></pre>


启动服务:
<pre class="language-bash"><code>
> node app.js
    </code></pre>


我使用了chrome 插件 [HTTP/2 and SPDY indicator](https://chrome.google.com/webstore/detail/http2-and-spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin?hl=en&utm_source=nginx-1-9-5&utm_medium=blog)来查看网站是否启用了HTTP2或SPDY

现在访问 [https://localhost](https://localhost)
![HTTP2](http://navcd-1252873427.cosgz.myqcloud.com/head_img/HTTP2.png)
可以看到，经过检测，我们的服务已经成功开启了HTTP2
