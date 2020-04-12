
var parse = require('..');
var assert = require('chai').assert;

it('should support blank strings', function(){
  var node = parse('');
  assert.deepEqual(node, {
    declaration: undefined,
    root: undefined,
    children: []
  });
});

it('should support declarations', function(){
  var node = parse('<?xml version="1.0" ?>');
  assert.deepEqual(node, {
    declaration: {
      attributes: {
        version: '1.0'
      }
    },
    root: undefined,
    children: []
  });
});

it('should strip comments when option is not specified', function(){
  var node = parse('<!-- hello --><foo></foo><!-- world -->');

  var root = {
    name: 'foo',
    attributes: {},
    children: []
  };

  assert.deepEqual(node, {
    declaration: undefined,
    root: root,
    children: [root]
  });
});

it('should strip comments when option is true', function(){
  var node = parse('<!-- hello --><foo></foo><!-- world -->', {stripComments: true});

  var root = {
    name: 'foo',
    attributes: {},
    children: []
  };

  assert.deepEqual(node, {
    declaration: undefined,
    root: root,
    children: [root]
  });
});

it('should not strip comments when option is false', function(){
  var node = parse('<!-- hello --><foo></foo><!-- world -->', {stripComments: false});

  var root = {
    name: 'foo',
    attributes: {},
    children: []
  };

  assert.deepEqual(node, {
    declaration: undefined,
    root: root,
    children: [
      {name: '#comment', content: '<!-- hello -->'},
      root,
      {name: '#comment', content: '<!-- world -->'}
    ]
  });
});

it('should support tags without text', function(){
  var node = parse('<foo></foo>');

  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: {},
    children: []
  });
});

it('should support tags with text', function(){
  var node = parse('<foo>hello world</foo>');
  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: {},
    children: [
        {name: '#text', content: 'hello world'}
    ]
  });
});

it('should support weird whitespace', function(){
  var node = parse('<foo \n\n\nbar\n\n=   \nbaz>\n\nhello world</\n\nfoo>');
  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: { bar: 'baz' },
    children: [
        {name: '#text', content: '\n\nhello world'}
    ]
  });
});

it('should support tags with attributes', function(){
  var node = parse('<foo bar=baz some="stuff here" whatever=\'whoop\'></foo>');
  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: {
      bar: 'baz',
      some: 'stuff here',
      whatever: 'whoop'
    },
    children: []
  });
});

it('should support nested tags', function(){
  var node = parse('<a><b><c>hello</c></b></a>');
  assert.deepEqual(node.root, {
    name: 'a',
    attributes: {},
    children: [
      {
        name: 'b',
        attributes: {},
        children: [
          {
            name: 'c',
            attributes: {},
            children: [{name: '#text', content: 'hello'}]
          }
        ]
      }
    ]
  });
});

it('should support nested tags with text', function(){
  var node = parse('<a>foo <b>bar <c>baz</c> bad</b></a>');
  assert.deepEqual(node.root, {
    name: 'a',
    attributes: {},
    children: [
      {name: '#text', content: 'foo '},
      {
        name: 'b',
        attributes: {},
        children: [
          {name: '#text', content: 'bar '},
          {
            name: 'c',
            attributes: {},
            children: [{name: '#text', content: 'baz'}]
          },
          {name: '#text', content: ' bad'}
        ]
      }
    ]
  });
});

it('should support self-closing tags', function () {
  var node = parse('<a><b>foo</b><b a="bar" /><b>bar</b></a>');
  assert.deepEqual(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [{name: '#text', content: 'foo'}]
      },
      {
        name: "b",
        attributes: {
          "a": "bar"
        },
        children: null
      },
      {
        name: "b",
        attributes: {},
        children: [{name: '#text', content: 'bar'}]
      }
    ]
  });
});

it('should support self-closing tags without attributes', function () {
  var node = parse('<a><b>foo</b><b /> <b>bar</b></a>');
  assert.deepEqual(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [{name: '#text', content: 'foo'}]
      },
      {
        name: "b",
        attributes: {},
        children: null
      },
      {name: '#text', content: ' '},
      {
        name: "b",
        attributes: {},
        children: [{name: '#text', content: 'bar'}]
      }
    ]
  });
});

it('should support multi-line comments', function () {
  var node = parse('<a><!-- multi-line\n comment\n test -->foo</a>');
  assert.deepEqual(node.root, {
    name: "a",
    attributes: {},
    children: [{name: '#text', content: 'foo'}]
  });
});

it('should support attributes with a hyphen', function () {
  var node = parse('<a data-bar="baz">foo</a>');
  assert.deepEqual(node.root, {
    name: "a",
    attributes: {
      'data-bar': "baz"
    },
    children: [{name: '#text', content: 'foo'}]
  });
});

it('should support tags with a dot', function () {
  var node = parse('<root><c:Key.Columns><o:Column Ref="ol1"/></c:Key.Columns><c:Key.Columns><o:Column Ref="ol2"/></c:Key.Columns></root>');
  assert.deepEqual(node.root, {
    name: 'root',
    attributes: {},
    children: [{
      name: 'c:Key.Columns',
      attributes: {},
      children: [{
        name: 'o:Column',
        attributes: {
          'Ref': 'ol1'
        },
        children: null
      }]
    }, {
      name: 'c:Key.Columns',
      attributes: {},
      children: [{
        name: 'o:Column',
        attributes: {
          'Ref': 'ol2'
        },
        children: null
      }]
    }]
  });
});

it('should support tags with hyphen', function () {
  var node = parse(
    '<root>' +
      '<data-field1>val1</data-field1>' +
      '<data-field2>val2</data-field2>' +
    '</root>'
  );
  assert.deepEqual(node.root, {
    name: 'root',
    attributes: {},
    children: [
      {
        name: 'data-field1',
        attributes: {},
        children: [{name: '#text', content: 'val1'}]
      },
      {
        name: 'data-field2',
        attributes: {},
        children: [{name: '#text', content: 'val2'}]
      }
    ]
  });
});


it('should trim the input when option is not specified', function(){
  var node = parse('   <foo></foo>   ');
  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: {},
    children: []
  });
});


it('should trim the input when option is true', function(){
  var node = parse('   <foo></foo>   ', {trim: true});
  assert.deepEqual(node.root, {
    name: 'foo',
    attributes: {},
    children: []
  });
});


it('should not trim the input when option is false', function(){
  var node = parse('   <foo></foo>   ', {trim: false});
  assert.deepEqual(node, {declaration: undefined, root: undefined, children: []});
});
