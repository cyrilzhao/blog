var _Promise = require('./index.js')

setTimeout(function() {
  console.log('5')
}, 0)


var promise = new _Promise(function(resolve, reject) {
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
  console.log('5')
  console.log('The promise is rejected with reason: ', e)
}
promise.then(onResolved, onRejected)

console.log('3')
