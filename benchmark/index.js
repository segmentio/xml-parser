
var fs = require('fs');
var parse = require('..');

var large = fs.readFileSync('examples/page.xml', 'utf8');
var small = fs.readFileSync('examples/developerforce.xml', 'utf8');

suite('parse', function(){
  bench('small', function(){
    parse(small)
  })

  bench('large', function(){
    parse(large)
  })
})
