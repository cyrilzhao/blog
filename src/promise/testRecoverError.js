var p = new Promise(function(resolve,reject){
    reject(new Error('pebkac'));
});

p.then(
    undefined,
    function(error){}
).then(
    function(str){
      console.log('I am saved!');
    },
    function(error){
      console.log('Bad computer!');
    }
);