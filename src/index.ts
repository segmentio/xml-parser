export type XmlParserOptions = {
    /**
     * Returns false to exclude a node. Default is true.
     */
    filter?: (node: XmlParserNode) => boolean|any;
};

export type XmlParserNodeType = 'Comment'|'Text'|'ProcessingInstruction'|'Element'|'DocumentType'|'CDATA';

export type XmlParserNodeWrapper<T extends XmlParserNode> = {
    excluded: boolean;
    node: T;
}

export type XmlParserNode = {
    type: XmlParserNodeType;
}

export type XmlParserAttribute = {
    name: string;
    value: string;
}

export type XmlParserElementChildNode = XmlParserTextNode|XmlParserElementNode|XmlParserCDATANode|XmlParserCommentNode;
export type XmlParserDocumentChildNode = XmlParserDocumentTypeNode|XmlParserProcessingInstructionNode|XmlParserElementChildNode;

export type XmlParserProcessingInstructionNode = {
    type: 'ProcessingInstruction';
    name: string;
    attributes: Record<string, string>;
}


export type XmlParserElementNode = {
    type: 'Element';
    name: string;
    attributes: Record<string, string>;
    children: XmlParserElementChildNode[]|null;
}

export type XmlParserTextNode = {
    type: 'Text';
    content: string;
}

export type XmlParserCDATANode = {
    type: 'CDATA';
    content: string;
}

export type XmlParserCommentNode = {
    type: 'Comment';
    content: string;
}

export type XmlParserDocumentTypeNode = {
    type: 'DocumentType';
    content: string;
}

export type XmlParserResult = {
    declaration?: XmlParserProcessingInstructionNode|null;
    root: XmlParserElementNode;
    children: XmlParserDocumentChildNode[];
};

let parsingState: {
    xml: string;
    options: Required<XmlParserOptions>;
};

function nextChild() {
    return element(false) || text() || comment() || cdata();
}

function nextRootChild() {
    match(/\s*/);
    return element(true) || comment() || doctype() || processingInstruction(false);
}

function parseDocument(): XmlParserResult {
    const declaration = processingInstruction(true);
    const children = [];
    let documentRootNode;
    let child = nextRootChild();

    while (child) {
        if (child.node.type === 'Element') {
            if (documentRootNode) {
                throw new Error('Found multiple root nodes');
            }
            documentRootNode = child.node;
        }

        if (!child.excluded) {
            children.push(child.node);
        }

        child = nextRootChild();
    }

    if (!documentRootNode) {
        throw new Error('Failed to parse XML');
    }

    return {
        declaration: declaration ? declaration.node : null,
        root: documentRootNode,
        children
    };
}

function processingInstruction(matchDeclaration: boolean): XmlParserNodeWrapper<XmlParserProcessingInstructionNode>|undefined {
    const m = matchDeclaration ? match(/^<\?(xml)\s*/) : match(/^<\?([\w-:.]+)\s*/);
    if (!m) return;

    // tag
    const node: XmlParserProcessingInstructionNode = {
        name: m[1],
        type: 'ProcessingInstruction',
        attributes: {}
    };

    // attributes
    while (!(eos() || is('?>'))) {
        const attr = attribute();
        if (attr) {
            node.attributes[attr.name] = attr.value;
        } else {
            return;
        }
    }

    match(/\?>/);

    return {
        excluded: matchDeclaration ? false : parsingState.options.filter(node) === false,
        node
    };
}

function element(matchRoot: boolean): XmlParserNodeWrapper<XmlParserElementNode>|undefined {
    const m = match(/^<([\w-:.\u00C0-\u00FF]+)\s*/);
    if (!m) return;

    // name
    const node: XmlParserElementNode = {
        type: 'Element',
        name: m[1],
        attributes: {},
        children: []
    };

    const excluded = matchRoot ? false : parsingState.options.filter(node) === false;

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
        const attr = attribute();
        if (attr) {
            node.attributes[attr.name] = attr.value;
        } else {
            return;
        }
    }

    // self closing tag
    if (match(/^\s*\/>/)) {
        node.children = null;
        return {
            excluded,
            node
        };
    }

    match(/\??>/);

    if (!excluded) {
        // children
        let child = nextChild();
        while (child) {
            if (!child.excluded) {
                node.children!.push(child.node);
            }
            child = nextChild();
        }
    }

    // closing
    match(/^<\/[\w-:.]+>/);

    return {
        excluded,
        node
    };
}

function doctype(): XmlParserNodeWrapper<XmlParserDocumentTypeNode>|undefined {
    const m = match(/^<!DOCTYPE\s+[^>]*>/);
    if (m) {
        const node: XmlParserDocumentTypeNode = {
            type: 'DocumentType',
            content: m[0]
        };
        return {
            excluded: parsingState.options.filter(node) === false,
            node
        };
    }
}

function cdata(): XmlParserNodeWrapper<XmlParserCDATANode>|undefined {
    if (parsingState.xml.startsWith('<![CDATA[')) {
        const endPositionStart = parsingState.xml.indexOf(']]>');
        if (endPositionStart > -1) {
            const endPositionFinish  = endPositionStart + 3;
            const node: XmlParserCDATANode = {
                type: 'CDATA',
                content: parsingState.xml.substring(0, endPositionFinish)
            };
            parsingState.xml = parsingState.xml.slice(endPositionFinish);
            return {
                excluded: parsingState.options.filter(node) === false,
                node
            };
        }
    }
}

function comment(): XmlParserNodeWrapper<XmlParserCommentNode>|undefined {
    const m = match(/^<!--[\s\S]*?-->/);
    if (m) {
        const node: XmlParserCommentNode = {
            type: 'Comment',
            content: m[0]
        };
        return {
            excluded: parsingState.options.filter(node) === false,
            node
        };
    }
}

function text(): XmlParserNodeWrapper<XmlParserTextNode>|undefined {
    const m = match(/^([^<]+)/);
    if (m) {
        const node: XmlParserTextNode = {
            type: 'Text',
            content: m[1]
        };
        return {
            excluded: parsingState.options.filter(node) === false,
            node
        };
    }
}

function attribute(): XmlParserAttribute|undefined {
    const m = match(/([\w-:.\u00C0-\u00FF]+)\s*=\s*("[^"]*"|'[^']*'|[\w\u00C0-\u00FF]+)\s*/);
    if (m) {
        return {
            name: m[1],
            value: stripQuotes(m[2])
        };
    }
}

function stripQuotes(val: string): string {
    return val.replace(/^['"]|['"]$/g, '');
}

/**
 * Match `re` and advance the string.
 */
function match(re: RegExp): RegExpMatchArray|undefined {
    const m = parsingState.xml.match(re);
    if (m) {
        parsingState.xml = parsingState.xml.slice(m[0].length);
        return m;
    }
}

/**
 * End-of-source.
 */
function eos(): boolean {
    return 0 === parsingState.xml.length;
}

/**
 * Check for `prefix`.
 */
function is(prefix: string): boolean {
    return 0 === parsingState.xml.indexOf(prefix);
}

/**
 * Parse the given XML string into an object.
 */
function parseXml(xml: string, options: XmlParserOptions = {}): XmlParserResult {

    xml = xml.trim();

    const filter: XmlParserOptions['filter'] = options.filter || (() => true);

    parsingState = {
        xml,
        options: {
            ...options,
            filter
        }
    };

    return parseDocument();
}

export default parseXml;
