var _Promise = require('./index.js')

function func1 () {
  console.log('call func1')
  throw new Error('dasd')
}
function func2 () {
  console.log('call func2')
}

console.log('------ Example A ------')

let p1 = new _Promise(function (resolve, reject) {
  resolve()
})
var p11 = p1.then(func1)
var p12 = p1.then(func2)
setTimeout(function() {
  console.log(p11)
  console.log(p12)
}, 0)


setTimeout(function () {
  console.log('')
  console.log('------ Example B ------')
  let p2 = new _Promise(function (resolve, reject) {
    resolve()
  })
  p2.then(func1).then(func2)
}, 1000)

