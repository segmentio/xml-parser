
var parse = require('..');
var should = require('should');

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

it('should support comments', function(){
  var node = parse('<!-- hello --><foo></foo><!-- world -->');
  node.root.should.eql({
    name: 'foo',
    attributes: {},
    children: [],
    content: ''
  });
})

it('should support tags', function(){
  var node = parse('<foo></foo>');
  node.root.should.eql({
    name: 'foo',
    attributes: {},
    children: [],
    content: ''
  });
})

it('should support tags with text', function(){
  var node = parse('<foo>hello world</foo>');
  node.root.should.eql({
    name: 'foo',
    attributes: {},
    children: [],
    content: 'hello world'
  });
})

it('should support weird whitespace', function(){
  var node = parse('<foo \n\n\nbar\n\n=   \nbaz>\n\nhello world</\n\nfoo>');
  node.root.should.eql({
    name: 'foo',
    attributes: { bar: 'baz' },
    children: [],
    content: 'hello world'
  });
})

it('should support tags with attributes', function(){
  var node = parse('<foo bar=baz some="stuff here" whatever=\'whoop\'></foo>');
  node.root.should.eql({
    name: 'foo',
    attributes: {
      bar: 'baz',
      some: 'stuff here',
      whatever: 'whoop'
    },
    children: [],
    content: ''
  });
})

it('should support nested tags', function(){
  var node = parse('<a><b><c>hello</c></b></a>');
  node.root.should.eql({
    "name": "a",
    "attributes": {},
    "children": [
      {
        "name": "b",
        "attributes": {},
        "children": [
          {
            "name": "c",
            "attributes": {},
            "children": [],
            "content": "hello"
          }
        ],
        "content": ""
      }
    ],
    "content": ""
  })
})

it('should support nested tags with text', function(){
  var node = parse('<a>foo <b>bar <c>baz</c></b></a>');
  node.root.should.eql({
    "name": "a",
    "attributes": {},
    "children": [
      {
        "name": "b",
        "attributes": {},
        "children": [
          {
            "name": "c",
            "attributes": {},
            "children": [],
            "content": "baz"
          }
        ],
        "content": "bar "
      }
    ],
    "content": "foo "
  })
})

it('should support self-closing tags', function () {
  var node = parse('<a><b>foo</b><b a="bar" /><b>bar</b></a>');
  node.root.should.eql({
    "name": "a",
    "attributes": {},
    "children": [
      {
        "name": "b",
        "attributes": {},
        "children": [],
        "content": "foo"
      },
      {
        "name": "b",
        "attributes": {
          "a": "bar"
        },
        "children": []
      },
      {
        "name": "b",
        "attributes": {},
        "children": [],
        "content": "bar"
      }
    ],
    "content": ""
  })
})

it('should support self-closing tags without attributes', function () {
  var node = parse('<a><b>foo</b><b /> <b>bar</b></a>');
  node.root.should.eql({
    "name": "a",
    "attributes": {},
    "children": [
      {
        "name": "b",
        "attributes": {},
        "children": [],
        "content": "foo"
      },
      {
        "name": "b",
        "attributes": {},
        "children": []
      },
      {
        "name": "b",
        "attributes": {},
        "children": [],
        "content": "bar"
      }
    ],
    "content": ""
  })
})

it('should support multi-line comments', function () {
  var node = parse('<a><!-- multi-line\n comment\n test -->foo</a>')
  node.root.should.eql({
    "name": "a",
    "attributes": {},
    "children": [],
    "content": "foo"
  })
})

it('should support attributes with a hyphen', function () {
  var node = parse('<a data-bar="baz">foo</a>')
  node.root.should.eql({
    name: "a",
    attributes: {
      "data-bar": "baz"
    },
    children: [],
    content: "foo"
  })
})

it('should support tags with a dot', function () {
    var node = parse('<root><c:Key.Columns><o:Column Ref="ol1"/></c:Key.Columns><c:Key.Columns><o:Column Ref="ol2"/></c:Key.Columns></root>');
    node.root.should.eql({
      name: "root",
      attributes: {},
      children: [{
        name: "c:Key.Columns",
        attributes: {},
        children: [{
          name: "o:Column",
          attributes: {
            Ref: "ol1"
          },
          children: []
        }],
        content: ""
      }, {
        name: "c:Key.Columns",
        attributes: {},
        children: [{
          name: "o:Column",
          attributes: {
            "Ref": "ol2"
          },
          children: []
        }],
        content: ""
      }],
      content: ""
    })
})