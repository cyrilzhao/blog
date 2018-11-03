
function func1 () {
  console.log('call func1')
  throw new Error('dasd')
}
function func2 () {
  console.log('call func2')
}

// let p1 = new Promise(function (resolve, reject) {
//   resolve()
// })
// p1.then(func1)
// p1.then(func2)


let p2 = new Promise(function (resolve, reject) {
  resolve()
})
p2.then(func1).then(func2)
