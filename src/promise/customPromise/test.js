var _Promise = require('./index.js')

let promise = new _Promise(function(resolve, reject) {
  // throw new Error('aaa')
  resolve('xxx')
})

function onResolved (value) {
  console.log('The promise is resolved with value: ', value)
  return 'p1value:' + value
}
function onRejected (e) {
  console.log('The promise is rejected with reason: ', e)
}
let p1 = promise.then(onResolved, onRejected)
console.log('p1: ', p1)

setTimeout(function() {
  let p2 = promise.then((value) => {
    console.log('The promise is resolved by another callback with value: ', value)
    return 'p2value:' + value
  }, (err) => {
    console.log('The promise is rejected by another callback with reason: ', err)
  })

  setTimeout(() => {
    console.log('p1: ', p1)
    console.log('p2: ', p2)
  }, 0)
}, 2000)

