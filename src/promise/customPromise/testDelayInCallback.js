var _Promise = require('./index.js')

var p = new _Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve()
  }, 1000)
})

p.then(function(str){
  console.log('resolve')
  return new _Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve()
    }, 1000)
  })
}).then(function(str){
  console.log("Done!")
});