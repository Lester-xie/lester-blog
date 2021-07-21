---
title:  'CSS Variables (下一代 CSS )'
date:   '2017-11-01'
---

CSS变量，也叫做CSS自定义属性。他们可用于减少CSS中的重复，以及强大的运行时效果，比如主题切换、多重填充等未来的CSS功能。

#### CSS的混乱
以往我们的应用里，为了保持外观的一致性，通常都会重复使用一些颜色，而每次更改一种颜色时，在不断的查找替换中很容易就引发错误。

直到LESS、SASS这样的CSS预处理器出现，让我们使用函数式编程的技巧来书写CSS，极大的提高了开发效率。但它们还是有一个主要的缺点，即它们是静态的，在运行时不能被更改。

#### 自定义属性

我们来看一个简单的示例:
<pre class="language-css"><code>
:root {
  --mainColor: #ccc;
}

div {
  color: var(--mainColor);
}
    </code></pre>

我们定义了一个`--mainColor`的变量，然后使用`var()`函数来使用这个变量。

#### 语法

自定义属性的语法很简单:
<pre class="language-css"><code>
--color: #fff;
    </code></pre>

使用两个破折号开头来定义一个变量，且区分大小写，所以`--color`和`--COLOR`是两个不同的变量。我们还可以这样用:
<pre class="language-css"><code>
--foo: if(x > 5) this.width = 10;
    </code></pre>
虽然这样的写法在普通属性中是无效的，但它可以在运行时被Javascript读取并执行，这是预处理器所不能做到的。

#### 级联

自定义属性遵循标准级联规则
<pre class="language-html">
<code>
/* CSS */
:root { --color: blue; }
div { --color: green; }
#red { --color: red; }
* { color: var(--color); }

&lt;!-- HTML --&gt;
&lt;p&gt;(蓝色)我从根元素那继承了蓝色&lt;/p&gt;
&lt;div&gt;(绿色)我被设置成绿色&lt;/div&gt;
&lt;div id="red"&gt;
    (红色)我被特别设置成红色
    &lt;p&gt;(红色)我从父元素那继承了红色&lt;/p&gt;
&lt;/div&gt;
    </code></pre>
![CSS级联](http://navcd-1252873427.cosgz.myqcloud.com/head_img/CSS%E7%BA%A7%E8%81%94.png)

因此，我们可以使用自定义属性在媒体查询中做响应式设计
<pre class="language-css"><code>
:root {
  --gutter: 4px;
}

section {
  margin: var(--gutter);
}

@media (min-width: 600px) {
  :root {
    --gutter: 16px;
  }
}
    </code></pre>


这是SASS不能做到的，因为它不能在媒体查询中定义变量。

#### var()函数
我们使用`var()`函数来引用自定义属性
<pre class="language-css">
<code>
var(&lt;custom-property-name&gt; [, &lt;declaration-value&gt; ]? )
    </code></pre>
`<custom-property-name>`是使用者定义的自定义属性名，`<declaration-value>`代表自定义属性名无效时的替代项(替代项会覆盖继承自父元素的样式)，传递多个替代项时，以最后一个替代项为准。

<pre class="language-css">
<code>
/* CSS */
div { 
    --color: green;
}

.component .header {
  color: var(--header-color, blue);
}
.component .text {
  color: var(--text-color, black);
}

.component {
  --text-color: #080;
}

&lt;!-- HTML --&gt;
&lt;div class="component"&gt;
    &lt;p class="header"&gt;this is header&lt;/p&gt;
    &lt;p class="text"&gt;this is text&lt;/p&gt;
&lt;/div&gt;
    </code></pre>

![var函数](http://navcd-1252873427.cosgz.myqcloud.com/head_img/var%E5%87%BD%E6%95%B0.png)

#### 用calc()构建值
可以使用`calc()`函数来动态生成值
<pre class="language-css"><code>
.foo {
  --gap: 20;
  margin-top: calc(var(--gap) * 1px);
}
    </code></pre>

#### 在JavaScript中使用自定义属性
现有一段自定义属性如下:
<pre class="language-html"><code>
/* CSS */
:root {
    --mainColor: orange;
}

p {
    color: var(--mainColor);
}

<!-- HTML -->
&lt;p&gt;this is orange&lt;/p&gt;
    </code></pre>

使用`getPropertyValue()`方法可以获取到自定义属性的值。
<pre class="language-javascript"><code>
var styles = getComputedStyle(document.documentElement);
var value = String(styles.getPropertyValue('--mainColor')).trim();
// value = 'orange'
    </code></pre>

也可以使用`setProperty()`设置该对象的值
<pre class="language-javascript"><code>
document.documentElement.style.setProperty('--mainColor', 'green');
    </code></pre>

还可以设置成一个var()调用中的函数，在运行时调用另一个自定义属性
<pre class="language-javascript"><code>
document.documentElement.style.setProperty('--mainColor', 'var(--secondaryColor)');
    </code></pre>

#### 浏览器支持
目前Chrome 49，Firefox 42，Safari 9.1和iOS Safari 9.3支持自定义属性。

对于不兼容的浏览器,也有相应的解决方案，[postcss](http://postcss.org/) 提供了一个插件 [cssnext](http://postcss.org/) 可以把下一代的CSS转化为目前通用的CSS。
