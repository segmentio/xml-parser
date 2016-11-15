
# xml-parser-xo

  XML parser based on [xml-parser](https://www.npmjs.com/package/xml-parser) with eXtra Options (XO).
  
  [![Travis CI status](https://travis-ci.org/chrisbottin/xml-parser.svg?branch=xml-parser-xo)](https://travis-ci.org/chrisbottin/xml-parser)
  
  [![NPM](https://nodei.co/npm/xml-parser-xo.png?downloads=true)](https://nodei.co/npm/xml-parser-xo/)

## Installation

```
$ npm install xml-parser-xo
```

## Example

 JavaScript:

```js
var fs = require('fs');
var parse = require('xml-parser-xo');
var xml = fs.readFileSync('examples/developerforce.xml', 'utf8');
var inspect = require('util').inspect;

var obj = parse(xml);
console.log(inspect(obj, { colors: true, depth: Infinity }));
```

XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
 <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
   xmlns="urn:enterprise.soap.sforce.com">
   <soapenv:Body>
      <createResponse>
         <result>
            <id>003D000000OY9omIAD</id>
            <success>true</success>
         </result>
         <result>
            <id>001D000000HTK3aIAH</id>
            <success>true</success>
         </result>
      </createResponse>
   </soapenv:Body>
 </soapenv:Envelope>
```

Yields:

```js
{ declaration: { attributes: { version: '1.0', encoding: 'utf-8' } },
  root:
   { name: 'soapenv:Envelope',
     attributes:
      { 'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        xmlns: 'urn:enterprise.soap.sforce.com' },
     children:
      [ { name: 'soapenv:Body',
          attributes: {},
          children:
           [ { name: 'createResponse',
               attributes: {},
               children:
                [ { name: 'result',
                    attributes: {},
                    children:
                     [ { name: 'id',
                         attributes: {},
                         children: [{name: '#text', content: '003D000000OY9omIAD'}]
                       { name: 'success', attributes: {}, children: [{name: '#text', content: 'true'}] } ],
                  },
                  { name: 'result',
                    attributes: {},
                    children:
                     [ { name: 'id',
                         attributes: {},
                         children: [{name: '#text', content: '001D000000HTK3aIAH'}]
                       { name: 'success', attributes: {}, children: [{name: '#text', content: 'true'}] } ],
                  } ],
                } ],
          } ],
     } }
```

## Options

 JavaScript:
 
```js
var inspect = require('util').inspect;
var parse = require('xml-parser-xo');
var options = {trim: false, stripComments: false};

var obj = parse(xml, options);
console.log(inspect(obj, { colors: true, depth: Infinity }));
```

- `trim` (Boolean, default=true) Set to true to trim the input before parsing it.
- `stripComments` (Boolean, default=true) Set to true to strip the comments when parsing.


# License

  MIT