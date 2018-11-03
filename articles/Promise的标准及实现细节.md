# Promise 的标准及实现细节

# 一、Promise 的定义

Promise 是异步编程的一种解决方案，比传统的解决方案（回调函数和事件）更合理和更强大。它由社区最早提出和实现，ES6 将其写进了语言标准，统一了用法，原生提供了`Promise`对象。

所谓`Promise`，简单说就是一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。从语法上说，Promise 是一个对象，从它可以获取异步操作的消息。Promise 提供统一的 API，各种异步操作都可以用同样的方法进行处理。

有了`Promise`对象，就可以将异步操作以同步操作的流程表达出来，避免了层层嵌套的回调函数。此外，`Promise`对象提供统一的接口，使得控制异步操作更加容易。

`Promise`也有一些缺点：

- 无法取消`Promise`，一旦新建它就会立即执行，无法中途取消。
- 如果不设置回调函数，`Promise`内部抛出的错误，不会反应到外部。
- 当处于`pending`状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。

# 二、PromiseA+ 标准

ES 标准中的 Promise，Q 以及 bluebird 都是 PromiseA+ 标准的实现。 PromiseA+ 标准主要从三部分提出了对 Promise 实现的要求：（[*更具体的标准戳这里*](https://promisesaplus.com/#point-53)）

## Promise 的状态

Promise 必须处于`pending`, `resolved`, `rejected` 三个状态之一

- 当 Promise 处于 `pending` 状态时可以转换到 `resolved` 或 `rejected` 状态
- 当 Promise 处于 `resolved` 状态时无法再转换到其他状态，并且有一个无法改变的 value
- 当 Promise 处于 `rejected` 状态时无法再转换到其他状态，并且有一个无法改变的reason（reason 一般为一个 Error 对象）

## Promise 的 then 方法

Promise 必须提供一个用来处理当前或未来可能的操作结果或异常的 `then` 方法

Promise 的 `then` 方法接受 **两个参数：**

    promise.then(onFulfilled, onRejected);

- `onFulfilled` 和 `onRejected` 参数都是可选的，如果不是函数类型则将其忽略
- 当`onFulfilled` 是一个函数时，它只会在 Promise 成功执行完成后被调用，并接受 Promise 的执行结果 `value` 作为参数。`onFulfilled` 只会被调用一次。
- 当`onRejected` 是一个函数时，它只会在 Promise 执行失败后被调用，并接受 Promise 执行失败的 `reason` （通常是Error 对象）作为参数。 `onRejected` 只会被调用一次。
- `onFulfilled` 和 `onRejected` 只会作为单纯的函数被调用，即不会绑定到特定的 `this` 对象
- `onFulfilled` 和 `onRejected` 通过异步的方式执行，采用与 process.nextTick, 和MutationObserver 执行顺序相同的 micro-task 机制，执行顺序高于采用 macro-task 机制的 setTimeout , setInterval, setImmediate, I/O, UI rendering
- `then` 方法会返回一个新的 Promise 实例对象

        newPromise = promise.then(onResolved, onRejected);

    1. 如果 `onResolved` 或 `onRejected` 返回一个 `x` ，那么 `newPromise` 的状态需要根据 `x` 来决定（至于如何决定 `newPromise` 的状态，会在第三部分中说明）
    2. 如果 `onResolved` 或 `onRejected` 抛出一个异常 `e`, 那么 `newPromise` 必须 `rejected` 且 `reason = e`
    3. 如果 `promise` 是 `resolved` 状态且 `onResolved` 不是一个函数，那么 `newPromise` 必须 `resolved`，并且 `newPromise` 的 `value` 必须与 `promise` 相同
    4. 如果 `promise` 是 `rejected` 状态且 `onRejected` 不是一个函数，那么 `newPromise` 必须 `rejected`，并且 `newPromise` 的 `reason` 必须与 `promise` 相同

## The Promise Resolution Procedure（Promise 的执行结果的后续过程）

**The Promise Resolution Procedure** 可以看作是通过当前 Promise 对象的 `onResolved` 或 `onRejected` 回调函数的返回值 `x` 来决定在调用 then 方法时返回的下一个 Promise 对象的状态的操作过程，该操作需要接受两个参数 `(newPromise, x)`，会根据 x 的情况来决定下一个 Promise 对象的状态。

如果 `x` 是一个 `thenable`（带有 `then` 方法的 Object 或 Function），那么可以假设 `x` 和 Promise 的行为相似，这一点是为了让不同 PromiseA+ 标准的实现可以兼容。

`onResolved` 或 `onRejected` 返回 value 后的操作步骤如下（这里假设 `onResolved` 或 `onRejected` 的返回值为 `x`，`then` 方法返回的新的 Promise 对象为 `newPromise`）：

1. 如果 `x` 和 `newPromise` 是同一个对象的引用(x === promise) ，那么 `reject` promise 并将一个`TypeError` 赋值给 reason。
2. 如果 `x` 是一个 Promise 对象，则需要判断 `x` 的状态来决定 `newPromise` 的状态：
    - 如果 `x` 处于 `pending` 状态，那么 `newPromise` 也处于 `pending` 状态，直到 `x` 的状态变为 `resolved` 或者 `rejected`。
    - 如果 `x` 处于 `resolved` 状态，那么用 `x` 的 `value` 来 resolve `newPromise`
    - 如果`x` 处于 `rejected` 状态，那么用 `x` 的 `reason` 来 reject `newPromise`
3. 如果 `x` 是一个 Object 或 Function：
    - 如果获取 `x.then` 的过程中抛出异常 `e` ，那么将 `e` 作为 reason 来 reject `newPromise`
    - 如果  `x.then` 是一个 Function，那么调用  `x.then` 并传入参数 `resolvePromise` 和 `rejectPromise` ：
        - 如果 `resolvePromise` 被调用且传入的参数为 `y`，那么再次执行此操作，参数为 `(newPromise, y)`
        - 如果 `rejectPromise` 被调用且传入的参数为 `r`，那么将 `r` 作为 `reason` 来 reject `newPromise`
        - 如果 `resolvePromise` 和 `rejectPromise` 同时被调用，或被用相同的参数调用多次，那么应该只处理第一次调用，之后的调用都应该被忽略。
        - 如果调用 `x.then` 抛出了异常 `e`，若在抛出异常前已经调用过 `resolvePromise` 或 `rejectPromise`，那么忽略异常即可；否则将 `e` 作为 `reason` 来 reject `newPromise`
    - 如果 `x.then` 不是一个 Function，那么用 `x` 来 resolve `newPromise`
4. 如果 `x` 不是一个 Object 或 Function，那么用 `x` 来 resolve `newPromise`

# 三、Promise 你可能不知道的六件事

## 1. then() 返回一个 forked Promise(分叉的 Promise)

下面两段代码有什么不同？

    // Exhibit A
    var p = new Promise(/*...*/);
    p.then(func1);
    p.then(func2);

    // Exhibit B
    var p = new Promise(/*...*/);
    p.then(func1).then(func2);

如果你认为两段代码等价，那么你可能认为 promise 仅仅就是一维回调函数的数组。然而，这两段代码并不等价。p 每次调用 `then()` 都会返回一个 `forked promise`。因此，在A中，如果 `func1` 抛出一个异常，`func2` 依然能执行，而在B中，`func2` 不会被执行，因为第一次调用返回了一个新的 promise，由于 `func1` 中抛出异常，这个 promise 被 rejected了，结果 `func2` 被跳过不执行了。

## 2. 回调函数应该传递结果

下面的代码会 alert 什么？

    var p = new Promise(function(resolve, reject) {
      resolve("hello world");
    });
    
    p.then(function(str) {}).then(function(str) {
      alert(str);
    });

第二个 `then` 中的 alert 不会显示任何内容。因为在链式调用多个 `then` 方法的过程中，如果前一个 `then` 中的 `onResolved` 和 `onRejected` 回调函数都没有抛出异常，那么这两个回调函数的返回值会被传递给后一个 `then` 中的 `onResolved` 函数；反之如果有抛出异常，那么异常会被传递给下一个 `then` 中的 `onRejected` 函数。

这和适配器传递结果的思想一样，看下面的示例：

    var feetToMetres = function(ft) { return ft*12*0.0254 };
    
    var p = new Promise(/*...*/);
    
    p.then(feetToMetres).then(function(metres) {
      alert(metres);
    });

## 3. 只能捕获来自上一级的异常

下面的两段代码有什么不同：

    // Exhibit A
    new Promise(function(resolve, reject) {
      resolve("hello world");
    }).then(
      function(str) {
        throw new Error("uh oh");
      },
      undefined
    ).then(
      undefined,
      function(error) {
        alert(error);
      }
    );

    // Exhibit B
    new Promise(function(resolve, reject) {
      resolve("hello world");
    }).then(
      function(str) {
        throw new Error("uh oh");
      },
      function(error) {
        alert(error);
      }
    );

在A中，当第一个 `then` 抛出异常时，第二个 `then` 能捕获到该异常，并会弹出 'uh oh'。这符合只捕获来自上一级异常的规则。

在B中，正确的回调函数和错误的回调函数在同一级，也就是说，尽管在回调中抛出了异常，但是这个异常不会被捕获。事实上，B中的错误回调只有在 promise 被 `rejected` 或者 promise 自身抛出一个异常时才会被执行。

## 4. 错误能被恢复

在一个错误回调中，如果没有重新抛出错误，promise 会认为你已经恢复了该错误，promise 的状态会转变为 `resolved`。在下面的例子中，会弹出’I am saved’ 是因为第一个 `then` 中的错误回调函数并没有重新抛出异常。

    var p = new Promise(function(resolve,reject){
      reject(new Error('pebkac'));
    });  
    
    p.then(
      undefined,
      function(error){ }
    ).then(
      function(str){
        alert('I am saved!');
      },
      function(error){
        alert('Bad computer!');
      }
    );

Promise 可被视为洋葱的皮层，每一次调用 then 都会被添加一层皮层，每一个皮层表示一个能被处理的状态，在皮层被处理之后，promise 会认为已经修复了错误，并准备进入下一个皮层。

## 5. Promise 能被暂停

仅仅因为你已经在一个 `then` 函数中执行过代码，并不意味着你不能够暂停 promise 去做其他事情。为了暂停当前的 promise，或者要它等待另一个 promise 完成，只需要简单地在 `then` 函数中返回另一个 promise。

    var p = new Promise(/*...*/);   
    
    p.then(function(str){
      if(!loggedIn){
        return new Promise(/*...*/);
      }
    }).then(function(str){
      alert("Done!");
    });

在上面的代码中，直到新的 promise 的状态是 `resolved` 解析后，alert 才会显示。如果要在已经存在的异步代码中引入更多的依赖，这是一个很便利的方式。例如，你发现用户会话已经超时了，因此，你可能想要在继续执行后面的代码之前发起第二次登录。

## 6. Promise 的执行优先级

运行下面的代码会将数字按什么顺序输出呢？

    setTimeout(function() {
      console.log('5')
    }, 0)
    
    var promise = new Promise(function(resolve, reject) {
      console.log('1')
    
      for(var i = 0; i < 10000; i++) {
          i == 9999 && resolve('xxx')
      }
    
      console.log('2')
    })
    
    
    function onResolved (value) {
      console.log('4')
      console.log('The promise is resolved with value: ', value)
    }
    function onRejected (e) {
      console.log('The promise is rejected with reason: ', e)
    }
    promise.then(onResolved, onRejected)
    
    console.log('3')

正确答案应该是 `1 2 3 4 5`，因为初始化 Promise 构造函数的回调函数体是放在执行栈中以`同步`方式执行的，而 resolve 参数触发的 `onResolved` 回调函数是以`异步`方式执行的，所以虽然在 1 和 2 输出的过程中触发了 resolve 方法，还是会先输出1 2 3。

接下来对比 `then` 方法中的 `onResolved` 回调函数和 `setTimeout`，onResolved 是以 `micro-task` 的机制执行的，而 setTimeout 则是 `macro-task`，所以会先执行优先级高的 onResolved，最后执行 setTimeout，因此最终的输出顺序为 `1 2 3 4 5`

# 四、实现一个自定义的 Promise

完整的代码实现及测试样例地址在 [这里](https://github.com/cyrilzhao/blog/tree/master/src/promise/customPromise)，欢迎拍砖

参考资料：

[Promise/A+](https://promisesaplus.com/#point-53)

[关于Promise：你可能不知道的6件事](https://github.com/dwqs/blog/issues/1)

[从Promise来看JavaScript中的Event Loop、Tasks和Microtasks](https://github.com/creeperyang/blog/issues/21)

[Promise的实现与标准](https://www.jianshu.com/p/4d266538f364)