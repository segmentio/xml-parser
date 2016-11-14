
/**
 * Module dependencies.
 */

var debug = require('debug')('xml-parser');

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @param {Object} [options]
 *  @config {Boolean} [trim=true]
 *  @config {Boolean} [stripComments=true]
 * @return {Object}
 * @api public
 */

function parse(xml, options) {

  // trim content
  if (!options || options.trim) {
    xml = xml.trim();
  }

  // strip comments
  if (!options || options.stripComments) {
    xml = xml.replace(/<!--[\s\S]*?-->/g, '');
  }

  return document();

  /**
   * XML document.
   */

  function document() {

    var decl = declaration();
    var child;
    var children = [];
    var documentRootNode;

    while (child = nextRootChild()) {
      if (child.name !== '#comment') {
        if (documentRootNode) {
          throw new Error('Found multiple root nodes');
        }
        documentRootNode = child;
      }
      children.push(child);
    }

    return {
      declaration: decl,
      root: documentRootNode,
      children: children
    };
  }

  /**
   * Declaration.
   */

  function declaration() {
    var m = match(/^<\?xml\s*/);
    if (!m) return;

    // tag
    var node = {
      attributes: {}
    };

    // attributes
    while (!(eos() || is('?>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    match(/\?>\s*/);

    return node;
  }

  /**
   * Tag.
   */

  function tag() {
    debug('tag %j', xml);
    var m = match(/^<([\w-:.]+)\s*/);
    if (!m) return;

    // name
    var node = {
      name: m[1],
      attributes: {},
      children: []
    };

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>/)) {
      node.children = null;
      return node;
    }

    match(/\??>/);

    // children
    var child;
    while (child = nextChild()) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w-:.]+>/);

    return node;
  }

  function nextChild() {
    return tag() || content() || comment();
  }

  function nextRootChild() {
    return tag() || comment();
  }

  function comment() {
    var m = match(/^<!--[\s\S]*?-->/);
    if (m) {
      return {
        name: '#comment',
        content: m[0]
      };
    }
  }

  /**
   * Text content.
   */

  function content() {
    debug('content %j', xml);
    var m = match(/^([^<]+)/);
    if (m) {
      return {
        name: '#text',
        content: m[1]
      };
    }
  }

  /**
   * Attribute.
   */

  function attribute() {
    debug('attribute %j', xml);
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) }
  }

  /**
   * Strip quotes from `val`.
   */

  function strip(val) {
    return val.replace(/^['"]|['"]$/g, '');
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re) {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos() {
    return 0 == xml.length;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix) {
    return 0 == xml.indexOf(prefix);
  }
}
