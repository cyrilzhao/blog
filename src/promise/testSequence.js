var promise = new Promise(function(resolve, reject) {
  console.log('1')

  for(var i = 0; i < 10000; i++) {
      i == 9999 && resolve('xxx')
  }

  console.log('2')
})

function onResolved (value) {
  console.log('The promise is resolved with value: ', value)
}
function onRejected (e) {
  console.log('The promise is rejected with reason: ', e)
}
promise.then(onResolved, onRejected)
