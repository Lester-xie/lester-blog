---
title:  'CSS3的小tips'
date:   '2017-07-10'
---
#### 一、目标伪类选择器
使用方法: `E:target`  

当锚点被指向当前元素时，所设置的样式才会生效。示例:

现在浏览器的支持情况如下:
![目标伪类选择器的浏览器支持情况](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202017-07-04%20%E4%B8%8B%E5%8D%8811.04.16.png)
<pre class="language-html">
<code>
&lt;style&gt;
    :target{
        color:red;
        border:1px solid yellowgreen;
    }
&lt;/style&gt;
&lt;body&gt;
    &lt;a href="#p1"&gt;href1&lt;/a&gt;
    &lt;a href="#p2"&gt;href2&lt;/a&gt;
    &lt;p id="p1"&gt;href1&lt;/p&gt;
    &lt;p id="p2"&gt;href2&lt;/p&gt;
&lt;/body&gt;
    </code></pre>
                                             
IE8+才支持。  
常用来做手风琴效果和文字注释。

#### 二、伪元素 
##### 1.::first-letter  
实例: 选择文本块的第一个首字母，可以用作一些特效，比如首字母下沉:
<pre class="language-html"><code>
&lt;style&gt;
    p {
        padding: 10px;
        width: 200px;
        border: 1px solid #262626;
    }
    p::first-letter {
        float: left;
        font: 50px/40px Georgia;
    }
&lt;/style&gt;
&lt;body&gt;
    &lt;p&gt;This is a ::first-letter test.This is a ::first-letter test.This is a ::first-letter test.&lt;/p&gt; 
&lt;/body&gt;
    </code></pre>
![首字母下沉](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202017-07-06%20%E4%B8%8B%E5%8D%8811.42.19.png)

##### 2.::before和::after  
实例: 用于插入额外内容的伪元素，一个实例是在链接之后附加它所指的URL。
<pre class="language-html"><code>
&lt;style&gt;
    a::after {
        content: " (" attr(href) ") ";
    }
&lt;/style&gt;
&lt;body&gt;
    &lt;a href="https://www.google.com"&gt;google&lt;/a&gt;
&lt;/body&gt;
    </code></pre>

![链接](http://navcd-1252873427.cosgz.myqcloud.com/head_img/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202017-07-07%20%E4%B8%8A%E5%8D%889.08.33.png)

#### 三、属性选择器里的通配符

| 通配符 | 功能 | 示例 |
| -- | -- | -- |
| ^ | 匹配起始符 | [attr^=val] 匹配属性值是以val开头的元素 |
| $ | 匹配终止符 | [attr$=val] 匹配属性值是以val结尾的元素 |
| * | 匹配任意字符 | [attr*=val] 匹配属性值包含val的元素 |

在IE7+以上得到支持。

#### 四、border
##### 1.border的特殊应用
1) 当`border-radius`的值小于或等于`border-width`时，元素边框内部就不具有圆角效果了  
元素边框分为内边半径和外边半径，外边半径等于`border-radius`的值，`内边半径 = 外边半径 - 元素边框厚度`。当内边半径小于或等于0时，元素内角为直角。  

2)元素相邻边有不同的宽度，这个角将会从宽的边平滑过渡到窄的一边，其中一条边甚至可以是0，元素相邻转角是由大向小转。  

##### 2.表格应用圆角
当给表格加上`border-collapse: collapse`属性后，圆角不能正常显示;只有当`border-collapse`属性为`separate`时，才会正常显示。

#### 五、文本处理
##### 1.文本溢出处理
在宽度固定时，当文本过长，我们通常会使用省略号来标记显示。IE6+以上都支持的，放心玩。
<pre class="language-html"><code>
&lt;style&gt;
    p {
        width: 100px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        text-overflow: ellipsis;  /*文本溢出时显示省略标记*/
        white-space: nowrap;  /*强制不换行*/
        overflow: hidden;  /*溢出内容隐藏*/
    }
&lt;/style&gt;
&lt;body&gt;
    &lt;p&gt;我也不是很确定它会不会出现省略号&lt;/p&gt; 
&lt;/body&gt;
    </code></pre>

##### 2.文本换行
word-break: 实现长单词或URL的换行  
`word-wrap: nomal | break-word`  
* normal: 默认值，浏览器只在半角空格或者连字符的地方进行换行
* break-word: 将内容在边界内换行

word-break: 自动换行处理  
`word-break: normal | break-all | keep-all`  
* normal: 默认值，中文到整个边界换行，英文从整个单词换行
* break-all: 强制截断英文单词
* keep-all: 不允许字断开。如果英文字符长度超过容器边界，后面的部分将撑破容器;如果边框为国定属性，则后面部分无法显示。

##### 3.white-space属性
`white-space: normal | pre | nowrap | pre-line | pre-wrap | inherit`
* normal: 默认值，浏览器会忽略空白符
* pre: 浏览器会保留空白符，和`<pre>`效果一致
* nowrap: 文本不换行，直到遇到`<br/>`标签
* pre-line: 合并空白序列，保留换行。IE7+支持
* pre-wrap: 保留空白序列，正常换行
* inherit: 继承父元素的`white-space`属性
