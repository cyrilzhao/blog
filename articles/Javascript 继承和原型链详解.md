# Javascript 继承和原型链详解

# 一、基于原型链的继承

## 1、容易混淆的 prototype 和 __proto__

首先来说说 `__proto__`，先引用 《Javascript 权威指南》的一段描述：

> Every JavaScript object has a second JavaScript object (or null ,
but this is rare) associated with it. This second object is known as a prototype, and the first object inherits properties from the prototype.

翻译过来就是每个 Javascript 对象都有一个对应的原型对象，并且能从原型对象上继承属性和方法。在 Javascript 的每个对象中，指向其原型对象的属性就是 `__proto__`。（注意：`__proto__` 属性只能在非 IE 内核的浏览器中访问）

再来说说 `prototype`，不像每个对象中都有的 `__proto__` 属性，`prototype` 只作为函数的属性存在。当你创建一个函数时，Javascript 会自动为该函数添加一个 `prototype` 属性，属性的值是一个只有 `constructor` 属性的对象，这个 `constructor` 属性就指向该函数本身。

如下方代码所示：

    function func1 () {
    
    }
    
    func1.prototype.constructor === func1   // true

Javascript 中还有一个 `instanceof` 操作符，它其实就是通过当前变量原型链上的各级 `__proto__` 与目标函数的 `prototype` 属性进行对比，以此来确定继承关系的。其操作过程大致如下方代码所示：

    function instanceOf( L, R ) {   // L 表示左表达式，R 表示右表达式
      var P = R.prototype;          // 取 R 的显式原型
      L = L.__proto__;              // 取 L 的隐式原型
      while ( true ) { 
        if ( L === null ) return false;
        if ( P === L ) return true; 
        L = L.__proto__; 
      } 
    }

通过上面的内容我们知道了 `__proto__` 和 `prototype` 属性的含义和特点，接下来看它们是如何实现 Javascript 中的继承的。

## 2、继承是如何实现的

不同于 Java、C++ 等其他面向对象的语言，Javascript 的语法中并没有类（`Class`）的概念，而是通过函数来模拟类的行为。

举个栗子，当我们要创建一个自定义对象的时候，可以这样做：

    function Person (name) {
    	this.name = name
    }
    var person = new Person('alice')

在这里我们采用 `new` 关键字来创建一个对象，这种创建对象的方式叫做 `构造函数模式`，Person 函数就是构造函数。在采用这种模式的过程中，Javascript 会创建一个空对象，并将构造函数的作用域上下文（即 `this` 的指向）绑定到这个空对象，在构造函数中进行完一系列操作之后将这个新对象返回。

除了我们在代码中看到的 `name` 属性的赋值之外，Javascript 还会将 `Person` 函数的 `prototype` 属性赋值给这个新对象的 `__proto__` 属性，这样我们就能知道 `person` 对象是由 `Person` 构造函数生成的，`Person.prototype` 就是 `person` 对象的原型。

当我们在一个对象上调用某个方法或者属性的时候，如果当前对象没有这个方法或属性，Javascript 就会通过 `__proto__` 到它的原型对象上去找。`__proto__` 作为一个对象，也会有它自身的原型对象 `__proto__` 属性，这样就形成了一条原型链。

因此只要在 `Person.prototype` 或其 `__proto__` 属性指向的原型链中某个原型对象上添加自定义方法 `func1`，就可以使得通过 `Person` 构造函数创建出来的所有对象都带有 `func1` 这个自定义方法。Javascript 就是这样通过 `prototype` 和 `__proto__` 之间的协作来实现类的继承。

# 二、原型链的来龙去脉

## 1、万物皆为 Object

我们都知道 Javascript 是一门面向对象的语言，号称 `一切皆为对象`，这是如何实现的呢？

下面用一组代码示例来说明问题：

    "str".__proto__.constructor === String
    
    "str".__proto__ === String.prototype  // true
    
    "str".__proto__.__proto__ === Object.prototype   // true
    
    String.prototype.__proto__ === Object.prototype  // true
    
    Object.prototype.__proto__ === null  // true

上面的代码以字符串类型为例：

- `"str".__proto__.constructor` 指向 `String`，说明`String` 是字符串变量 `"str"` 的构造函数。
- `String.prototype.__proto__` 指向的是 `Object.prototype`，这就说明 String 也是继承自 Object。
- 验证一下 `"str".__proto__.__proto` 确实指向的也是 `Object.prototype`，说明字符串类型的变量在 Javascript 的继承体系里也是一个对象。
- `Object.prototype.__proto__` 的值是 `null`，这说明原型链的尽头是 `null`，最顶端的原型对象就是 `Object.prototype`，所以在 Javascript 中所有类型都是继承自 `Object`，也可以说是一切皆为对象。

## 2、一等公民 Function

我们常说 `Function` 是 Javascript 中的“一等公民”，先来看看下面代码中这个鸡生蛋还是蛋生鸡的问题：

    Object instanceof Function  // true
    
    Function instanceof Object  // true

为了理解这个问题，我们首先从 ES5 的规范中摘录几点相关说明：

- 普通函数实际上是 `Function` 的实例，即普通函数继承于 `Function.prototype`。

    `func1.__proto__` === `Function.prototype`

- `Function.prototype` 继承于 `Object.prototype`，并且其没有 `prototype` 这个属性。`func.prototype` 是普通对象，`Function.prototype.prototype` 是 `null`。
- `Object` 本身是个（构造）函数，是 `Function` 的实例，即 `Object.__proto__` 就是`Function.prototype`。

根据上述规范，可以得出以下几点结论：

- `Function.prototype` 就是解开这个问题的关键。`Object`/`Array`/`String` 等构造函数本质上和 `Function` 一样，均继承于 `Function.prototype`。
- 既然 `Function.prototype` 也是对象，那么 `Function.prototype.__proto__` 就应该指向 `Object.prototype`，这样一来 `Array`/`String` 等函数也就顺理成章地继承自 `Object` 了。
- 现在万物皆 `Object` 的故事里只剩下 `Function` 了。要想让 `Function` 继承自 `Object` ，就需要 `Function.__proto__` 指向的原型链中存在 `Object.prototype`。从上一条结论中我们知道 `Function.prototype.__proto__` 刚好就指向 `Object.prototype`，所以只需要将 `Function.__proto__` 指向 `Function.prototype` 即可。

为了验证上述结论，代码示例如下：

    Function.__proto__ === Function.prototype  // true
    
    Object.__proto__ === Function.prototype    // true
    
    String.__proto__ === Function.prototype    // true
    
    Function.__proto__.__proto__ === Object.prototype  // true
    
    Object.__proto__.__proto__ === Object.prototype    // true
    
    String.__proto__.__proto__ === String.prototype    // true

代码运行结果验证无误。说明原型链最顶端的原型对象就是 `Object.prototype`，往下分为两条分支：

- 第一条往下走是 `Function.prototype`，即各类构造函数 `Array`/`String`/`Object` 及自定义函数 `fun1`/`fun2` 等的 `__proto__`，最底端就是各类构造函数及自定义函数。
- 第二条往下走是各类构造函数及自定义函数的 `prototype` 属性，即各类内置对象及自定义对象的 `__proto__` 属性，在经过自定义对象可能存在的多级 `__proto__` 属性原型链之后，最底端是各类内置对象及自定义对象。

参考资料：

[从__proto__和prototype来深入理解JS对象和原型链](https://github.com/creeperyang/blog/issues/9)