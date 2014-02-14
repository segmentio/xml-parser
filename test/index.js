
var parse = require('..');

it('should support blank strings', function(){
  var node = parse('');
  node.should.eql({ declaration: null, root: null });
})

it('should support declarations', function(){
  var node = parse('<?xml version="1.0" ?>');
  node.should.eql({
    declaration: {
      attributes: {
        version: '1.0'
      }
    },
    root: undefined
  })
})