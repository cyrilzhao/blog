var _Promise = require('./index.js')

var feetToMetres = function(ft) { return ft * 12 * 0.0254 };

var p = new _Promise(function(resolve, reject) {
  resolve(10000)
});

p.then(feetToMetres).then(function(metres) {
  console.log('metres: ', metres);
});

setTimeout(function() {
  console.log(p)
}, 0)
