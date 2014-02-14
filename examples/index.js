
var path = process.argv[2];
if (!path) throw new Error('path required');

var fs = require('fs');
var parse = require('..');
var xml = fs.readFileSync(path, 'utf8');
var inspect = require('util').inspect;

var obj = parse(xml);
console.log(inspect(obj, { colors: true, depth: Infinity }));