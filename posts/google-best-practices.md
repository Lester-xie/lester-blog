---
title:  'Google的网站最佳实践'
date:   '2021-06-07'
---

#### 一般的最佳实践

##### 给页面指定文档模型，避免引发怪异模式

这算是一个针对于IE怪异模式的hack，但现在微软都已经宣布放弃IE系列了，咱也就不再考古[怪异模式](https://developer.mozilla.org/en-US/docs/Mozilla/Mozilla_quirks_mode_behavior)了，但还是需要在HTML页面的第一行加上
<pre class="language-html"><code>
&lt;!DOCTYPE html&gt;
    </code></pre>

##### 在控制台打印浏览器错误

尽管在开发环境已经避免了诸多代码上的bug，但上线后还是会存在一些环境或是数据异常所导致的错误，这时仍然需要我们在控制台记录下这些异常，便于排查问题。

##### 显示正确纵横比的图片

图像纵横比不正确的原因通常有两个

* 图像上设置了与源图像尺寸不同的显示高度和宽度
* 图像的宽度和高度设置为可变大小容器的百分比

为此我们通常可以做以下的方法来确保图像显示正确的纵横比

* 使用图片CDN
* 检查影响图像纵横比的CSS
* 检查HTML中图像的`width`和`height`属性

#### 让页面更快

##### 使用HTTP2
这里之前写过一篇博文体验[HTTP2](https://lester-xie.github.io/%E7%BD%91%E7%BB%9C%E5%9F%BA%E7%A1%80/2017/10/24/HTTP2.html)，这里就不再举例它的优点了。

##### 避免使用 document.write()
解析HTML构建DOM树时，如果遇到脚本，就必须去加载它后才能继续解析HTML，如果一个`document.write()`又动态注入了另一个脚本，那么解析器将被迫等待更长的时间，这对于网络不好的用户，将会明显加大页面首次打开的时间。

并且，使用该方法还可能容易导致XSS攻击，所以更要避免使用。

##### 使用被动监听器提升页面滚动性能
在移动端上，滚动事件通常是由用户主动去触摸屏幕来触发的，但在滚动页面之前，触摸的区块会去先执行触摸事件，完成后才会滚动页面，如果触摸事件里通过调用`preventDefault()`取消了滚动事件，那么页面将不会滚动，这通常不是我们愿意看到的结果。

我们通过设置被动监听器的方式来避免滚动被取消，用法也很简单，就是通过给触摸事件添加一个参数
<pre class="language-javascript"><code>
addEventListener(document, "touchstart", function () {
    // do something
}, { passive: true })
    </code></pre>

这样就可以保证浏览器可以立即滚动页面，而不是在监听器事件完成后

#### 让页面更安全

##### 使用HTTPS
HTTPS可以有效防止非法用户利用网站的漏洞来进行恶意破坏，最简单有效的部署HTTPS，就是把你的网站托管在CDN上，如果需要在自己的服务器上部署，可以参考[这篇文章](https://developers.google.com/web/fundamentals/security/encrypt-in-transit/enable-https)

##### 访问不安全的跨源链接
我们通常使用`target="_blank"`打开一个新的页面，但这样做可能会给网站带来一些安全隐患：
* 另一个页面可能会与你的网站在同一个进程里运行，如果这个网站要进行大量的计算，那么你的页面性能也会受到影响
* 另一个页面可以使用`window.opener`访问你的`window`对象。这可能会导致其他页面把你的页面重定向到恶意url去

为了避免发生以上两种意外，我们可以给a标签设置属性`rel="noopener"`或`rel="noreferrer"`，这样可以让打开的页面在新的进程里运行，同时新页面不再可以访问`window.opener`

Chrome在67版本后默认开启了站点隔离，但为了兼容老版本浏览器，最好还是加上稳妥点。但是站点隔离后也会造成一些微妙的副作用，可以查看这一篇[文章](https://developers.google.com/web/updates/2018/07/site-isolation)

##### 确保页面的CSP对XSS攻击有效
设置页面的CSP，避免XSS攻击，之前写过一篇[如何避免基于DOM的XSS攻击](https://lester-xie.github.io/javascript/2021/03/01/dom-xss.html)

#### 创建一个好的用户体验
##### 不要在页面加载时请求地理位置授权
很多时候我也感到莫名其妙，才进入网站，就告诉我该网站需要请求我的地理位置授权，有时我只是无心点击进来的，更不想给你授权搜集信息。

为了提供更好的用户体验：
* 始终在用户做相应的操作后请求地理定位权限，而不是在页面加载时
* 明确的表示该操作需要请求地理位置权限
* 假设用户不会提供他们的位置
* 如果用户不授予地理定位权限，那么就回退

##### 不要在页面加载时请求通知权限
好的通知是及时的、相关的和准确的。如果你的页面在加载时发送通知，这些通知可能与你的用户或起需求无关。

应该在以前情况下请求通知权限：
* 提议向用户发送特定类型的通知
* 在用户选择加入通知类型后显示权限请求

#### 总结
[google develop](https://web.dev/lighthouse-best-practices/)官网上给了以上的最佳实践建议，目的其实是为了推广他们出品的网页审查工具[lighthouse](https://developers.google.com/web/tools/lighthouse/){:target="_blank"}，
该工具可以帮你的网站做体检，找出网页漏洞和优化建议，并且完全开源。

