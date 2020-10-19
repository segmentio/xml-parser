const assert = require('chai').assert;
const parse = require('../index');

describe('XML Parser', function() {

    it('should fail to parse blank strings', function() {
        try {
            parse('');
            assert.fail('Should fail');
        } catch(err) {
            assert.equal(err.message, 'Failed to parse XML');
        }
    });

    it('should support declarations', function() {
        const node = parse('<?xml version="1.0" ?><foo></foo>');

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0'
                }
            },
            root: root,
            children: [root]
        });
    });

    it('should support comments', function() {
        const node = parse('<!-- hello --><foo><!-- content --> hey</foo><!-- world -->', {stripComments: false});

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: [
                {type: 'Comment', content: '<!-- content -->'},
                {type: 'Text', content: ' hey'},

            ]
        };

        assert.deepEqual(node, {
            declaration: null,
            root: root,
            children: [
                {type: 'Comment', content: '<!-- hello -->'},
                root,
                {type: 'Comment', content: '<!-- world -->'}
            ]
        });
    });

    it('should support tags without text', function() {
        const node = parse('<foo></foo>');

        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        });
    });

    it('should support tags with text', function() {
        const node = parse('<foo>hello world</foo>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: [
                {type: 'Text', content: 'hello world'}
            ]
        });
    });

    it('should support weird whitespace', function() {
        const node = parse('<foo \n\n\nbar\n\n=   \nbaz>\n\nhello world</\n\nfoo>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'foo',
            attributes: {bar: 'baz'},
            children: [
                {type: 'Text', content: '\n\nhello world'}
            ]
        });
    });

    it('should support tags with attributes', function() {
        const node = parse('<foo bar=baz some="stuff here" whatever=\'whoop\'></foo>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'foo',
            attributes: {
                bar: 'baz',
                some: 'stuff here',
                whatever: 'whoop'
            },
            children: []
        });
    });

    it('should support nested tags', function() {
        const node = parse('<a><b><c>hello</c></b></a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {},
            children: [
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [
                        {
                            type: 'Element',
                            name: 'c',
                            attributes: {},
                            children: [{type: 'Text', content: 'hello'}]
                        }
                    ]
                }
            ]
        });
    });

    it('should support nested tags with text', function() {
        const node = parse('<a>foo <b>bar <c>baz</c> bad</b></a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {},
            children: [
                {type: 'Text', content: 'foo '},
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [
                        {type: 'Text', content: 'bar '},
                        {
                            type: 'Element',
                            name: 'c',
                            attributes: {},
                            children: [{type: 'Text', content: 'baz'}]
                        },
                        {type: 'Text', content: ' bad'}
                    ]
                }
            ]
        });
    });

    it('should support self-closing tags', function() {
        const node = parse('<a><b>foo</b><b a="bar" /><b>bar</b></a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {},
            children: [
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [{type: 'Text', content: 'foo'}]
                },
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {
                        'a': 'bar'
                    },
                    children: null
                },
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [{type: 'Text', content: 'bar'}]
                }
            ]
        });
    });

    it('should support self-closing tags without attributes', function() {
        const node = parse('<a><b>foo</b><b /> <b>bar</b></a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {},
            children: [
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [{type: 'Text', content: 'foo'}]
                },
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: null
                },
                {type: 'Text', content: ' '},
                {
                    type: 'Element',
                    name: 'b',
                    attributes: {},
                    children: [{type: 'Text', content: 'bar'}]
                }
            ]
        });
    });

    it('should support multi-line comments', function() {
        const node = parse('<a><!-- multi-line\n comment\n test -->foo</a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {},
            children: [
                {
                    'content': '<!-- multi-line\n comment\n test -->',
                    'type': 'Comment'
                },
                {type: 'Text', content: 'foo'}
            ]
        });
    });

    it('should support attributes with a hyphen', function() {
        const node = parse('<a data-bar="baz">foo</a>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'a',
            attributes: {
                'data-bar': 'baz'
            },
            children: [{type: 'Text', content: 'foo'}]
        });
    });

    it('should support tags with a dot', function() {
        const node = parse('<root><c:Key.Columns><o:Column Ref="ol1"/></c:Key.Columns><c:Key.Columns><o:Column Ref="ol2"/></c:Key.Columns></root>');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'root',
            attributes: {},
            children: [{
                type: 'Element',
                name: 'c:Key.Columns',
                attributes: {},
                children: [{
                    type: 'Element',
                    name: 'o:Column',
                    attributes: {
                        'Ref': 'ol1'
                    },
                    children: null
                }]
            }, {
                type: 'Element',
                name: 'c:Key.Columns',
                attributes: {},
                children: [{
                    type: 'Element',
                    name: 'o:Column',
                    attributes: {
                        'Ref': 'ol2'
                    },
                    children: null
                }]
            }]
        });
    });

    it('should support tags with hyphen', function() {
        const node = parse(
            '<root>' +
            '<data-field1>val1</data-field1>' +
            '<data-field2>val2</data-field2>' +
            '</root>'
        );
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'root',
            attributes: {},
            children: [
                {
                    type: 'Element',
                    name: 'data-field1',
                    attributes: {},
                    children: [{type: 'Text', content: 'val1'}]
                },
                {
                    type: 'Element',
                    name: 'data-field2',
                    attributes: {},
                    children: [{type: 'Text', content: 'val2'}]
                }
            ]
        });
    });


    it('should trim the input', function() {
        const node = parse('   <foo></foo>   ');
        assert.deepEqual(node.root, {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        });
    });


    it('should support CDATA elements', function() {
        const node = parse('<?xml version="1.0" ?><foo><![CDATA[some text]]> hello <![CDATA[some more text]]></foo>');

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: [
                {type: 'CDATA', content: '<![CDATA[some text]]>'},
                {type: 'Text', content: ' hello '},
                {type: 'CDATA', content: '<![CDATA[some more text]]>'},
            ]
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0'
                }
            },
            root: root,
            children: [root]
        });
    });

    it('should support CDATA elements with XML content', function() {
        const node = parse('<?xml version="1.0" ?><foo><![CDATA[<baz/>]]> hello</foo>');

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: [
                {type: 'CDATA', content: '<![CDATA[<baz/>]]>'},
                {type: 'Text', content: ' hello'}
            ]
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0'
                }
            },
            root: root,
            children: [root]
        });
    });

    it('should support DOCTYPE', function() {
        const node = parse('<?xml version="1.0" ?>\n<!DOCTYPE foo SYSTEM "foo.dtd">\n<foo></foo>');

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0'
                }
            },
            root: root,
            children: [
                {type: 'DocumentType', content: '<!DOCTYPE foo SYSTEM "foo.dtd">'},
                root
            ]
        });
    });

    it('should support processing instructions', function() {
        const node = parse('<?xml version="1.0" ?><?xml-stylesheet href="style.xsl" type="text/xsl" ?><foo></foo>');

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0'
                }
            },
            root: root,
            children: [
                {
                    name: 'xml-stylesheet',
                    type: 'ProcessingInstruction',
                    attributes: {
                        href: 'style.xsl',
                        type: 'text/xsl'
                    }
                },
                root
            ]
        });
    });

    it('should support complex XML', function() {
        const node = parse(`<?xml version="1.0" encoding="utf-8"?>
<!-- Load the stylesheet -->
<?xml-stylesheet href="foo.xsl" type="text/xsl" ?>
<!DOCTYPE foo SYSTEM "foo.dtd">
<foo>
<![CDATA[some text]]> and <bar>some more</bar>
</foo>`);

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: [
                {type: 'Text', content: '\n'},
                {type: 'CDATA', content: '<![CDATA[some text]]>'},
                {type: 'Text', content: ' and '},
                {
                    type: 'Element',
                    name: 'bar',
                    attributes: {},
                    children: [
                        {type: 'Text', content: 'some more'}
                    ]
                },
                {type: 'Text', content: '\n'}
            ]
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0',
                    encoding: 'utf-8'
                }
            },
            root: root,
            children: [
                {type: 'Comment', content: '<!-- Load the stylesheet -->'},
                {
                    name: 'xml-stylesheet',
                    type: 'ProcessingInstruction',
                    attributes: {
                        href: 'foo.xsl',
                        type: 'text/xsl'
                    }
                },
                {type: 'DocumentType', content: '<!DOCTYPE foo SYSTEM "foo.dtd">'},
                root
            ]
        });
    });

    it('should parse by filtering all nodes', function() {

        const node = parse(`<?xml version="1.0" encoding="utf-8"?>
<!-- Load the stylesheet -->
<?xml-stylesheet href="foo.xsl" type="text/xsl" ?>
<!DOCTYPE foo SYSTEM "foo.dtd">
<foo>
<![CDATA[some text]]> and <bar>some more</bar>
</foo>`, {
            filter: () => false
        });

        const root = {
            type: 'Element',
            name: 'foo',
            attributes: {},
            children: []
        };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0',
                    encoding: 'utf-8'
                }
            },
            root: root,
            children: [
                root
            ]
        });
    });

    it('should parse by filtering some nodes', function() {

        const node = parse(`<?xml version="1.0" encoding="utf-8"?>
<!-- Load the stylesheet -->
<?xml-stylesheet href="foo.xsl" type="text/xsl" ?>
<!DOCTYPE foo SYSTEM "foo.dtd">
<foo>
<![CDATA[some text]]> and <bar>some more</bar>
</foo>`, {
            filter: (node) => {
                return !['Comment', 'CDATA'].includes(node.type);
            }
        });

    const root = {
        type: 'Element',
        name: 'foo',
        attributes: {},
        children: [
            {type: 'Text', content: '\n'},
            {type: 'Text', content: ' and '},
            {
                type: 'Element',
                name: 'bar',
                attributes: {},
                children: [
                    {type: 'Text', content: 'some more'}
                ]
            },
            {type: 'Text', content: '\n'}
        ]
    };

        assert.deepEqual(node, {
            declaration: {
                name: 'xml',
                type: 'ProcessingInstruction',
                attributes: {
                    version: '1.0',
                    encoding: 'utf-8'
                }
            },
            root: root,
            children: [
                {
                    name: 'xml-stylesheet',
                    type: 'ProcessingInstruction',
                    attributes: {
                        href: 'foo.xsl',
                        type: 'text/xsl'
                    }
                },
                {type: 'DocumentType', content: '<!DOCTYPE foo SYSTEM "foo.dtd">'},
                root
            ]
        });
    });

});