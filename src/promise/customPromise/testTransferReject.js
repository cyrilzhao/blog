var _Promise = require('./index.js')

var p = new _Promise(function(resolve, reject) {
  resolve("hello world");
})
.then(
  function(str) {
    throw new Error("uh oh");
  },
  undefined
)
.then(
  undefined,
  function(error) {
    console.log(error);
  }
);

setTimeout(function() {
  console.log('p: ', p)
}, 0)