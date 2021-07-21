---
title:  '如何避免基于DOM的XSS攻击'
date:   '2021-03-01'
---

#### 背景
DOM XSS一直以来是网站上最普遍和最危险的安全漏洞之一，常见的两种情况，要么是服务端输出了不安全的HTML代码，要么是JavaScript调用了控制用户内容的危险函数。

为了避免服务端的XSS，不要通过连接字符串来生成HTML，而是使用安全的上下文转义模板。可以使用库[common-tags](https://www.npmjs.com/package/common-tags#html){:target="_blank"}里的`html`方法，得到安全的HTML片段。
对于第二种，浏览器提供了[Trusted Types](https://github.com/w3c/webappsec-trusted-types){:target="_blank"}，避免在客户端的XSS。

#### Trusted Types 介绍

为了开启可信类型检查，我们需要在HTML头部加上
<pre class="language-html"><code>
&lt;meta http-equiv="Content-Security-Policy" content="trusted-types unsafe escape; require-trusted-types-for 'script'"&gt;
    </code></pre>
可信类型通过锁定下面这些具有风险的函数或属性来规避问题，甚至在一些框架里也会让你避免使用这些特性，比如在[React](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml){:target="_blank"}内也有提及。

* 脚本操作:  
设置`<script>`的`src`属性或者元素内的文本内容
* 用字符串生成HTML:  
`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `<iframe> srcdoc`, `document.write`, `document.writeln`和`DOMParser.parseFromString`
* 执行插件内容:  
`<embed src>`, `<object data>`和`<object cadebase>`
* JavaScript运行时:  
`eval`, `setTimeout`, `setInterval`和`new Function()`

在赋值给上述属性或传参给上述方法时，如果只使用字符串的话会报错，因为浏览器并不知道他们是可信的。点击这个[例子](/assets/example/trusted-types.html){:target="_blank"}

我在给HTML加上`meta`后，又写了如下的代码

<pre class="language-javascript"><code>
document.body.innerHTML = 'throws error'
    </code></pre>
打开控制台可以看到如下错误: 
![error](/assets/img/20210301/error.png)

可信类型会阻止使用带有字符串的DOM XSS接收器，这大大减少了应用程序的DOM XSS攻击面。

#### 使用 Trusted Types
通过创建可信类型策略，我们可以正常使用以上方法。

首先引入通过`script`标签引入库
<pre class="language-html"><code>
&lt;script src="https://w3c.github.io/webappsec-trusted-types/dist/es5/trustedtypes.build.js" data-csp="trusted-types unsafe escape; require-trusted-types-for 'script'"></script&gt;
    </code></pre>

然后再创建一个策略:
<pre class="language-javascript"><code>
var escapePolicy = trustedTypes.createPolicy('escape', {
   createHTML: function(unsafe) {
     return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
     },
   });
 var escapedValue = escapePolicy.createHTML('<div>come on</div>');
 document.body.innerHTML = escapedValue
    </code></pre>

这样就可以针对用户自定义的特殊情况使用以上方法了。

#### 总结
web现在发展得很快，新建一个网站会引入大量的第三方库，最终生成的HTML并不可控，我们自己如果去做大量的策略兼容显然不大现实，我们可以使用像[DOMPurify](https://github.com/cure53/DOMPurify)
这样的第三方库来帮助实现HTML的XSS清理。

同时，在编写代码时也该注意避免使用innerHTML，如:
<pre class="language-javascript"><code>
element.innerHTML = '<img src=abc.jpg>';
   </code></pre>

可以替换成
<pre class="language-javascript"><code>
element.textContent = '';
const img = document.createElement('img');
img.src = 'abc.jpg';
element.appendChild(img);
    </code></pre>

