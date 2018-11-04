
console.log('Function.prototype === Function.__proto__: ', Function.prototype === Function.__proto__)

console.log('Function.prototype.__proto__ === Object.prototype: ', Function.prototype.__proto__ === Object.prototype)

console.log('Object.__proto__ === Function.prototype: ', Object.__proto__ === Function.prototype)

console.log('Object.__proto__.__proto__ === Object.prototype: ', Object.__proto__.__proto__ === Object.prototype)

console.log('Object.prototype.__proto__: ', Object.prototype.__proto__)   // null

console.log('String.__proto__ === Function.prototype: ', String.__proto__ === Function.prototype)

console.log('String.prototype.__proto__ === Object.prototype: ', String.prototype.__proto__ === Object.prototype) //

console.log('"str".__proto__ === String.prototype: ', "str".__proto__ === String.prototype)

console.log('"str".__proto__.constructor === String: ', "str".__proto__.constructor === String)

console.log('"str".__proto__.__proto__ === Object.prototype: ', "str".__proto__.__proto__ === Object.prototype)

console.log('Function instanceof Object: ', Function instanceof Object)

console.log('Object instanceof Function: ', Object instanceof Function)