var p = new Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve()
  }, 1000)
})

p.then(function(str){
  console.log('resolve')
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve()
    }, 1000)
  })
}).then(function(str){
  console.log("Done!")
});