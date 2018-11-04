
var str = ''
console.log(str.__proto__ === String.prototype)

var arr = new Array()
console.log(arr.__proto__ === Array.prototype)

function Person (name) {
  this.name = name
}
var person = new Person('alice')
console.log(person.__proto__ === Person.prototype)
console.log(Person.prototype.__proto__ === Object.prototype)
console.log(Person.prototype.constructor === Person)
