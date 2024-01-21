/* PrismJS 1.19.0
https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript+bash+c+cpp+coffeescript+crystal+d+dart+django+elixir+erlang+go+groovy+java+json+julia+kotlin+lua+markup-templating+matlab+nginx+nim+perl+php+python+jsx+ruby+rust+scss+shell-session+sql+typescript+yaml */
var _self = (typeof window !== 'undefined')
  ? window   // if in browser
  : (
    (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    ? self // if in worker
    : {}   // if in node js
  );

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function (_self){

// Private helper vars
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;


var _ = {
  manual: _self.Prism && _self.Prism.manual,
  disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
  util: {
    encode: function (tokens) {
      if (tokens instanceof Token) {
        return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
      } else if (Array.isArray(tokens)) {
        return tokens.map(_.util.encode);
      } else {
        return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
      }
    },

    type: function (o) {
      return Object.prototype.toString.call(o).slice(8, -1);
    },

    objId: function (obj) {
      if (!obj['__id']) {
        Object.defineProperty(obj, '__id', { value: ++uniqueId });
      }
      return obj['__id'];
    },

    // Deep clone a language definition (e.g. to extend it)
    clone: function deepClone(o, visited) {
      var clone, id, type = _.util.type(o);
      visited = visited || {};

      switch (type) {
        case 'Object':
          id = _.util.objId(o);
          if (visited[id]) {
            return visited[id];
          }
          clone = {};
          visited[id] = clone;

          for (var key in o) {
            if (o.hasOwnProperty(key)) {
              clone[key] = deepClone(o[key], visited);
            }
          }

          return clone;

        case 'Array':
          id = _.util.objId(o);
          if (visited[id]) {
            return visited[id];
          }
          clone = [];
          visited[id] = clone;

          o.forEach(function (v, i) {
            clone[i] = deepClone(v, visited);
          });

          return clone;

        default:
          return o;
      }
    },

    /**
     * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
     *
     * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
     *
     * @param {Element} element
     * @returns {string}
     */
    getLanguage: function (element) {
      while (element && !lang.test(element.className)) {
        element = element.parentElement;
      }
      if (element) {
        return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
      }
      return 'none';
    },

    /**
     * Returns the script element that is currently executing.
     *
     * This does __not__ work for line script element.
     *
     * @returns {HTMLScriptElement | null}
     */
    currentScript: function () {
      if (typeof document === 'undefined') {
        return null;
      }
      if ('currentScript' in document) {
        return document.currentScript;
      }

      // IE11 workaround
      // we'll get the src of the current script by parsing IE11's error stack trace
      // this will not work for inline scripts

      try {
        throw new Error();
      } catch (err) {
        // Get file src url from stack. Specifically works with the format of stack traces in IE.
        // A stack will look like this:
        //
        // Error
        //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
        //    at Global code (http://localhost/components/prism-core.js:606:1)

        var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
        if (src) {
          var scripts = document.getElementsByTagName('script');
          for (var i in scripts) {
            if (scripts[i].src == src) {
              return scripts[i];
            }
          }
        }
        return null;
      }
    }
  },

  languages: {
    extend: function (id, redef) {
      var lang = _.util.clone(_.languages[id]);

      for (var key in redef) {
        lang[key] = redef[key];
      }

      return lang;
    },

    /**
     * Insert a token before another token in a language literal
     * As this needs to recreate the object (we cannot actually insert before keys in object literals),
     * we cannot just provide an object, we need an object and a key.
     * @param inside The key (or language id) of the parent
     * @param before The key to insert before.
     * @param insert Object with the key/value pairs to insert
     * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
     */
    insertBefore: function (inside, before, insert, root) {
      root = root || _.languages;
      var grammar = root[inside];
      var ret = {};

      for (var token in grammar) {
        if (grammar.hasOwnProperty(token)) {

          if (token == before) {
            for (var newToken in insert) {
              if (insert.hasOwnProperty(newToken)) {
                ret[newToken] = insert[newToken];
              }
            }
          }

          // Do not insert token which also occur in insert. See #1525
          if (!insert.hasOwnProperty(token)) {
            ret[token] = grammar[token];
          }
        }
      }

      var old = root[inside];
      root[inside] = ret;

      // Update references in other language definitions
      _.languages.DFS(_.languages, function(key, value) {
        if (value === old && key != inside) {
          this[key] = ret;
        }
      });

      return ret;
    },

    // Traverse a language definition with Depth First Search
    DFS: function DFS(o, callback, type, visited) {
      visited = visited || {};

      var objId = _.util.objId;

      for (var i in o) {
        if (o.hasOwnProperty(i)) {
          callback.call(o, i, o[i], type || i);

          var property = o[i],
              propertyType = _.util.type(property);

          if (propertyType === 'Object' && !visited[objId(property)]) {
            visited[objId(property)] = true;
            DFS(property, callback, null, visited);
          }
          else if (propertyType === 'Array' && !visited[objId(property)]) {
            visited[objId(property)] = true;
            DFS(property, callback, i, visited);
          }
        }
      }
    }
  },
  plugins: {},

  highlightAll: function(async, callback) {
    _.highlightAllUnder(document, async, callback);
  },

  highlightAllUnder: function(container, async, callback) {
    var env = {
      callback: callback,
      container: container,
      selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    };

    _.hooks.run('before-highlightall', env);

    env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    _.hooks.run('before-all-elements-highlight', env);

    for (var i = 0, element; element = env.elements[i++];) {
      _.highlightElement(element, async === true, env.callback);
    }
  },

  highlightElement: function(element, async, callback) {
    // Find language
    var language = _.util.getLanguage(element);
    var grammar = _.languages[language];

    // Set language on the element, if not present
    element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

    // Set language on the parent, for styling
    var parent = element.parentNode;
    if (parent && parent.nodeName.toLowerCase() === 'pre') {
      parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
    }

    var code = element.textContent;

    var env = {
      element: element,
      language: language,
      grammar: grammar,
      code: code
    };

    function insertHighlightedCode(highlightedCode) {
      env.highlightedCode = highlightedCode;

      _.hooks.run('before-insert', env);

      env.element.innerHTML = env.highlightedCode;

      _.hooks.run('after-highlight', env);
      _.hooks.run('complete', env);
      callback && callback.call(env.element);
    }

    _.hooks.run('before-sanity-check', env);

    if (!env.code) {
      _.hooks.run('complete', env);
      callback && callback.call(env.element);
      return;
    }

    _.hooks.run('before-highlight', env);

    if (!env.grammar) {
      insertHighlightedCode(_.util.encode(env.code));
      return;
    }

    if (async && _self.Worker) {
      var worker = new Worker(_.filename);

      worker.onmessage = function(evt) {
        insertHighlightedCode(evt.data);
      };

      worker.postMessage(JSON.stringify({
        language: env.language,
        code: env.code,
        immediateClose: true
      }));
    }
    else {
      insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    }
  },

  highlight: function (text, grammar, language) {
    var env = {
      code: text,
      grammar: grammar,
      language: language
    };
    _.hooks.run('before-tokenize', env);
    env.tokens = _.tokenize(env.code, env.grammar);
    _.hooks.run('after-tokenize', env);
    return Token.stringify(_.util.encode(env.tokens), env.language);
  },

  matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
    for (var token in grammar) {
      if (!grammar.hasOwnProperty(token) || !grammar[token]) {
        continue;
      }

      var patterns = grammar[token];
      patterns = Array.isArray(patterns) ? patterns : [patterns];

      for (var j = 0; j < patterns.length; ++j) {
        if (target && target == token + ',' + j) {
          return;
        }

        var pattern = patterns[j],
          inside = pattern.inside,
          lookbehind = !!pattern.lookbehind,
          greedy = !!pattern.greedy,
          lookbehindLength = 0,
          alias = pattern.alias;

        if (greedy && !pattern.pattern.global) {
          // Without the global flag, lastIndex won't work
          var flags = pattern.pattern.toString().match(/[imsuy]*$/)[0];
          pattern.pattern = RegExp(pattern.pattern.source, flags + 'g');
        }

        pattern = pattern.pattern || pattern;

        // Don’t cache length as it changes during the loop
        for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

          var str = strarr[i];

          if (strarr.length > text.length) {
            // Something went terribly wrong, ABORT, ABORT!
            return;
          }

          if (str instanceof Token) {
            continue;
          }

          if (greedy && i != strarr.length - 1) {
            pattern.lastIndex = pos;
            var match = pattern.exec(text);
            if (!match) {
              break;
            }

            var from = match.index + (lookbehind && match[1] ? match[1].length : 0),
                to = match.index + match[0].length,
                k = i,
                p = pos;

            for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
              p += strarr[k].length;
              // Move the index i to the element in strarr that is closest to from
              if (from >= p) {
                ++i;
                pos = p;
              }
            }

            // If strarr[i] is a Token, then the match starts inside another Token, which is invalid
            if (strarr[i] instanceof Token) {
              continue;
            }

            // Number of tokens to delete and replace with the new match
            delNum = k - i;
            str = text.slice(pos, p);
            match.index -= pos;
          } else {
            pattern.lastIndex = 0;

            var match = pattern.exec(str),
              delNum = 1;
          }

          if (!match) {
            if (oneshot) {
              break;
            }

            continue;
          }

          if(lookbehind) {
            lookbehindLength = match[1] ? match[1].length : 0;
          }

          var from = match.index + lookbehindLength,
              match = match[0].slice(lookbehindLength),
              to = from + match.length,
              before = str.slice(0, from),
              after = str.slice(to);

          var args = [i, delNum];

          if (before) {
            ++i;
            pos += before.length;
            args.push(before);
          }

          var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

          args.push(wrapped);

          if (after) {
            args.push(after);
          }

          Array.prototype.splice.apply(strarr, args);

          if (delNum != 1)
            _.matchGrammar(text, strarr, grammar, i, pos, true, token + ',' + j);

          if (oneshot)
            break;
        }
      }
    }
  },

  tokenize: function(text, grammar) {
    var strarr = [text];

    var rest = grammar.rest;

    if (rest) {
      for (var token in rest) {
        grammar[token] = rest[token];
      }

      delete grammar.rest;
    }

    _.matchGrammar(text, strarr, grammar, 0, 0, false);

    return strarr;
  },

  hooks: {
    all: {},

    add: function (name, callback) {
      var hooks = _.hooks.all;

      hooks[name] = hooks[name] || [];

      hooks[name].push(callback);
    },

    run: function (name, env) {
      var callbacks = _.hooks.all[name];

      if (!callbacks || !callbacks.length) {
        return;
      }

      for (var i=0, callback; callback = callbacks[i++];) {
        callback(env);
      }
    }
  },

  Token: Token
};

_self.Prism = _;

function Token(type, content, alias, matchedStr, greedy) {
  this.type = type;
  this.content = content;
  this.alias = alias;
  // Copy of the full string this token was created from
  this.length = (matchedStr || '').length|0;
  this.greedy = !!greedy;
}

Token.stringify = function(o, language) {
  if (typeof o == 'string') {
    return o;
  }

  if (Array.isArray(o)) {
    return o.map(function(element) {
      return Token.stringify(element, language);
    }).join('');
  }

  var env = {
    type: o.type,
    content: Token.stringify(o.content, language),
    tag: 'span',
    classes: ['token', o.type],
    attributes: {},
    language: language
  };

  if (o.alias) {
    var aliases = Array.isArray(o.alias) ? o.alias : [o.alias];
    Array.prototype.push.apply(env.classes, aliases);
  }

  _.hooks.run('wrap', env);

  var attributes = Object.keys(env.attributes).map(function(name) {
    return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
  }).join(' ');

  return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';
};

if (!_self.document) {
  if (!_self.addEventListener) {
    // in Node.js
    return _;
  }

  if (!_.disableWorkerMessageHandler) {
    // In worker
    _self.addEventListener('message', function (evt) {
      var message = JSON.parse(evt.data),
        lang = message.language,
        code = message.code,
        immediateClose = message.immediateClose;

      _self.postMessage(_.highlight(code, _.languages[lang], lang));
      if (immediateClose) {
        _self.close();
      }
    }, false);
  }

  return _;
}

//Get current script and highlight
var script = _.util.currentScript();

if (script) {
  _.filename = script.src;

  if (script.hasAttribute('data-manual')) {
    _.manual = true;
  }
}

if (!_.manual) {
  function highlightAutomaticallyCallback() {
    if (!_.manual) {
      _.highlightAll();
    }
  }

  // If the document state is "loading", then we'll use DOMContentLoaded.
  // If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
  // DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
  // might take longer one animation frame to execute which can create a race condition where only some plugins have
  // been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
  // See https://github.com/PrismJS/prism/issues/2102
  var readyState = document.readyState;
  if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
  } else {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(highlightAutomaticallyCallback);
    } else {
      window.setTimeout(highlightAutomaticallyCallback, 16);
    }
  }
}

return _;

})(_self);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
  global.Prism = Prism;
}
;
Prism.languages.markup = {
  'comment': /<!--[\s\S]*?-->/,
  'prolog': /<\?[\s\S]+?\?>/,
  'doctype': {
    pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:(?!<!--)[^"'\]]|"[^"]*"|'[^']*'|<!--[\s\S]*?-->)*\]\s*)?>/i,
    greedy: true
  },
  'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
  'tag': {
    pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
    greedy: true,
    inside: {
      'tag': {
        pattern: /^<\/?[^\s>\/]+/i,
        inside: {
          'punctuation': /^<\/?/,
          'namespace': /^[^\s>\/:]+:/
        }
      },
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
        inside: {
          'punctuation': [
            /^=/,
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: true
            }
          ]
        }
      },
      'punctuation': /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          'namespace': /^[^\s>\/:]+:/
        }
      }

    }
  },
  'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
  Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

  if (env.type === 'entity') {
    env.attributes['title'] = env.content.replace(/&amp;/, '&');
  }
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
  /**
   * Adds an inlined language to markup.
   *
   * An example of an inlined language is CSS with `<style>` tags.
   *
   * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addInlined('style', 'css');
   */
  value: function addInlined(tagName, lang) {
    var includedCdataInside = {};
    includedCdataInside['language-' + lang] = {
      pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
      lookbehind: true,
      inside: Prism.languages[lang]
    };
    includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    var inside = {
      'included-cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        inside: includedCdataInside
      }
    };
    inside['language-' + lang] = {
      pattern: /[\s\S]+/,
      inside: Prism.languages[lang]
    };

    var def = {};
    def[tagName] = {
      pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g, tagName), 'i'),
      lookbehind: true,
      greedy: true,
      inside: inside
    };

    Prism.languages.insertBefore('markup', 'cdata', def);
  }
});

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

(function (Prism) {

  var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

  Prism.languages.css = {
    'comment': /\/\*[\s\S]*?\*\//,
    'atrule': {
      pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
      inside: {
        'rule': /@[\w-]+/
        // See rest below
      }
    },
    'url': {
      pattern: RegExp('url\\((?:' + string.source + '|[^\n\r()]*)\\)', 'i'),
      inside: {
        'function': /^url/i,
        'punctuation': /^\(|\)$/
      }
    },
    'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
    'string': {
      pattern: string,
      greedy: true
    },
    'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    'important': /!important\b/i,
    'function': /[-a-z0-9]+(?=\()/i,
    'punctuation': /[(){};:,]/
  };

  Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

  var markup = Prism.languages.markup;
  if (markup) {
    markup.tag.addInlined('style', 'css');

    Prism.languages.insertBefore('inside', 'attr-value', {
      'style-attr': {
        pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
        inside: {
          'attr-name': {
            pattern: /^\s*style/i,
            inside: markup.tag.inside
          },
          'punctuation': /^\s*=\s*['"]|['"]\s*$/,
          'attr-value': {
            pattern: /.+/i,
            inside: Prism.languages.css
          }
        },
        alias: 'language-css'
      }
    }, markup.tag);
  }

}(Prism));

Prism.languages.clike = {
  'comment': [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true,
      greedy: true
    }
  ],
  'string': {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'class-name': {
    pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: true,
    inside: {
      'punctuation': /[.\\]/
    }
  },
  'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
  'boolean': /\b(?:true|false)\b/,
  'function': /\w+(?=\()/,
  'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
  'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
  'class-name': [
    Prism.languages.clike['class-name'],
    {
      pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
      lookbehind: true
    }
  ],
  'keyword': [
    {
      pattern: /((?:^|})\s*)(?:catch|finally)\b/,
      lookbehind: true
    },
    {
      pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      lookbehind: true
    },
  ],
  'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  'operator': /--|\+\+|\*\*=?|=>|&&|\|\||[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?[.?]?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
  'regex': {
    pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*[\s\S]*?\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    lookbehind: true,
    greedy: true
  },
  // This must be declared before keyword because we use "function" inside the look-forward
  'function-variable': {
    pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
    alias: 'function'
  },
  'parameter': [
    {
      pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
      inside: Prism.languages.javascript
    },
    {
      pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    }
  ],
  'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
  'template-string': {
    pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
    greedy: true,
    inside: {
      'template-punctuation': {
        pattern: /^`|`$/,
        alias: 'string'
      },
      'interpolation': {
        pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
        lookbehind: true,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\${|}$/,
            alias: 'punctuation'
          },
          rest: Prism.languages.javascript
        }
      },
      'string': /[\s\S]+/
    }
  }
});

if (Prism.languages.markup) {
  Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;

(function(Prism) {
  // $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
  // + LC_ALL, RANDOM, REPLY, SECONDS.
  // + make sure PS1..4 are here as they are not always set,
  // - some useless things.
  var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';
  var insideString = {
    'environment': {
      pattern: RegExp("\\$" + envVars),
      alias: 'constant'
    },
    'variable': [
      // [0]: Arithmetic Environment
      {
        pattern: /\$?\(\([\s\S]+?\)\)/,
        greedy: true,
        inside: {
          // If there is a $ sign at the beginning highlight $(( and )) as variable
          'variable': [
            {
              pattern: /(^\$\(\([\s\S]+)\)\)/,
              lookbehind: true
            },
            /^\$\(\(/
          ],
          'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee]-?\d+)?/,
          // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
          'operator': /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
          // If there is no $ sign at the beginning highlight (( and )) as punctuation
          'punctuation': /\(\(?|\)\)?|,|;/
        }
      },
      // [1]: Command Substitution
      {
        pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
        greedy: true,
        inside: {
          'variable': /^\$\(|^`|\)$|`$/
        }
      },
      // [2]: Brace expansion
      {
        pattern: /\$\{[^}]+\}/,
        greedy: true,
        inside: {
          'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
          'punctuation': /[\[\]]/,
          'environment': {
            pattern: RegExp("(\\{)" + envVars),
            lookbehind: true,
            alias: 'constant'
          }
        }
      },
      /\$(?:\w+|[#?*!@$])/
    ],
    // Escape sequences from echo and printf's manuals, and escaped quotes.
    'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})/
  };

  Prism.languages.bash = {
    'shebang': {
      pattern: /^#!\s*\/.*/,
      alias: 'important'
    },
    'comment': {
      pattern: /(^|[^"{\\$])#.*/,
      lookbehind: true
    },
    'function-name': [
      // a) function foo {
      // b) foo() {
      // c) function foo() {
      // but not “foo {”
      {
        // a) and c)
        pattern: /(\bfunction\s+)\w+(?=(?:\s*\(?:\s*\))?\s*\{)/,
        lookbehind: true,
        alias: 'function'
      },
      {
        // b)
        pattern: /\b\w+(?=\s*\(\s*\)\s*\{)/,
        alias: 'function'
      }
    ],
    // Highlight variable names as variables in for and select beginnings.
    'for-or-select': {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: 'variable',
      lookbehind: true
    },
    // Highlight variable names as variables in the left-hand part
    // of assignments (“=” and “+=”).
    'assign-left': {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
      inside: {
        'environment': {
          pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars),
          lookbehind: true,
          alias: 'constant'
        }
      },
      alias: 'variable',
      lookbehind: true
    },
    'string': [
      // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+?)\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      // Here-document with quotes around the tag
      // → No expansion (so no “inside”).
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: true,
        greedy: true
      },
      // “Normal” string
      {
        pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true,
        inside: insideString
      }
    ],
    'environment': {
      pattern: RegExp("\\$?" + envVars),
      alias: 'constant'
    },
    'variable': insideString.variable,
    'function': {
      pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|aptitude|apt-cache|apt-get|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    'keyword': {
      pattern: /(^|[\s;|&]|[<>]\()(?:if|then|else|elif|fi|for|while|in|case|esac|function|select|do|done|until)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
    'builtin': {
      pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|break|cd|continue|eval|exec|exit|export|getopts|hash|pwd|readonly|return|shift|test|times|trap|umask|unset|alias|bind|builtin|caller|command|declare|echo|enable|help|let|local|logout|mapfile|printf|read|readarray|source|type|typeset|ulimit|unalias|set|shopt)(?=$|[)\s;|&])/,
      lookbehind: true,
      // Alias added to make those easier to distinguish from strings.
      alias: 'class-name'
    },
    'boolean': {
      pattern: /(^|[\s;|&]|[<>]\()(?:true|false)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    'file-descriptor': {
      pattern: /\B&\d\b/,
      alias: 'important'
    },
    'operator': {
      // Lots of redirections here, but not just that.
      pattern: /\d?<>|>\||\+=|==?|!=?|=~|<<[<-]?|[&\d]?>>|\d?[<>]&?|&[>&]?|\|[&|]?|<=?|>=?/,
      inside: {
        'file-descriptor': {
          pattern: /^\d/,
          alias: 'important'
        }
      }
    },
    'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    'number': {
      pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
      lookbehind: true
    }
  };

  /* Patterns in command substitution. */
  var toBeCopied = [
    'comment',
    'function-name',
    'for-or-select',
    'assign-left',
    'string',
    'environment',
    'function',
    'keyword',
    'builtin',
    'boolean',
    'file-descriptor',
    'operator',
    'punctuation',
    'number'
  ];
  var inside = insideString.variable[1].inside;
  for(var i = 0; i < toBeCopied.length; i++) {
    inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
  }

  Prism.languages.shell = Prism.languages.bash;
})(Prism);

Prism.languages.c = Prism.languages.extend('clike', {
  'class-name': {
    pattern: /(\b(?:enum|struct)\s+)\w+/,
    lookbehind: true
  },
  'keyword': /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
  'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
  'number': /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
});

Prism.languages.insertBefore('c', 'string', {
  'macro': {
    // allow for multiline macro definitions
    // spaces after the # character compile fine with gcc
    pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
    lookbehind: true,
    alias: 'property',
    inside: {
      // highlight the path of the include statement as a string
      'string': {
        pattern: /(#\s*include\s*)(?:<.+?>|("|')(?:\\?.)+?\2)/,
        lookbehind: true
      },
      // highlight macro directives as keywords
      'directive': {
        pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
        lookbehind: true,
        alias: 'keyword'
      }
    }
  },
  // highlight predefined macros as constants
  'constant': /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
});

delete Prism.languages.c['boolean'];

Prism.languages.cpp = Prism.languages.extend('c', {
  'class-name': {
    pattern: /(\b(?:class|enum|struct)\s+)\w+/,
    lookbehind: true
  },
  'keyword': /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
  'number': {
    pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+\.?[\da-f']*|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+\.?[\d']*|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]*/i,
    greedy: true
  },
  'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
  'boolean': /\b(?:true|false)\b/
});

Prism.languages.insertBefore('cpp', 'string', {
  'raw-string': {
    pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
    alias: 'string',
    greedy: true
  }
});

(function(Prism) {

// Ignore comments starting with { to privilege string interpolation highlighting
var comment = /#(?!\{).+/,
    interpolation = {
      pattern: /#\{[^}]+\}/,
      alias: 'variable'
    };

Prism.languages.coffeescript = Prism.languages.extend('javascript', {
  'comment': comment,
  'string': [

    // Strings are multiline
    {
      pattern: /'(?:\\[\s\S]|[^\\'])*'/,
      greedy: true
    },

    {
      // Strings are multiline
      pattern: /"(?:\\[\s\S]|[^\\"])*"/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    }
  ],
  'keyword': /\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
  'class-member': {
    pattern: /@(?!\d)\w+/,
    alias: 'variable'
  }
});

Prism.languages.insertBefore('coffeescript', 'comment', {
  'multiline-comment': {
    pattern: /###[\s\S]+?###/,
    alias: 'comment'
  },

  // Block regexp can contain comments and interpolation
  'block-regex': {
    pattern: /\/{3}[\s\S]*?\/{3}/,
    alias: 'regex',
    inside: {
      'comment': comment,
      'interpolation': interpolation
    }
  }
});

Prism.languages.insertBefore('coffeescript', 'string', {
  'inline-javascript': {
    pattern: /`(?:\\[\s\S]|[^\\`])*`/,
    inside: {
      'delimiter': {
        pattern: /^`|`$/,
        alias: 'punctuation'
      },
      rest: Prism.languages.javascript
    }
  },

  // Block strings
  'multiline-string': [
    {
      pattern: /'''[\s\S]*?'''/,
      greedy: true,
      alias: 'string'
    },
    {
      pattern: /"""[\s\S]*?"""/,
      greedy: true,
      alias: 'string',
      inside: {
        interpolation: interpolation
      }
    }
  ]

});

Prism.languages.insertBefore('coffeescript', 'keyword', {
  // Object property
  'property': /(?!\d)\w+(?=\s*:(?!:))/
});

delete Prism.languages.coffeescript['template-string'];

Prism.languages.coffee = Prism.languages.coffeescript;
}(Prism));
/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 *     constant, builtin, variable, symbol, regex
 */
(function(Prism) {
  Prism.languages.ruby = Prism.languages.extend('clike', {
    'comment': [
      /#.*/,
      {
        pattern: /^=begin\s[\s\S]*?^=end/m,
        greedy: true
      }
    ],
    'class-name': {
      pattern: /(\b(?:class)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: true,
      inside: {
        'punctuation': /[.\\]/
      }
    },
    'keyword': /\b(?:alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|protected|private|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/
  });

  var interpolation = {
    pattern: /#\{[^}]+\}/,
    inside: {
      'delimiter': {
        pattern: /^#\{|\}$/,
        alias: 'tag'
      },
      rest: Prism.languages.ruby
    }
  };

  delete Prism.languages.ruby.function;

  Prism.languages.insertBefore('ruby', 'keyword', {
    'regex': [
      {
        pattern: /%r([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1[gim]{0,3}/,
        greedy: true,
        inside: {
          'interpolation': interpolation
        }
      },
      {
        pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
        greedy: true,
        inside: {
          'interpolation': interpolation
        }
      },
      {
        // Here we need to specifically allow interpolation
        pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
        greedy: true,
        inside: {
          'interpolation': interpolation
        }
      },
      {
        pattern: /%r\[(?:[^\[\]\\]|\\[\s\S])*\][gim]{0,3}/,
        greedy: true,
        inside: {
          'interpolation': interpolation
        }
      },
      {
        pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
        greedy: true,
        inside: {
          'interpolation': interpolation
        }
      },
      {
        pattern: /(^|[^/])\/(?!\/)(?:\[.+?]|\\.|[^/\\\r\n])+\/[gim]{0,3}(?=\s*(?:$|[\r\n,.;})]))/,
        lookbehind: true,
        greedy: true
      }
    ],
    'variable': /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
    'symbol': {
      pattern: /(^|[^:]):[a-zA-Z_]\w*(?:[?!]|\b)/,
      lookbehind: true
    },
    'method-definition': {
      pattern: /(\bdef\s+)[\w.]+/,
      lookbehind: true,
      inside: {
        'function': /\w+$/,
        rest: Prism.languages.ruby
      }
    }
  });

  Prism.languages.insertBefore('ruby', 'number', {
    'builtin': /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|Fixnum|Float|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
    'constant': /\b[A-Z]\w*(?:[?!]|\b)/
  });

  Prism.languages.ruby.string = [
    {
      pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    },
    {
      pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    },
    {
      // Here we need to specifically allow interpolation
      pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    },
    {
      pattern: /%[qQiIwWxs]?\[(?:[^\[\]\\]|\\[\s\S])*\]/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    },
    {
      pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    },
    {
      pattern: /("|')(?:#\{[^}]+\}|\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true,
      inside: {
        'interpolation': interpolation
      }
    }
  ];

  Prism.languages.rb = Prism.languages.ruby;
}(Prism));

(function(Prism) {
  Prism.languages.crystal = Prism.languages.extend('ruby', {
    keyword: [
      /\b(?:abstract|alias|as|asm|begin|break|case|class|def|do|else|elsif|end|ensure|enum|extend|for|fun|if|include|instance_sizeof|lib|macro|module|next|of|out|pointerof|private|protected|rescue|return|require|select|self|sizeof|struct|super|then|type|typeof|uninitialized|union|unless|until|when|while|with|yield|__DIR__|__END_LINE__|__FILE__|__LINE__)\b/,
      {
        pattern: /(\.\s*)(?:is_a|responds_to)\?/,
        lookbehind: true
      }
    ],

    number: /\b(?:0b[01_]*[01]|0o[0-7_]*[0-7]|0x[\da-fA-F_]*[\da-fA-F]|(?:\d(?:[\d_]*\d)?)(?:\.[\d_]*\d)?(?:[eE][+-]?[\d_]*\d)?)(?:_(?:[uif](?:8|16|32|64))?)?\b/
  });

  Prism.languages.insertBefore('crystal', 'string', {
    attribute: {
      pattern: /@\[.+?\]/,
      alias: 'attr-name',
      inside: {
        delimiter: {
          pattern: /^@\[|\]$/,
          alias: 'tag'
        },
        rest: Prism.languages.crystal
      }
    },

    expansion: [
    {
      pattern: /\{\{.+?\}\}/,
      inside: {
        delimiter: {
          pattern: /^\{\{|\}\}$/,
          alias: 'tag'
        },
        rest: Prism.languages.crystal
      }
    },
    {
      pattern: /\{%.+?%\}/,
      inside: {
        delimiter: {
          pattern: /^\{%|%\}$/,
          alias: 'tag'
        },
        rest: Prism.languages.crystal
      }
    }
    ]
  });

}(Prism));

Prism.languages.d = Prism.languages.extend('clike', {
  'comment': [
    {
      // Shebang
      pattern: /^\s*#!.+/,
      greedy: true
    },
    {
      pattern: RegExp(/(^|[^\\])/.source + '(?:' + [
        // /+ comment +/
        // Allow one level of nesting
        /\/\+(?:\/\+[\s\S]*?\+\/|(?!\/\+)[\s\S])*?\+\//.source,
        // // comment
        /\/\/.*/.source,
        // /* comment */
        /\/\*[\s\S]*?\*\//.source
      ].join('|') + ')'),
      lookbehind: true,
      greedy: true
    }
  ],
  'string': [
    {
      pattern: RegExp([
        // r"", x""
        /\b[rx]"(?:\\[\s\S]|[^\\"])*"[cwd]?/.source,

        // q"[]", q"()", q"<>", q"{}"
        /\bq"(?:\[[\s\S]*?\]|\([\s\S]*?\)|<[\s\S]*?>|\{[\s\S]*?\})"/.source,

        // q"IDENT
        // ...
        // IDENT"
        /\bq"((?!\d)\w+)$[\s\S]*?^\1"/.source,

        // q"//", q"||", etc.
        /\bq"(.)[\s\S]*?\2"/.source,

        // Characters
        // 'a', '\\', '\n', '\xFF', '\377', '\uFFFF', '\U0010FFFF', '\quot'
        /'(?:\\(?:\W|\w+)|[^\\])'/.source,

        /(["`])(?:\\[\s\S]|(?!\3)[^\\])*\3[cwd]?/.source
      ].join('|'), 'm'),
      greedy: true
    },
    {
      pattern: /\bq\{(?:\{[^{}]*\}|[^{}])*\}/,
      greedy: true,
      alias: 'token-string'
    }
  ],

  'number': [
    // The lookbehind and the negative look-ahead try to prevent bad highlighting of the .. operator
    // Hexadecimal numbers must be handled separately to avoid problems with exponent "e"
    /\b0x\.?[a-f\d_]+(?:(?!\.\.)\.[a-f\d_]*)?(?:p[+-]?[a-f\d_]+)?[ulfi]*/i,
    {
      pattern: /((?:\.\.)?)(?:\b0b\.?|\b|\.)\d[\d_]*(?:(?!\.\.)\.[\d_]*)?(?:e[+-]?\d[\d_]*)?[ulfi]*/i,
      lookbehind: true
    }
  ],

  // In order: $, keywords and special tokens, globally defined symbols
  'keyword': /\$|\b(?:abstract|alias|align|asm|assert|auto|body|bool|break|byte|case|cast|catch|cdouble|cent|cfloat|char|class|const|continue|creal|dchar|debug|default|delegate|delete|deprecated|do|double|else|enum|export|extern|false|final|finally|float|for|foreach|foreach_reverse|function|goto|idouble|if|ifloat|immutable|import|inout|int|interface|invariant|ireal|lazy|long|macro|mixin|module|new|nothrow|null|out|override|package|pragma|private|protected|public|pure|real|ref|return|scope|shared|short|static|struct|super|switch|synchronized|template|this|throw|true|try|typedef|typeid|typeof|ubyte|ucent|uint|ulong|union|unittest|ushort|version|void|volatile|wchar|while|with|__(?:(?:FILE|MODULE|LINE|FUNCTION|PRETTY_FUNCTION|DATE|EOF|TIME|TIMESTAMP|VENDOR|VERSION)__|gshared|traits|vector|parameters)|string|wstring|dstring|size_t|ptrdiff_t)\b/,
  'operator': /\|[|=]?|&[&=]?|\+[+=]?|-[-=]?|\.?\.\.|=[>=]?|!(?:i[ns]\b|<>?=?|>=?|=)?|\bi[ns]\b|(?:<[<>]?|>>?>?|\^\^|[*\/%^~])=?/
});

Prism.languages.insertBefore('d', 'keyword', {
  'property': /\B@\w*/
});

Prism.languages.insertBefore('d', 'function', {
  'register': {
    // Iasm registers
    pattern: /\b(?:[ABCD][LHX]|E[ABCD]X|E?(?:BP|SP|DI|SI)|[ECSDGF]S|CR[0234]|DR[012367]|TR[3-7]|X?MM[0-7]|R[ABCD]X|[BS]PL|R[BS]P|[DS]IL|R[DS]I|R(?:[89]|1[0-5])[BWD]?|XMM(?:[89]|1[0-5])|YMM(?:1[0-5]|\d))\b|\bST(?:\([0-7]\)|\b)/,
    alias: 'variable'
  }
});

Prism.languages.dart = Prism.languages.extend('clike', {
  'string': [
    {
      pattern: /r?("""|''')[\s\S]*?\1/,
      greedy: true
    },
    {
      pattern: /r?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    }
  ],
  'keyword': [
    /\b(?:async|sync|yield)\*/,
    /\b(?:abstract|assert|async|await|break|case|catch|class|const|continue|default|deferred|do|dynamic|else|enum|export|external|extends|factory|final|finally|for|get|if|implements|import|in|library|new|null|operator|part|rethrow|return|set|static|super|switch|this|throw|try|typedef|var|void|while|with|yield)\b/
  ],
  'operator': /\bis!|\b(?:as|is)\b|\+\+|--|&&|\|\||<<=?|>>=?|~(?:\/=?)?|[+\-*\/%&^|=!<>]=?|\?/
});

Prism.languages.insertBefore('dart','function',{
  'metadata': {
    pattern: /@\w+/,
    alias: 'symbol'
  }
});
(function (Prism) {

  /**
   * Returns the placeholder for the given language id and index.
   *
   * @param {string} language
   * @param {string|number} index
   * @returns {string}
   */
  function getPlaceholder(language, index) {
    return '___' + language.toUpperCase() + index + '___';
  }

  Object.defineProperties(Prism.languages['markup-templating'] = {}, {
    buildPlaceholders: {
      /**
       * Tokenize all inline templating expressions matching `placeholderPattern`.
       *
       * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
       * `true` will be replaced.
       *
       * @param {object} env The environment of the `before-tokenize` hook.
       * @param {string} language The language id.
       * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
       * @param {(match: string) => boolean} [replaceFilter]
       */
      value: function (env, language, placeholderPattern, replaceFilter) {
        if (env.language !== language) {
          return;
        }

        var tokenStack = env.tokenStack = [];

        env.code = env.code.replace(placeholderPattern, function (match) {
          if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
            return match;
          }
          var i = tokenStack.length;
          var placeholder;

          // Check for existing strings
          while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1)
            ++i;

          // Create a sparse array
          tokenStack[i] = match;

          return placeholder;
        });

        // Switch the grammar to markup
        env.grammar = Prism.languages.markup;
      }
    },
    tokenizePlaceholders: {
      /**
       * Replace placeholders with proper tokens after tokenizing.
       *
       * @param {object} env The environment of the `after-tokenize` hook.
       * @param {string} language The language id.
       */
      value: function (env, language) {
        if (env.language !== language || !env.tokenStack) {
          return;
        }

        // Switch the grammar back
        env.grammar = Prism.languages[language];

        var j = 0;
        var keys = Object.keys(env.tokenStack);

        function walkTokens(tokens) {
          for (var i = 0; i < tokens.length; i++) {
            // all placeholders are replaced already
            if (j >= keys.length) {
              break;
            }

            var token = tokens[i];
            if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
              var k = keys[j];
              var t = env.tokenStack[k];
              var s = typeof token === 'string' ? token : token.content;
              var placeholder = getPlaceholder(language, k);

              var index = s.indexOf(placeholder);
              if (index > -1) {
                ++j;

                var before = s.substring(0, index);
                var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                var after = s.substring(index + placeholder.length);

                var replacement = [];
                if (before) {
                  replacement.push.apply(replacement, walkTokens([before]));
                }
                replacement.push(middle);
                if (after) {
                  replacement.push.apply(replacement, walkTokens([after]));
                }

                if (typeof token === 'string') {
                  tokens.splice.apply(tokens, [i, 1].concat(replacement));
                } else {
                  token.content = replacement;
                }
              }
            } else if (token.content /* && typeof token.content !== 'string' */) {
              walkTokens(token.content);
            }
          }

          return tokens;
        }

        walkTokens(env.tokens);
      }
    }
  });

}(Prism));

// Django/Jinja2 syntax definition for Prism.js <http://prismjs.com> syntax highlighter.
// Mostly it works OK but can paint code incorrectly on complex html/template tag combinations.

(function (Prism) {

  Prism.languages.django = {
    'comment': /^{#[\s\S]*?#}$/,
    'tag': {
      pattern: /(^{%[+-]?\s*)\w+/,
      lookbehind: true,
      alias: 'keyword'
    },
    'delimiter': {
      pattern: /^{[{%][+-]?|[+-]?[}%]}$/,
      alias: 'punctuation'
    },
    'string': {
      pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    'filter': {
      pattern: /(\|)\w+/,
      lookbehind: true,
      alias: 'function'
    },
    'test': {
      pattern: /(\bis\s+(?:not\s+)?)(?!not\b)\w+/,
      lookbehind: true,
      alias: 'function'
    },
    'function': /\b[a-z_]\w+(?=\s*\()/i,
    'keyword': /\b(?:and|as|by|else|for|if|import|in|is|loop|not|or|recursive|with|without)\b/,
    'operator': /[-+*/%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    'number': /\b\d+(?:\.\d+)?\b/,
    'boolean': /[Tt]rue|[Ff]alse|[Nn]one/,
    'variable': /\b\w+?\b/,
    'punctuation': /[{}[\](),.:;]/
  };


  var pattern = /{{[\s\S]*?}}|{%[\s\S]*?%}|{#[\s\S]*?#}/g;
  var markupTemplating = Prism.languages['markup-templating'];

  Prism.hooks.add('before-tokenize', function (env) {
    markupTemplating.buildPlaceholders(env, 'django', pattern);
  });
  Prism.hooks.add('after-tokenize', function (env) {
    markupTemplating.tokenizePlaceholders(env, 'django');
  });

  // Add an Jinja2 alias
  Prism.languages.jinja2 = Prism.languages.django;
  Prism.hooks.add('before-tokenize', function (env) {
    markupTemplating.buildPlaceholders(env, 'jinja2', pattern);
  });
  Prism.hooks.add('after-tokenize', function (env) {
    markupTemplating.tokenizePlaceholders(env, 'jinja2');
  });

})(Prism);

Prism.languages.elixir = {
  'comment': /#.*/m,
  // ~r"""foo""" (multi-line), ~r'''foo''' (multi-line), ~r/foo/, ~r|foo|, ~r"foo", ~r'foo', ~r(foo), ~r[foo], ~r{foo}, ~r<foo>
  'regex': {
    pattern: /~[rR](?:("""|''')(?:\\[\s\S]|(?!\1)[^\\])+\1|([\/|"'])(?:\\.|(?!\2)[^\\\r\n])+\2|\((?:\\.|[^\\)\r\n])+\)|\[(?:\\.|[^\\\]\r\n])+\]|\{(?:\\.|[^\\}\r\n])+\}|<(?:\\.|[^\\>\r\n])+>)[uismxfr]*/,
    greedy: true
  },
  'string': [
    {
      // ~s"""foo""" (multi-line), ~s'''foo''' (multi-line), ~s/foo/, ~s|foo|, ~s"foo", ~s'foo', ~s(foo), ~s[foo], ~s{foo} (with interpolation care), ~s<foo>
      pattern: /~[cCsSwW](?:("""|''')(?:\\[\s\S]|(?!\1)[^\\])+\1|([\/|"'])(?:\\.|(?!\2)[^\\\r\n])+\2|\((?:\\.|[^\\)\r\n])+\)|\[(?:\\.|[^\\\]\r\n])+\]|\{(?:\\.|#\{[^}]+\}|[^\\}\r\n])+\}|<(?:\\.|[^\\>\r\n])+>)[csa]?/,
      greedy: true,
      inside: {
        // See interpolation below
      }
    },
    {
      pattern: /("""|''')[\s\S]*?\1/,
      greedy: true,
      inside: {
        // See interpolation below
      }
    },
    {
      // Multi-line strings are allowed
      pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true,
      inside: {
        // See interpolation below
      }
    }
  ],
  'atom': {
    // Look-behind prevents bad highlighting of the :: operator
    pattern: /(^|[^:]):\w+/,
    lookbehind: true,
    alias: 'symbol'
  },
  // Look-ahead prevents bad highlighting of the :: operator
  'attr-name': /\w+\??:(?!:)/,
  'capture': {
    // Look-behind prevents bad highlighting of the && operator
    pattern: /(^|[^&])&(?:[^&\s\d()][^\s()]*|(?=\())/,
    lookbehind: true,
    alias: 'function'
  },
  'argument': {
    // Look-behind prevents bad highlighting of the && operator
    pattern: /(^|[^&])&\d+/,
    lookbehind: true,
    alias: 'variable'
  },
  'attribute': {
    pattern: /@\w+/,
    alias: 'variable'
  },
  'number': /\b(?:0[box][a-f\d_]+|\d[\d_]*)(?:\.[\d_]+)?(?:e[+-]?[\d_]+)?\b/i,
  'keyword': /\b(?:after|alias|and|case|catch|cond|def(?:callback|exception|impl|module|p|protocol|struct)?|do|else|end|fn|for|if|import|not|or|require|rescue|try|unless|use|when)\b/,
  'boolean': /\b(?:true|false|nil)\b/,
  'operator': [
    /\bin\b|&&?|\|[|>]?|\\\\|::|\.\.\.?|\+\+?|-[->]?|<[-=>]|>=|!==?|\B!|=(?:==?|[>~])?|[*\/^]/,
    {
      // We don't want to match <<
      pattern: /([^<])<(?!<)/,
      lookbehind: true
    },
    {
      // We don't want to match >>
      pattern: /([^>])>(?!>)/,
      lookbehind: true
    }
  ],
  'punctuation': /<<|>>|[.,%\[\]{}()]/
};

Prism.languages.elixir.string.forEach(function(o) {
  o.inside = {
    'interpolation': {
      pattern: /#\{[^}]+\}/,
      inside: {
        'delimiter': {
          pattern: /^#\{|\}$/,
          alias: 'punctuation'
        },
        rest: Prism.languages.elixir
      }
    }
  };
});

Prism.languages.erlang = {
  'comment': /%.+/,
  'string': {
    pattern: /"(?:\\.|[^\\"\r\n])*"/,
    greedy: true
  },
  'quoted-function': {
    pattern: /'(?:\\.|[^\\'\r\n])+'(?=\()/,
    alias: 'function'
  },
  'quoted-atom': {
    pattern: /'(?:\\.|[^\\'\r\n])+'/,
    alias: 'atom'
  },
  'boolean': /\b(?:true|false)\b/,
  'keyword': /\b(?:fun|when|case|of|end|if|receive|after|try|catch)\b/,
  'number': [
    /\$\\?./,
    /\d+#[a-z0-9]+/i,
    /(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i
  ],
  'function': /\b[a-z][\w@]*(?=\()/,
  'variable': {
    // Look-behind is used to prevent wrong highlighting of atoms containing "@"
    pattern: /(^|[^@])(?:\b|\?)[A-Z_][\w@]*/,
    lookbehind: true
  },
  'operator': [
    /[=\/<>:]=|=[:\/]=|\+\+?|--?|[=*\/!]|\b(?:bnot|div|rem|band|bor|bxor|bsl|bsr|not|and|or|xor|orelse|andalso)\b/,
    {
      // We don't want to match <<
      pattern: /(^|[^<])<(?!<)/,
      lookbehind: true
    },
    {
      // We don't want to match >>
      pattern: /(^|[^>])>(?!>)/,
      lookbehind: true
    }
  ],
  'atom': /\b[a-z][\w@]*/,
  'punctuation': /[()[\]{}:;,.#|]|<<|>>/

};
Prism.languages.go = Prism.languages.extend('clike', {
  'keyword': /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
  'builtin': /\b(?:bool|byte|complex(?:64|128)|error|float(?:32|64)|rune|string|u?int(?:8|16|32|64)?|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(?:ln)?|real|recover)\b/,
  'boolean': /\b(?:_|iota|nil|true|false)\b/,
  'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
  'number': /(?:\b0x[a-f\d]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e[-+]?\d+)?)i?/i,
  'string': {
    pattern: /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: true
  }
});
delete Prism.languages.go['class-name'];

Prism.languages.groovy = Prism.languages.extend('clike', {
  'string': [
    {
      pattern: /("""|''')(?:[^\\]|\\[\s\S])*?\1|\$\/(?:\$\/\$|[\s\S])*?\/\$/,
      greedy: true
    },
    {
      // TODO: Slash strings (e.g. /foo/) can contain line breaks but this will cause a lot of trouble with
      // simple division (see JS regex), so find a fix maybe?
      pattern: /(["'/])(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    }
  ],
  'keyword': /\b(?:as|def|in|abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|trait|transient|try|void|volatile|while)\b/,
  'number': /\b(?:0b[01_]+|0x[\da-f_]+(?:\.[\da-f_p\-]+)?|[\d_]+(?:\.[\d_]+)?(?:e[+-]?[\d]+)?)[glidf]?\b/i,
  'operator': {
    pattern: /(^|[^.])(?:~|==?~?|\?[.:]?|\*(?:[.=]|\*=?)?|\.[@&]|\.\.<|\.\.(?!\.)|-[-=>]?|\+[+=]?|!=?|<(?:<=?|=>?)?|>(?:>>?=?|=)?|&[&=]?|\|[|=]?|\/=?|\^=?|%=?)/,
    lookbehind: true
  },
  'punctuation': /\.+|[{}[\];(),.:$]/
});

Prism.languages.insertBefore('groovy', 'string', {
  'shebang': {
    pattern: /#!.+/,
    alias: 'comment'
  }
});

Prism.languages.insertBefore('groovy', 'punctuation', {
  'spock-block': /\b(?:setup|given|when|then|and|cleanup|expect|where):/
});

Prism.languages.insertBefore('groovy', 'function', {
  'annotation': {
    pattern: /(^|[^.])@\w+/,
    lookbehind: true,
    alias: 'punctuation'
  }
});

// Handle string interpolation
Prism.hooks.add('wrap', function(env) {
  if (env.language === 'groovy' && env.type === 'string') {
    var delimiter = env.content[0];

    if (delimiter != "'") {
      var pattern = /([^\\])(?:\$(?:\{.*?\}|[\w.]+))/;
      if (delimiter === '$') {
        pattern = /([^\$])(?:\$(?:\{.*?\}|[\w.]+))/;
      }

      // To prevent double HTML-encoding we have to decode env.content first
      env.content = env.content.replace(/&lt;/g, '<').replace(/&amp;/g, '&');

      env.content = Prism.highlight(env.content, {
        'expression': {
          pattern: pattern,
          lookbehind: true,
          inside: Prism.languages.groovy
        }
      });

      env.classes.push(delimiter === '/' ? 'regex' : 'gstring');
    }
  }
});

(function (Prism) {

  var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|null|open|opens|package|private|protected|provides|public|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

  // based on the java naming conventions
  var className = /\b[A-Z](?:\w*[a-z]\w*)?\b/;

  Prism.languages.java = Prism.languages.extend('clike', {
    'class-name': [
      className,

      // variables and parameters
      // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
      /\b[A-Z]\w*(?=\s+\w+\s*[;,=())])/
    ],
    'keyword': keywords,
    'function': [
      Prism.languages.clike.function,
      {
        pattern: /(\:\:)[a-z_]\w*/,
        lookbehind: true
      }
    ],
    'number': /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
    'operator': {
      pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
      lookbehind: true
    }
  });

  Prism.languages.insertBefore('java', 'string', {
    'triple-quoted-string': {
      // http://openjdk.java.net/jeps/355#Description
      pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
      greedy: true,
      alias: 'string'
    }
  });

  Prism.languages.insertBefore('java', 'class-name', {
    'annotation': {
      alias: 'punctuation',
      pattern: /(^|[^.])@\w+/,
      lookbehind: true
    },
    'namespace': {
      pattern: /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)[a-z]\w*(?:\.[a-z]\w*)+/,
      lookbehind: true,
      inside: {
        'punctuation': /\./,
      }
    },
    'generics': {
      pattern: /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
      inside: {
        'class-name': className,
        'keyword': keywords,
        'punctuation': /[<>(),.:]/,
        'operator': /[?&|]/
      }
    }
  });
}(Prism));

Prism.languages.json = {
  'property': {
    pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    greedy: true
  },
  'string': {
    pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
    greedy: true
  },
  'comment': /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
  'number': /-?\d+\.?\d*(?:e[+-]?\d+)?/i,
  'punctuation': /[{}[\],]/,
  'operator': /:/,
  'boolean': /\b(?:true|false)\b/,
  'null': {
    pattern: /\bnull\b/,
    alias: 'keyword'
  }
};

Prism.languages.julia= {
  'comment': {
    pattern: /(^|[^\\])#.*/,
    lookbehind: true
  },
  'string': /("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2/,
  'keyword' : /\b(?:abstract|baremodule|begin|bitstype|break|catch|ccall|const|continue|do|else|elseif|end|export|finally|for|function|global|if|immutable|import|importall|in|let|local|macro|module|print|println|quote|return|struct|try|type|typealias|using|while)\b/,
  'boolean' : /\b(?:true|false)\b/,
  'number' : /(?:\b(?=\d)|\B(?=\.))(?:0[box])?(?:[\da-f]+\.?\d*|\.\d+)(?:[efp][+-]?\d+)?j?/i,
  'operator': /[-+*^%÷&$\\]=?|\/[\/=]?|!=?=?|\|[=>]?|<(?:<=?|[=:])?|>(?:=|>>?=?)?|==?=?|[~≠≤≥]/,
  'punctuation' : /[{}[\];(),.:]/,
  'constant': /\b(?:(?:NaN|Inf)(?:16|32|64)?)\b/
};

(function (Prism) {
  Prism.languages.kotlin = Prism.languages.extend('clike', {
    'keyword': {
      // The lookbehind prevents wrong highlighting of e.g. kotlin.properties.get
      pattern: /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/,
      lookbehind: true
    },
    'function': [
      /\w+(?=\s*\()/,
      {
        pattern: /(\.)\w+(?=\s*\{)/,
        lookbehind: true
      }
    ],
    'number': /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/,
    'operator': /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/
  });

  delete Prism.languages.kotlin["class-name"];

  Prism.languages.insertBefore('kotlin', 'string', {
    'raw-string': {
      pattern: /("""|''')[\s\S]*?\1/,
      alias: 'string'
      // See interpolation below
    }
  });
  Prism.languages.insertBefore('kotlin', 'keyword', {
    'annotation': {
      pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,
      alias: 'builtin'
    }
  });
  Prism.languages.insertBefore('kotlin', 'function', {
    'label': {
      pattern: /\w+@|@\w+/,
      alias: 'symbol'
    }
  });

  var interpolation = [
    {
      pattern: /\$\{[^}]+\}/,
      inside: {
        'delimiter': {
          pattern: /^\$\{|\}$/,
          alias: 'variable'
        },
        rest: Prism.languages.kotlin
      }
    },
    {
      pattern: /\$\w+/,
      alias: 'variable'
    }
  ];

  Prism.languages.kotlin['string'].inside = Prism.languages.kotlin['raw-string'].inside = {
    interpolation: interpolation
  };

}(Prism));

Prism.languages.lua = {
  'comment': /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m,
  // \z may be used to skip the following space
  'string': {
    pattern: /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[\s\S]))*\1|\[(=*)\[[\s\S]*?\]\2\]/,
    greedy: true
  },
  'number': /\b0x[a-f\d]+\.?[a-f\d]*(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|\.?\d*(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i,
  'keyword': /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
  'function': /(?!\d)\w+(?=\s*(?:[({]))/,
  'operator': [
    /[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/,
    {
      // Match ".." but don't break "..."
      pattern: /(^|[^.])\.\.(?!\.)/,
      lookbehind: true
    }
  ],
  'punctuation': /[\[\](){},;]|\.+|:+/
};
Prism.languages.matlab = {
  'comment': [
    /%\{[\s\S]*?\}%/,
    /%.+/
  ],
  'string': {
    pattern: /\B'(?:''|[^'\r\n])*'/,
    greedy: true
  },
  // FIXME We could handle imaginary numbers as a whole
  'number': /(?:\b\d+\.?\d*|\B\.\d+)(?:[eE][+-]?\d+)?(?:[ij])?|\b[ij]\b/,
  'keyword': /\b(?:break|case|catch|continue|else|elseif|end|for|function|if|inf|NaN|otherwise|parfor|pause|pi|return|switch|try|while)\b/,
  'function': /(?!\d)\w+(?=\s*\()/,
  'operator': /\.?[*^\/\\']|[+\-:@]|[<>=~]=?|&&?|\|\|?/,
  'punctuation': /\.{3}|[.,;\[\](){}!]/
};
Prism.languages.nginx = Prism.languages.extend('clike', {
  'comment': {
    pattern: /(^|[^"{\\])#.*/,
    lookbehind: true
  },
  'keyword': /\b(?:CONTENT_|DOCUMENT_|GATEWAY_|HTTP_|HTTPS|if_not_empty|PATH_|QUERY_|REDIRECT_|REMOTE_|REQUEST_|SCGI|SCRIPT_|SERVER_|http|events|accept_mutex|accept_mutex_delay|access_log|add_after_body|add_before_body|add_header|addition_types|aio|alias|allow|ancient_browser|ancient_browser_value|auth|auth_basic|auth_basic_user_file|auth_http|auth_http_header|auth_http_timeout|autoindex|autoindex_exact_size|autoindex_localtime|break|charset|charset_map|charset_types|chunked_transfer_encoding|client_body_buffer_size|client_body_in_file_only|client_body_in_single_buffer|client_body_temp_path|client_body_timeout|client_header_buffer_size|client_header_timeout|client_max_body_size|connection_pool_size|create_full_put_path|daemon|dav_access|dav_methods|debug_connection|debug_points|default_type|deny|devpoll_changes|devpoll_events|directio|directio_alignment|disable_symlinks|empty_gif|env|epoll_events|error_log|error_page|expires|fastcgi_buffer_size|fastcgi_buffers|fastcgi_busy_buffers_size|fastcgi_cache|fastcgi_cache_bypass|fastcgi_cache_key|fastcgi_cache_lock|fastcgi_cache_lock_timeout|fastcgi_cache_methods|fastcgi_cache_min_uses|fastcgi_cache_path|fastcgi_cache_purge|fastcgi_cache_use_stale|fastcgi_cache_valid|fastcgi_connect_timeout|fastcgi_hide_header|fastcgi_ignore_client_abort|fastcgi_ignore_headers|fastcgi_index|fastcgi_intercept_errors|fastcgi_keep_conn|fastcgi_max_temp_file_size|fastcgi_next_upstream|fastcgi_no_cache|fastcgi_param|fastcgi_pass|fastcgi_pass_header|fastcgi_read_timeout|fastcgi_redirect_errors|fastcgi_send_timeout|fastcgi_split_path_info|fastcgi_store|fastcgi_store_access|fastcgi_temp_file_write_size|fastcgi_temp_path|flv|geo|geoip_city|geoip_country|google_perftools_profiles|gzip|gzip_buffers|gzip_comp_level|gzip_disable|gzip_http_version|gzip_min_length|gzip_proxied|gzip_static|gzip_types|gzip_vary|if|if_modified_since|ignore_invalid_headers|image_filter|image_filter_buffer|image_filter_jpeg_quality|image_filter_sharpen|image_filter_transparency|imap_capabilities|imap_client_buffer|include|index|internal|ip_hash|keepalive|keepalive_disable|keepalive_requests|keepalive_timeout|kqueue_changes|kqueue_events|large_client_header_buffers|limit_conn|limit_conn_log_level|limit_conn_zone|limit_except|limit_rate|limit_rate_after|limit_req|limit_req_log_level|limit_req_zone|limit_zone|lingering_close|lingering_time|lingering_timeout|listen|location|lock_file|log_format|log_format_combined|log_not_found|log_subrequest|map|map_hash_bucket_size|map_hash_max_size|master_process|max_ranges|memcached_buffer_size|memcached_connect_timeout|memcached_next_upstream|memcached_pass|memcached_read_timeout|memcached_send_timeout|merge_slashes|min_delete_depth|modern_browser|modern_browser_value|mp4|mp4_buffer_size|mp4_max_buffer_size|msie_padding|msie_refresh|multi_accept|open_file_cache|open_file_cache_errors|open_file_cache_min_uses|open_file_cache_valid|open_log_file_cache|optimize_server_names|override_charset|pcre_jit|perl|perl_modules|perl_require|perl_set|pid|pop3_auth|pop3_capabilities|port_in_redirect|post_action|postpone_output|protocol|proxy|proxy_buffer|proxy_buffer_size|proxy_buffering|proxy_buffers|proxy_busy_buffers_size|proxy_cache|proxy_cache_bypass|proxy_cache_key|proxy_cache_lock|proxy_cache_lock_timeout|proxy_cache_methods|proxy_cache_min_uses|proxy_cache_path|proxy_cache_use_stale|proxy_cache_valid|proxy_connect_timeout|proxy_cookie_domain|proxy_cookie_path|proxy_headers_hash_bucket_size|proxy_headers_hash_max_size|proxy_hide_header|proxy_http_version|proxy_ignore_client_abort|proxy_ignore_headers|proxy_intercept_errors|proxy_max_temp_file_size|proxy_method|proxy_next_upstream|proxy_no_cache|proxy_pass|proxy_pass_error_message|proxy_pass_header|proxy_pass_request_body|proxy_pass_request_headers|proxy_read_timeout|proxy_redirect|proxy_redirect_errors|proxy_send_lowat|proxy_send_timeout|proxy_set_body|proxy_set_header|proxy_ssl_session_reuse|proxy_store|proxy_store_access|proxy_temp_file_write_size|proxy_temp_path|proxy_timeout|proxy_upstream_fail_timeout|proxy_upstream_max_fails|random_index|read_ahead|real_ip_header|recursive_error_pages|request_pool_size|reset_timedout_connection|resolver|resolver_timeout|return|rewrite|root|rtsig_overflow_events|rtsig_overflow_test|rtsig_overflow_threshold|rtsig_signo|satisfy|satisfy_any|secure_link_secret|send_lowat|send_timeout|sendfile|sendfile_max_chunk|server|server_name|server_name_in_redirect|server_names_hash_bucket_size|server_names_hash_max_size|server_tokens|set|set_real_ip_from|smtp_auth|smtp_capabilities|so_keepalive|source_charset|split_clients|ssi|ssi_silent_errors|ssi_types|ssi_value_length|ssl|ssl_certificate|ssl_certificate_key|ssl_ciphers|ssl_client_certificate|ssl_crl|ssl_dhparam|ssl_engine|ssl_prefer_server_ciphers|ssl_protocols|ssl_session_cache|ssl_session_timeout|ssl_verify_client|ssl_verify_depth|starttls|stub_status|sub_filter|sub_filter_once|sub_filter_types|tcp_nodelay|tcp_nopush|timeout|timer_resolution|try_files|types|types_hash_bucket_size|types_hash_max_size|underscores_in_headers|uninitialized_variable_warn|upstream|use|user|userid|userid_domain|userid_expires|userid_name|userid_p3p|userid_path|userid_service|valid_referers|variables_hash_bucket_size|variables_hash_max_size|worker_connections|worker_cpu_affinity|worker_priority|worker_processes|worker_rlimit_core|worker_rlimit_nofile|worker_rlimit_sigpending|working_directory|xclient|xml_entities|xslt_entities|xslt_stylesheet|xslt_types|ssl_session_tickets|ssl_stapling|ssl_stapling_verify|ssl_ecdh_curve|ssl_trusted_certificate|more_set_headers|ssl_early_data)\b/i
});

Prism.languages.insertBefore('nginx', 'keyword', {
  'variable': /\$[a-z_]+/i
});

Prism.languages.nim = {
  'comment': /#.*/,
  // Double-quoted strings can be prefixed by an identifier (Generalized raw string literals)
  // Character literals are handled specifically to prevent issues with numeric type suffixes
  'string': {
    pattern: /(?:(?:\b(?!\d)(?:\w|\\x[8-9a-fA-F][0-9a-fA-F])+)?(?:"""[\s\S]*?"""(?!")|"(?:\\[\s\S]|""|[^"\\])*")|'(?:\\(?:\d+|x[\da-fA-F]{2}|.)|[^'])')/,
    greedy: true
  },
  // The negative look ahead prevents wrong highlighting of the .. operator
  'number': /\b(?:0[xXoObB][\da-fA-F_]+|\d[\d_]*(?:(?!\.\.)\.[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)(?:'?[iuf]\d*)?/,
  'keyword': /\b(?:addr|as|asm|atomic|bind|block|break|case|cast|concept|const|continue|converter|defer|discard|distinct|do|elif|else|end|enum|except|export|finally|for|from|func|generic|if|import|include|interface|iterator|let|macro|method|mixin|nil|object|out|proc|ptr|raise|ref|return|static|template|try|tuple|type|using|var|when|while|with|without|yield)\b/,
  'function': {
    pattern: /(?:(?!\d)(?:\w|\\x[8-9a-fA-F][0-9a-fA-F])+|`[^`\r\n]+`)\*?(?:\[[^\]]+\])?(?=\s*\()/,
    inside: {
      'operator': /\*$/
    }
  },
  // We don't want to highlight operators inside backticks
  'ignore': {
    pattern: /`[^`\r\n]+`/,
    inside: {
      'punctuation': /`/
    }
  },
  'operator': {
    // Look behind and look ahead prevent wrong highlighting of punctuations [. .] {. .} (. .)
    // but allow the slice operator .. to take precedence over them
    // One can define his own operators in Nim so all combination of operators might be an operator.
    pattern: /(^|[({\[](?=\.\.)|(?![({\[]\.).)(?:(?:[=+\-*\/<>@$~&%|!?^:\\]|\.\.|\.(?![)}\]]))+|\b(?:and|div|of|or|in|is|isnot|mod|not|notin|shl|shr|xor)\b)/m,
    lookbehind: true
  },
  'punctuation': /[({\[]\.|\.[)}\]]|[`(){}\[\],:]/
};
Prism.languages.perl = {
  'comment': [
    {
      // POD
      pattern: /(^\s*)=\w+[\s\S]*?=cut.*/m,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\$])#.*/,
      lookbehind: true
    }
  ],
  // TODO Could be nice to handle Heredoc too.
  'string': [
    // q/.../
    {
      pattern: /\b(?:q|qq|qx|qw)\s*([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true
    },

    // q a...a
    {
      pattern: /\b(?:q|qq|qx|qw)\s+([a-zA-Z0-9])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true
    },

    // q(...)
    {
      pattern: /\b(?:q|qq|qx|qw)\s*\((?:[^()\\]|\\[\s\S])*\)/,
      greedy: true
    },

    // q{...}
    {
      pattern: /\b(?:q|qq|qx|qw)\s*\{(?:[^{}\\]|\\[\s\S])*\}/,
      greedy: true
    },

    // q[...]
    {
      pattern: /\b(?:q|qq|qx|qw)\s*\[(?:[^[\]\\]|\\[\s\S])*\]/,
      greedy: true
    },

    // q<...>
    {
      pattern: /\b(?:q|qq|qx|qw)\s*<(?:[^<>\\]|\\[\s\S])*>/,
      greedy: true
    },

    // "...", `...`
    {
      pattern: /("|`)(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true
    },

    // '...'
    // FIXME Multi-line single-quoted strings are not supported as they would break variables containing '
    {
      pattern: /'(?:[^'\\\r\n]|\\.)*'/,
      greedy: true
    }
  ],
  'regex': [
    // m/.../
    {
      pattern: /\b(?:m|qr)\s*([^a-zA-Z0-9\s{(\[<])(?:(?!\1)[^\\]|\\[\s\S])*\1[msixpodualngc]*/,
      greedy: true
    },

    // m a...a
    {
      pattern: /\b(?:m|qr)\s+([a-zA-Z0-9])(?:(?!\1)[^\\]|\\[\s\S])*\1[msixpodualngc]*/,
      greedy: true
    },

    // m(...)
    {
      pattern: /\b(?:m|qr)\s*\((?:[^()\\]|\\[\s\S])*\)[msixpodualngc]*/,
      greedy: true
    },

    // m{...}
    {
      pattern: /\b(?:m|qr)\s*\{(?:[^{}\\]|\\[\s\S])*\}[msixpodualngc]*/,
      greedy: true
    },

    // m[...]
    {
      pattern: /\b(?:m|qr)\s*\[(?:[^[\]\\]|\\[\s\S])*\][msixpodualngc]*/,
      greedy: true
    },

    // m<...>
    {
      pattern: /\b(?:m|qr)\s*<(?:[^<>\\]|\\[\s\S])*>[msixpodualngc]*/,
      greedy: true
    },

    // The lookbehinds prevent -s from breaking
    // FIXME We don't handle change of separator like s(...)[...]
    // s/.../.../
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s*([^a-zA-Z0-9\s{(\[<])(?:(?!\2)[^\\]|\\[\s\S])*\2(?:(?!\2)[^\\]|\\[\s\S])*\2[msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // s a...a...a
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s+([a-zA-Z0-9])(?:(?!\2)[^\\]|\\[\s\S])*\2(?:(?!\2)[^\\]|\\[\s\S])*\2[msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // s(...)(...)
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s*\((?:[^()\\]|\\[\s\S])*\)\s*\((?:[^()\\]|\\[\s\S])*\)[msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // s{...}{...}
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s*\{(?:[^{}\\]|\\[\s\S])*\}\s*\{(?:[^{}\\]|\\[\s\S])*\}[msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // s[...][...]
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s*\[(?:[^[\]\\]|\\[\s\S])*\]\s*\[(?:[^[\]\\]|\\[\s\S])*\][msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // s<...><...>
    {
      pattern: /(^|[^-]\b)(?:s|tr|y)\s*<(?:[^<>\\]|\\[\s\S])*>\s*<(?:[^<>\\]|\\[\s\S])*>[msixpodualngcer]*/,
      lookbehind: true,
      greedy: true
    },

    // /.../
    // The look-ahead tries to prevent two divisions on
    // the same line from being highlighted as regex.
    // This does not support multi-line regex.
    {
      pattern: /\/(?:[^\/\\\r\n]|\\.)*\/[msixpodualngc]*(?=\s*(?:$|[\r\n,.;})&|\-+*~<>!?^]|(?:lt|gt|le|ge|eq|ne|cmp|not|and|or|xor|x)\b))/,
      greedy: true
    }
  ],

  // FIXME Not sure about the handling of ::, ', and #
  'variable': [
    // ${^POSTMATCH}
    /[&*$@%]\{\^[A-Z]+\}/,
    // $^V
    /[&*$@%]\^[A-Z_]/,
    // ${...}
    /[&*$@%]#?(?=\{)/,
    // $foo
    /[&*$@%]#?(?:(?:::)*'?(?!\d)[\w$]+)+(?:::)*/i,
    // $1
    /[&*$@%]\d+/,
    // $_, @_, %!
    // The negative lookahead prevents from breaking the %= operator
    /(?!%=)[$@%][!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/
  ],
  'filehandle': {
    // <>, <FOO>, _
    pattern: /<(?![<=])\S*>|\b_\b/,
    alias: 'symbol'
  },
  'vstring': {
    // v1.2, 1.2.3
    pattern: /v\d+(?:\.\d+)*|\d+(?:\.\d+){2,}/,
    alias: 'string'
  },
  'function': {
    pattern: /sub [a-z0-9_]+/i,
    inside: {
      keyword: /sub/
    }
  },
  'keyword': /\b(?:any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|return|say|state|sub|switch|undef|unless|until|use|when|while)\b/,
  'number': /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0b[01](?:_?[01])*|(?:\d(?:_?\d)*)?\.?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)\b/,
  'operator': /-[rwxoRWXOezsfdlpSbctugkTBMAC]\b|\+[+=]?|-[-=>]?|\*\*?=?|\/\/?=?|=[=~>]?|~[~=]?|\|\|?=?|&&?=?|<(?:=>?|<=?)?|>>?=?|![~=]?|[%^]=?|\.(?:=|\.\.?)?|[\\?]|\bx(?:=|\b)|\b(?:lt|gt|le|ge|eq|ne|cmp|not|and|or|xor)\b/,
  'punctuation': /[{}[\];(),:]/
};

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 *     - Extends clike syntax
 *     - Support for PHP 5.3+ (namespaces, traits, generators, etc)
 *     - Smarter constant and function matching
 *
 * Adds the following new token classes:
 *     constant, delimiter, variable, function, package
 */
(function (Prism) {
  Prism.languages.php = Prism.languages.extend('clike', {
    'keyword': /\b(?:__halt_compiler|abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|parent|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
    'boolean': {
      pattern: /\b(?:false|true)\b/i,
      alias: 'constant'
    },
    'constant': [
      /\b[A-Z_][A-Z0-9_]*\b/,
      /\b(?:null)\b/i,
    ],
    'comment': {
      pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
      lookbehind: true
    }
  });

  Prism.languages.insertBefore('php', 'string', {
    'shell-comment': {
      pattern: /(^|[^\\])#.*/,
      lookbehind: true,
      alias: 'comment'
    }
  });

  Prism.languages.insertBefore('php', 'comment', {
    'delimiter': {
      pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
      alias: 'important'
    }
  });

  Prism.languages.insertBefore('php', 'keyword', {
    'variable': /\$+(?:\w+\b|(?={))/i,
    'package': {
      pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
      lookbehind: true,
      inside: {
        punctuation: /\\/
      }
    }
  });

  // Must be defined after the function pattern
  Prism.languages.insertBefore('php', 'operator', {
    'property': {
      pattern: /(->)[\w]+/,
      lookbehind: true
    }
  });

  var string_interpolation = {
    pattern: /{\$(?:{(?:{[^{}]+}|[^{}]+)}|[^{}])+}|(^|[^\\{])\$+(?:\w+(?:\[.+?]|->\w+)*)/,
    lookbehind: true,
    inside: Prism.languages.php
  };

  Prism.languages.insertBefore('php', 'string', {
    'nowdoc-string': {
      pattern: /<<<'([^']+)'(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;/,
      greedy: true,
      alias: 'string',
      inside: {
        'delimiter': {
          pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
          alias: 'symbol',
          inside: {
            'punctuation': /^<<<'?|[';]$/
          }
        }
      }
    },
    'heredoc-string': {
      pattern: /<<<(?:"([^"]+)"(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;|([a-z_]\w*)(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\2;)/i,
      greedy: true,
      alias: 'string',
      inside: {
        'delimiter': {
          pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
          alias: 'symbol',
          inside: {
            'punctuation': /^<<<"?|[";]$/
          }
        },
        'interpolation': string_interpolation // See below
      }
    },
    'single-quoted-string': {
      pattern: /'(?:\\[\s\S]|[^\\'])*'/,
      greedy: true,
      alias: 'string'
    },
    'double-quoted-string': {
      pattern: /"(?:\\[\s\S]|[^\\"])*"/,
      greedy: true,
      alias: 'string',
      inside: {
        'interpolation': string_interpolation // See below
      }
    }
  });
  // The different types of PHP strings "replace" the C-like standard string
  delete Prism.languages.php['string'];

  Prism.hooks.add('before-tokenize', function(env) {
    if (!/<\?/.test(env.code)) {
      return;
    }

    var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#)(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|\/\*[\s\S]*?(?:\*\/|$))*?(?:\?>|$)/ig;
    Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
  });

  Prism.hooks.add('after-tokenize', function(env) {
    Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
  });

}(Prism));

Prism.languages.python = {
  'comment': {
    pattern: /(^|[^\\])#.*/,
    lookbehind: true
  },
  'string-interpolation': {
    pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
    greedy: true,
    inside: {
      'interpolation': {
        // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
        pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,
        lookbehind: true,
        inside: {
          'format-spec': {
            pattern: /(:)[^:(){}]+(?=}$)/,
            lookbehind: true
          },
          'conversion-option': {
            pattern: /![sra](?=[:}]$)/,
            alias: 'punctuation'
          },
          rest: null
        }
      },
      'string': /[\s\S]+/
    }
  },
  'triple-quoted-string': {
    pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]+?\1/i,
    greedy: true,
    alias: 'string'
  },
  'string': {
    pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
    greedy: true
  },
  'function': {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
    lookbehind: true
  },
  'class-name': {
    pattern: /(\bclass\s+)\w+/i,
    lookbehind: true
  },
  'decorator': {
    pattern: /(^\s*)@\w+(?:\.\w+)*/im,
    lookbehind: true,
    alias: ['annotation', 'punctuation'],
    inside: {
      'punctuation': /\./
    }
  },
  'keyword': /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
  'boolean': /\b(?:True|False|None)\b/,
  'number': /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
  'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

(function(Prism) {

var javascript = Prism.util.clone(Prism.languages.javascript);

Prism.languages.jsx = Prism.languages.extend('markup', javascript);
Prism.languages.jsx.tag.pattern= /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:$-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^}]*\}|[^{}])*\}|[^{}])+\}))?|\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}))*\s*\/?)?>/i;

Prism.languages.jsx.tag.inside['tag'].pattern = /^<\/?[^\s>\/]*/i;
Prism.languages.jsx.tag.inside['attr-value'].pattern = /=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i;
Prism.languages.jsx.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;

Prism.languages.insertBefore('inside', 'attr-name', {
  'spread': {
    pattern: /\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}/,
    inside: {
      'punctuation': /\.{3}|[{}.]/,
      'attr-value': /\w+/
    }
  }
}, Prism.languages.jsx.tag);

Prism.languages.insertBefore('inside', 'attr-value',{
  'script': {
    // Allow for two levels of nesting
    pattern: /=(?:\{(?:\{(?:\{[^}]*\}|[^}])*\}|[^}])+\})/i,
    inside: {
      'script-punctuation': {
        pattern: /^=(?={)/,
        alias: 'punctuation'
      },
      rest: Prism.languages.jsx
    },
    'alias': 'language-javascript'
  }
}, Prism.languages.jsx.tag);

// The following will handle plain text inside tags
var stringifyToken = function (token) {
  if (!token) {
    return '';
  }
  if (typeof token === 'string') {
    return token;
  }
  if (typeof token.content === 'string') {
    return token.content;
  }
  return token.content.map(stringifyToken).join('');
};

var walkTokens = function (tokens) {
  var openedTags = [];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var notTagNorBrace = false;

    if (typeof token !== 'string') {
      if (token.type === 'tag' && token.content[0] && token.content[0].type === 'tag') {
        // We found a tag, now find its kind

        if (token.content[0].content[0].content === '</') {
          // Closing tag
          if (openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1])) {
            // Pop matching opening tag
            openedTags.pop();
          }
        } else {
          if (token.content[token.content.length - 1].content === '/>') {
            // Autoclosed tag, ignore
          } else {
            // Opening tag
            openedTags.push({
              tagName: stringifyToken(token.content[0].content[1]),
              openedBraces: 0
            });
          }
        }
      } else if (openedTags.length > 0 && token.type === 'punctuation' && token.content === '{') {

        // Here we might have entered a JSX context inside a tag
        openedTags[openedTags.length - 1].openedBraces++;

      } else if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === 'punctuation' && token.content === '}') {

        // Here we might have left a JSX context inside a tag
        openedTags[openedTags.length - 1].openedBraces--;

      } else {
        notTagNorBrace = true
      }
    }
    if (notTagNorBrace || typeof token === 'string') {
      if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
        // Here we are inside a tag, and not inside a JSX context.
        // That's plain text: drop any tokens matched.
        var plainText = stringifyToken(token);

        // And merge text with adjacent text
        if (i < tokens.length - 1 && (typeof tokens[i + 1] === 'string' || tokens[i + 1].type === 'plain-text')) {
          plainText += stringifyToken(tokens[i + 1]);
          tokens.splice(i + 1, 1);
        }
        if (i > 0 && (typeof tokens[i - 1] === 'string' || tokens[i - 1].type === 'plain-text')) {
          plainText = stringifyToken(tokens[i - 1]) + plainText;
          tokens.splice(i - 1, 1);
          i--;
        }

        tokens[i] = new Prism.Token('plain-text', plainText, null, plainText);
      }
    }

    if (token.content && typeof token.content !== 'string') {
      walkTokens(token.content);
    }
  }
};

Prism.hooks.add('after-tokenize', function (env) {
  if (env.language !== 'jsx' && env.language !== 'tsx') {
    return;
  }
  walkTokens(env.tokens);
});

}(Prism));

/* TODO
  Add support for Markdown notation inside doc comments
  Add support for nested block comments...
  Match closure params even when not followed by dash or brace
  Add better support for macro definition
*/

Prism.languages.rust = {
  'comment': [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true
    }
  ],
  'string': [
    {
      pattern: /b?r(#*)"(?:\\.|(?!"\1)[^\\\r\n])*"\1/,
      greedy: true
    },
    {
      pattern: /b?"(?:\\.|[^\\\r\n"])*"/,
      greedy: true
    }
  ],
  'char': {
    pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u{(?:[\da-fA-F]_*){1,6}|.)|[^\\\r\n\t'])'/,
    alias: 'string'
  },
  'lifetime-annotation': {
    pattern: /'[^\s>']+/,
    alias: 'symbol'
  },
  'keyword': /\b(?:abstract|alignof|as|async|await|be|box|break|const|continue|crate|do|dyn|else|enum|extern|false|final|fn|for|if|impl|in|let|loop|match|mod|move|mut|offsetof|once|override|priv|pub|pure|ref|return|sizeof|static|self|Self|struct|super|true|trait|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,

  'attribute': {
    pattern: /#!?\[.+?\]/,
    greedy: true,
    alias: 'attr-name'
  },

  'function': [
    /\w+(?=\s*\()/,
    // Macros can use parens or brackets
    /\w+!(?=\s*\(|\[)/
  ],
  'macro-rules': {
    pattern: /\w+!/,
    alias: 'function'
  },

  // Hex, oct, bin, dec numbers with visual separators and type suffix
  'number': /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:\d(?:_?\d)*)?\.?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:[iu](?:8|16|32|64)?|f32|f64))?\b/,

  // Closure params should not be confused with bitwise OR |
  'closure-params': {
    pattern: /\|[^|]*\|(?=\s*[{-])/,
    inside: {
      'punctuation': /[|:,]/,
      'operator': /[&*]/
    }
  },
  'punctuation': /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,
  'operator': /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/
};

Prism.languages.scss = Prism.languages.extend('css', {
  'comment': {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
    lookbehind: true
  },
  'atrule': {
    pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
    inside: {
      'rule': /@[\w-]+/
      // See rest below
    }
  },
  // url, compassified
  'url': /(?:[-a-z]+-)?url(?=\()/i,
  // CSS selector regex is not appropriate for Sass
  // since there can be lot more things (var, @ directive, nesting..)
  // a selector must start at the end of a property or after a brace (end of other rules or nesting)
  // it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
  // the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
  // can "pass" as a selector- e.g: proper#{$erty})
  // this one was hard to do, so please be careful if you edit this one :)
  'selector': {
    // Initial look-ahead is used to prevent matching of blank selectors
    pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()]|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
    inside: {
      'parent': {
        pattern: /&/,
        alias: 'important'
      },
      'placeholder': /%[-\w]+/,
      'variable': /\$[-\w]+|#\{\$[-\w]+\}/
    }
  },
  'property': {
    pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/,
    inside: {
      'variable': /\$[-\w]+|#\{\$[-\w]+\}/
    }
  }
});

Prism.languages.insertBefore('scss', 'atrule', {
  'keyword': [
    /@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
    {
      pattern: /( +)(?:from|through)(?= )/,
      lookbehind: true
    }
  ]
});

Prism.languages.insertBefore('scss', 'important', {
  // var and interpolated vars
  'variable': /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore('scss', 'function', {
  'placeholder': {
    pattern: /%[-\w]+/,
    alias: 'selector'
  },
  'statement': {
    pattern: /\B!(?:default|optional)\b/i,
    alias: 'keyword'
  },
  'boolean': /\b(?:true|false)\b/,
  'null': {
    pattern: /\bnull\b/,
    alias: 'keyword'
  },
  'operator': {
    pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
    lookbehind: true
  }
});

Prism.languages.scss['atrule'].inside.rest = Prism.languages.scss;

(function (Prism) {

  // CAREFUL!
  // The following patterns are concatenated, so the group referenced by a back reference is non-obvious!

  var strings = [
    // normal string
    // 1 capturing group
    /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/.source,

    // here doc
    // 1 capturing group
    /<<-?\s*(\w+?)\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\2/.source,

    // here doc quoted
    // 2 capturing group
    /<<-?\s*(["'])(\w+)\3\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\4/.source
  ].join('|');

  Prism.languages['shell-session'] = {
    'command': {
      pattern: RegExp(/\$(?:[^\r\n'"<]|<<str>>)+/.source.replace(/<<str>>/g, strings)),
      inside: {
        'bash': {
          pattern: /(\$\s*)[\s\S]+/,
          lookbehind: true,
          alias: 'language-bash',
          inside: Prism.languages.bash
        },
        'sh': {
          pattern: /^\$/,
          alias: 'important'
        }
      }
    },
    'output': {
      pattern: /.(?:.*(?:\r\n?|\n|.$))*/
      // output highlighting?
    }
  };

}(Prism));

Prism.languages.sql = {
  'comment': {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
    lookbehind: true
  },
  'variable': [
    {
      pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
      greedy: true
    },
    /@[\w.$]+/
  ],
  'string': {
    pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
    greedy: true,
    lookbehind: true
  },
  'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
  'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
  'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
  'number': /\b0x[\da-f]+\b|\b\d+\.?\d*|\B\.\d+\b/i,
  'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
  'punctuation': /[;[\]()`,.]/
};

Prism.languages.typescript = Prism.languages.extend('javascript', {
  // From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
  'keyword': /\b(?:abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/,
  'builtin': /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/,
});

Prism.languages.ts = Prism.languages.typescript;

Prism.languages.yaml = {
  'scalar': {
    pattern: /([\-:]\s*(?:![^\s]+)?[ \t]*[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\2[^\r\n]+)*)/,
    lookbehind: true,
    alias: 'string'
  },
  'comment': /#.*/,
  'key': {
    pattern: /(\s*(?:^|[:\-,[{\r\n?])[ \t]*(?:![^\s]+)?[ \t]*)[^\r\n{[\]},#\s]+?(?=\s*:\s)/,
    lookbehind: true,
    alias: 'atrule'
  },
  'directive': {
    pattern: /(^[ \t]*)%.+/m,
    lookbehind: true,
    alias: 'important'
  },
  'datetime': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?)(?=[ \t]*(?:$|,|]|}))/m,
    lookbehind: true,
    alias: 'number'
  },
  'boolean': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:true|false)[ \t]*(?=$|,|]|})/im,
    lookbehind: true,
    alias: 'important'
  },
  'null': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:null|~)[ \t]*(?=$|,|]|})/im,
    lookbehind: true,
    alias: 'important'
  },
  'string': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)("|')(?:(?!\2)[^\\\r\n]|\\.)*\2(?=[ \t]*(?:$|,|]|}|\s*#))/m,
    lookbehind: true,
    greedy: true
  },
  'number': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+\.?\d*|\.?\d+)(?:e[+-]?\d+)?|\.inf|\.nan)[ \t]*(?=$|,|]|})/im,
    lookbehind: true
  },
  'tag': /![^\s]+/,
  'important': /[&*][\w]+/,
  'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
};

Prism.languages.yml = Prism.languages.yaml;
/*
 * Cookies.js - 1.2.3
 * https://github.com/ScottHamper/Cookies
 *
 * This is free and unencumbered software released into the public domain.
 */
(function (global, undefined) {
    'use strict';

    var factory = function (window) {
        if (typeof window.document !== 'object') {
            throw new Error('Cookies.js requires a `window` with a `document` object');
        }

        var Cookies = function (key, value, options) {
            return arguments.length === 1 ?
                Cookies.get(key) : Cookies.set(key, value, options);
        };

        // Allows for setter injection in unit tests
        Cookies._document = window.document;

        // Used to ensure cookie keys do not collide with
        // built-in `Object` properties
        Cookies._cacheKeyPrefix = 'cookey.'; // Hurr hurr, :)

        Cookies._maxExpireDate = new Date('Fri, 31 Dec 9999 23:59:59 UTC');

        Cookies.defaults = {
            path: '/',
            secure: false
        };

        Cookies.get = function (key) {
            if (Cookies._cachedDocumentCookie !== Cookies._document.cookie) {
                Cookies._renewCache();
            }

            var value = Cookies._cache[Cookies._cacheKeyPrefix + key];

            return value === undefined ? undefined : decodeURIComponent(value);
        };

        Cookies.set = function (key, value, options) {
            options = Cookies._getExtendedOptions(options);
            options.expires = Cookies._getExpiresDate(value === undefined ? -1 : options.expires);

            Cookies._document.cookie = Cookies._generateCookieString(key, value, options);

            return Cookies;
        };

        Cookies.expire = function (key, options) {
            return Cookies.set(key, undefined, options);
        };

        Cookies._getExtendedOptions = function (options) {
            return {
                path: options && options.path || Cookies.defaults.path,
                domain: options && options.domain || Cookies.defaults.domain,
                expires: options && options.expires || Cookies.defaults.expires,
                secure: options && options.secure !== undefined ?  options.secure : Cookies.defaults.secure
            };
        };

        Cookies._isValidDate = function (date) {
            return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
        };

        Cookies._getExpiresDate = function (expires, now) {
            now = now || new Date();

            if (typeof expires === 'number') {
                expires = expires === Infinity ?
                    Cookies._maxExpireDate : new Date(now.getTime() + expires * 1000);
            } else if (typeof expires === 'string') {
                expires = new Date(expires);
            }

            if (expires && !Cookies._isValidDate(expires)) {
                throw new Error('`expires` parameter cannot be converted to a valid Date instance');
            }

            return expires;
        };

        Cookies._generateCookieString = function (key, value, options) {
            key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
            key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
            value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
            options = options || {};

            var cookieString = key + '=' + value;
            cookieString += options.path ? ';path=' + options.path : '';
            cookieString += options.domain ? ';domain=' + options.domain : '';
            cookieString += options.expires ? ';expires=' + options.expires.toUTCString() : '';
            cookieString += options.secure ? ';secure' : '';

            return cookieString;
        };

        Cookies._getCacheFromString = function (documentCookie) {
            var cookieCache = {};
            var cookiesArray = documentCookie ? documentCookie.split('; ') : [];

            for (var i = 0; i < cookiesArray.length; i++) {
                var cookieKvp = Cookies._getKeyValuePairFromCookieString(cookiesArray[i]);

                if (cookieCache[Cookies._cacheKeyPrefix + cookieKvp.key] === undefined) {
                    cookieCache[Cookies._cacheKeyPrefix + cookieKvp.key] = cookieKvp.value;
                }
            }

            return cookieCache;
        };

        Cookies._getKeyValuePairFromCookieString = function (cookieString) {
            // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
            var separatorIndex = cookieString.indexOf('=');

            // IE omits the "=" when the cookie value is an empty string
            separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

            var key = cookieString.substr(0, separatorIndex);
            var decodedKey;
            try {
                decodedKey = decodeURIComponent(key);
            } catch (e) {
                if (console && typeof console.error === 'function') {
                    console.error('Could not decode cookie with key "' + key + '"', e);
                }
            }

            return {
                key: decodedKey,
                value: cookieString.substr(separatorIndex + 1) // Defer decoding value until accessed
            };
        };

        Cookies._renewCache = function () {
            Cookies._cache = Cookies._getCacheFromString(Cookies._document.cookie);
            Cookies._cachedDocumentCookie = Cookies._document.cookie;
        };

        Cookies._areEnabled = function () {
            var testKey = 'cookies.js';
            var areEnabled = Cookies.set(testKey, 1).get(testKey) === '1';
            Cookies.expire(testKey);
            return areEnabled;
        };

        Cookies.enabled = Cookies._areEnabled();

        return Cookies;
    };
    var cookiesExport = (global && typeof global.document === 'object') ? factory(global) : factory;

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return cookiesExport; });
    // CommonJS/Node.js support
    } else if (typeof exports === 'object') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module === 'object' && typeof module.exports === 'object') {
            exports = module.exports = cookiesExport;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.Cookies = cookiesExport;
    } else {
        global.Cookies = cookiesExport;
    }
})(typeof window === 'undefined' ? this : window);
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList
if (!("classList" in document.createElement("_"))
  || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
    classListProp = "classList"
  , protoProp = "prototype"
  , elemCtrProto = view.Element[protoProp]
  , objCtr = Object
  , strTrim = String[protoProp].trim || function () {
    return this.replace(/^\s+|\s+$/g, "");
  }
  , arrIndexOf = Array[protoProp].indexOf || function (item) {
    var
        i = 0
      , len = this.length
    ;
    for (; i < len; i++) {
      if (i in this && this[i] === item) {
        return i;
      }
    }
    return -1;
  }
  // Vendors: please allow content code to instantiate DOMExceptions
  , DOMEx = function (type, message) {
    this.name = type;
    this.code = DOMException[type];
    this.message = message;
  }
  , checkTokenAndGetIndex = function (classList, token) {
    if (token === "") {
      throw new DOMEx(
          "SYNTAX_ERR"
        , "An invalid or illegal string was specified"
      );
    }
    if (/\s/.test(token)) {
      throw new DOMEx(
          "INVALID_CHARACTER_ERR"
        , "String contains an invalid character"
      );
    }
    return arrIndexOf.call(classList, token);
  }
  , ClassList = function (elem) {
    var
        trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
      , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
      , i = 0
      , len = classes.length
    ;
    for (; i < len; i++) {
      this.push(classes[i]);
    }
    this._updateClassName = function () {
      elem.setAttribute("class", this.toString());
    };
  }
  , classListProto = ClassList[protoProp] = []
  , classListGetter = function () {
    return new ClassList(this);
  }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
  return this[i] || null;
};
classListProto.contains = function (token) {
  token += "";
  return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
  var
      tokens = arguments
    , i = 0
    , l = tokens.length
    , token
    , updated = false
  ;
  do {
    token = tokens[i] + "";
    if (checkTokenAndGetIndex(this, token) === -1) {
      this.push(token);
      updated = true;
    }
  }
  while (++i < l);

  if (updated) {
    this._updateClassName();
  }
};
classListProto.remove = function () {
  var
      tokens = arguments
    , i = 0
    , l = tokens.length
    , token
    , updated = false
    , index
  ;
  do {
    token = tokens[i] + "";
    index = checkTokenAndGetIndex(this, token);
    while (index !== -1) {
      this.splice(index, 1);
      updated = true;
      index = checkTokenAndGetIndex(this, token);
    }
  }
  while (++i < l);

  if (updated) {
    this._updateClassName();
  }
};
classListProto.toggle = function (token, force) {
  token += "";

  var
      result = this.contains(token)
    , method = result ?
      force !== true && "remove"
    :
      force !== false && "add"
  ;

  if (method) {
    this[method](token);
  }

  if (force === true || force === false) {
    return force;
  } else {
    return !result;
  }
};
classListProto.toString = function () {
  return this.join(" ");
};

if (objCtr.defineProperty) {
  var classListPropDesc = {
      get: classListGetter
    , enumerable: true
    , configurable: true
  };
  try {
    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
  } catch (ex) { // IE 8 doesn't support enumerable:true
    // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
    // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
    if (ex.number === undefined || ex.number === -0x7FF5EC54) {
      classListPropDesc.enumerable = false;
      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    }
  }
} else if (objCtr[protoProp].__defineGetter__) {
  elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

}

// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

(function () {
  "use strict";

  var testElement = document.createElement("_");

  testElement.classList.add("c1", "c2");

  // Polyfill for IE 10/11 and Firefox <26, where classList.add and
  // classList.remove exist but support only one argument at a time.
  if (!testElement.classList.contains("c2")) {
    var createMethod = function(method) {
      var original = DOMTokenList.prototype[method];

      DOMTokenList.prototype[method] = function(token) {
        var i, len = arguments.length;

        for (i = 0; i < len; i++) {
          token = arguments[i];
          original.call(this, token);
        }
      };
    };
    createMethod('add');
    createMethod('remove');
  }

  testElement.classList.toggle("c3", false);

  // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
  // support the second argument.
  if (testElement.classList.contains("c3")) {
    var _toggle = DOMTokenList.prototype.toggle;

    DOMTokenList.prototype.toggle = function(token, force) {
      if (1 in arguments && !this.contains(token) === !force) {
        return force;
      } else {
        return _toggle.call(this, token);
      }
    };

  }

  testElement = null;
}());

};
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Adapted from: https://github.com/fred-wang/mathml.css */

(function () {
  window.addEventListener("load", function() {
    var box, div, link, namespaceURI;
    // First check whether the page contains any <math> element.
    namespaceURI = "http://www.w3.org/1998/Math/MathML";
    // Create a div to test mspace, using Kuma's "offscreen" CSS
    document.body.insertAdjacentHTML("afterbegin", "<div style='border: 0; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px;'><math xmlns='" + namespaceURI + "'><mspace height='23px' width='77px'></mspace></math></div>");
    div = document.body.firstChild;
    box = div.firstChild.firstChild.getBoundingClientRect();
    document.body.removeChild(div);
    if (Math.abs(box.height - 23) > 1  || Math.abs(box.width - 77) > 1) {
      window.supportsMathML = false;
    }
  });
}());
(function() {
  var ESCAPE_HTML_MAP, ESCAPE_HTML_REGEXP, ESCAPE_REGEXP, HIGHLIGHT_DEFAULTS, buildFragment, isAndroid, isChromeForAndroid, isIE, isIOS, isMac, requestAnimFrame, smoothDistance, smoothDuration, smoothEnd, smoothScroll, smoothStart,
    slice = [].slice;

  this.$ = function(selector, el) {
    if (el == null) {
      el = document;
    }
    try {
      return el.querySelector(selector);
    } catch (error) {

    }
  };

  this.$$ = function(selector, el) {
    if (el == null) {
      el = document;
    }
    try {
      return el.querySelectorAll(selector);
    } catch (error) {

    }
  };

  $.id = function(id) {
    return document.getElementById(id);
  };

  $.hasChild = function(parent, el) {
    if (!parent) {
      return;
    }
    while (el) {
      if (el === parent) {
        return true;
      }
      if (el === document.body) {
        return;
      }
      el = el.parentNode;
    }
  };

  $.closestLink = function(el, parent) {
    if (parent == null) {
      parent = document.body;
    }
    while (el) {
      if (el.tagName === 'A') {
        return el;
      }
      if (el === parent) {
        return;
      }
      el = el.parentNode;
    }
  };

  $.on = function(el, event, callback, useCapture) {
    var j, len, name, ref;
    if (useCapture == null) {
      useCapture = false;
    }
    if (event.indexOf(' ') >= 0) {
      ref = event.split(' ');
      for (j = 0, len = ref.length; j < len; j++) {
        name = ref[j];
        $.on(el, name, callback);
      }
    } else {
      el.addEventListener(event, callback, useCapture);
    }
  };

  $.off = function(el, event, callback, useCapture) {
    var j, len, name, ref;
    if (useCapture == null) {
      useCapture = false;
    }
    if (event.indexOf(' ') >= 0) {
      ref = event.split(' ');
      for (j = 0, len = ref.length; j < len; j++) {
        name = ref[j];
        $.off(el, name, callback);
      }
    } else {
      el.removeEventListener(event, callback, useCapture);
    }
  };

  $.trigger = function(el, type, canBubble, cancelable) {
    var event;
    if (canBubble == null) {
      canBubble = true;
    }
    if (cancelable == null) {
      cancelable = true;
    }
    event = document.createEvent('Event');
    event.initEvent(type, canBubble, cancelable);
    el.dispatchEvent(event);
  };

  $.click = function(el) {
    var event;
    event = document.createEvent('MouseEvent');
    event.initMouseEvent('click', true, true, window, null, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(event);
  };

  $.stopEvent = function(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  $.eventTarget = function(event) {
    return event.target.correspondingUseElement || event.target;
  };

  buildFragment = function(value) {
    var child, fragment, j, len, ref;
    fragment = document.createDocumentFragment();
    if ($.isCollection(value)) {
      ref = $.makeArray(value);
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        fragment.appendChild(child);
      }
    } else {
      fragment.innerHTML = value;
    }
    return fragment;
  };

  $.append = function(el, value) {
    if (typeof value === 'string') {
      el.insertAdjacentHTML('beforeend', value);
    } else {
      if ($.isCollection(value)) {
        value = buildFragment(value);
      }
      el.appendChild(value);
    }
  };

  $.prepend = function(el, value) {
    if (!el.firstChild) {
      $.append(value);
    } else if (typeof value === 'string') {
      el.insertAdjacentHTML('afterbegin', value);
    } else {
      if ($.isCollection(value)) {
        value = buildFragment(value);
      }
      el.insertBefore(value, el.firstChild);
    }
  };

  $.before = function(el, value) {
    if (typeof value === 'string' || $.isCollection(value)) {
      value = buildFragment(value);
    }
    el.parentNode.insertBefore(value, el);
  };

  $.after = function(el, value) {
    if (typeof value === 'string' || $.isCollection(value)) {
      value = buildFragment(value);
    }
    if (el.nextSibling) {
      el.parentNode.insertBefore(value, el.nextSibling);
    } else {
      el.parentNode.appendChild(value);
    }
  };

  $.remove = function(value) {
    var el, j, len, ref, ref1, ref2;
    if ($.isCollection(value)) {
      ref = $.makeArray(value);
      for (j = 0, len = ref.length; j < len; j++) {
        el = ref[j];
        if ((ref1 = el.parentNode) != null) {
          ref1.removeChild(el);
        }
      }
    } else {
      if ((ref2 = value.parentNode) != null) {
        ref2.removeChild(value);
      }
    }
  };

  $.empty = function(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  };

  $.batchUpdate = function(el, fn) {
    var parent, sibling;
    parent = el.parentNode;
    sibling = el.nextSibling;
    parent.removeChild(el);
    fn(el);
    if (sibling) {
      parent.insertBefore(el, sibling);
    } else {
      parent.appendChild(el);
    }
  };

  $.rect = function(el) {
    return el.getBoundingClientRect();
  };

  $.offset = function(el, container) {
    var left, top;
    if (container == null) {
      container = document.body;
    }
    top = 0;
    left = 0;
    while (el && el !== container) {
      top += el.offsetTop;
      left += el.offsetLeft;
      el = el.offsetParent;
    }
    return {
      top: top,
      left: left
    };
  };

  $.scrollParent = function(el) {
    var ref, ref1;
    while ((el = el.parentNode) && el.nodeType === 1) {
      if (el.scrollTop > 0) {
        break;
      }
      if ((ref = (ref1 = getComputedStyle(el)) != null ? ref1.overflowY : void 0) === 'auto' || ref === 'scroll') {
        break;
      }
    }
    return el;
  };

  $.scrollTo = function(el, parent, position, options) {
    var height, lastElementOffset, offsetBottom, offsetTop, parentHeight, parentScrollHeight, scrollTop, top;
    if (position == null) {
      position = 'center';
    }
    if (options == null) {
      options = {};
    }
    if (!el) {
      return;
    }
    if (parent == null) {
      parent = $.scrollParent(el);
    }
    if (!parent) {
      return;
    }
    parentHeight = parent.clientHeight;
    parentScrollHeight = parent.scrollHeight;
    if (!(parentScrollHeight > parentHeight)) {
      return;
    }
    top = $.offset(el, parent).top;
    offsetTop = parent.firstElementChild.offsetTop;
    switch (position) {
      case 'top':
        parent.scrollTop = top - offsetTop - (options.margin != null ? options.margin : 0);
        break;
      case 'center':
        parent.scrollTop = top - Math.round(parentHeight / 2 - el.offsetHeight / 2);
        break;
      case 'continuous':
        scrollTop = parent.scrollTop;
        height = el.offsetHeight;
        lastElementOffset = parent.lastElementChild.offsetTop + parent.lastElementChild.offsetHeight;
        offsetBottom = lastElementOffset > 0 ? parentScrollHeight - lastElementOffset : 0;
        if (top - offsetTop <= scrollTop + height * (options.topGap || 1)) {
          parent.scrollTop = top - offsetTop - height * (options.topGap || 1);
        } else if (top + offsetBottom >= scrollTop + parentHeight - height * ((options.bottomGap || 1) + 1)) {
          parent.scrollTop = top + offsetBottom - parentHeight + height * ((options.bottomGap || 1) + 1);
        }
    }
  };

  $.scrollToWithImageLock = function() {
    var args, el, image, j, len, parent, ref;
    el = arguments[0], parent = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    if (parent == null) {
      parent = $.scrollParent(el);
    }
    if (!parent) {
      return;
    }
    $.scrollTo.apply($, [el, parent].concat(slice.call(args)));
    ref = parent.getElementsByTagName('img');
    for (j = 0, len = ref.length; j < len; j++) {
      image = ref[j];
      if (!image.complete) {
        (function() {
          var onLoad, timeout, unbind;
          onLoad = function(event) {
            clearTimeout(timeout);
            unbind(event.target);
            return $.scrollTo.apply($, [el, parent].concat(slice.call(args)));
          };
          unbind = function(target) {
            return $.off(target, 'load', onLoad);
          };
          $.on(image, 'load', onLoad);
          return timeout = setTimeout(unbind.bind(null, image), 3000);
        })();
      }
    }
  };

  $.lockScroll = function(el, fn) {
    var parent, top;
    if (parent = $.scrollParent(el)) {
      top = $.rect(el).top;
      if (parent !== document.body && parent !== document.documentElement) {
        top -= $.rect(parent).top;
      }
      fn();
      parent.scrollTop = $.offset(el, parent).top - top;
    } else {
      fn();
    }
  };

  smoothScroll = smoothStart = smoothEnd = smoothDistance = smoothDuration = null;

  $.smoothScroll = function(el, end) {
    var newDistance, startTime;
    if (!window.requestAnimationFrame) {
      el.scrollTop = end;
      return;
    }
    smoothEnd = end;
    if (smoothScroll) {
      newDistance = smoothEnd - smoothStart;
      smoothDuration += Math.min(300, Math.abs(smoothDistance - newDistance));
      smoothDistance = newDistance;
      return;
    }
    smoothStart = el.scrollTop;
    smoothDistance = smoothEnd - smoothStart;
    smoothDuration = Math.min(300, Math.abs(smoothDistance));
    startTime = Date.now();
    smoothScroll = function() {
      var p, y;
      p = Math.min(1, (Date.now() - startTime) / smoothDuration);
      y = Math.max(0, Math.floor(smoothStart + smoothDistance * (p < 0.5 ? 2 * p * p : p * (4 - p * 2) - 1)));
      el.scrollTop = y;
      if (p === 1) {
        return smoothScroll = null;
      } else {
        return requestAnimationFrame(smoothScroll);
      }
    };
    return requestAnimationFrame(smoothScroll);
  };

  $.extend = function() {
    var j, key, len, object, objects, target, value;
    target = arguments[0], objects = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    for (j = 0, len = objects.length; j < len; j++) {
      object = objects[j];
      if (object) {
        for (key in object) {
          value = object[key];
          target[key] = value;
        }
      }
    }
    return target;
  };

  $.makeArray = function(object) {
    if (Array.isArray(object)) {
      return object;
    } else {
      return Array.prototype.slice.apply(object);
    }
  };

  $.arrayDelete = function(array, object) {
    var index;
    index = array.indexOf(object);
    if (index >= 0) {
      array.splice(index, 1);
      return true;
    } else {
      return false;
    }
  };

  $.isCollection = function(object) {
    return Array.isArray(object) || typeof (object != null ? object.item : void 0) === 'function';
  };

  ESCAPE_HTML_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  ESCAPE_HTML_REGEXP = /[&<>"'\/]/g;

  $.escape = function(string) {
    return string.replace(ESCAPE_HTML_REGEXP, function(match) {
      return ESCAPE_HTML_MAP[match];
    });
  };

  ESCAPE_REGEXP = /([.*+?^=!:${}()|\[\]\/\\])/g;

  $.escapeRegexp = function(string) {
    return string.replace(ESCAPE_REGEXP, "\\$1");
  };

  $.urlDecode = function(string) {
    return decodeURIComponent(string.replace(/\+/g, '%20'));
  };

  $.classify = function(string) {
    var i, j, len, substr;
    string = string.split('_');
    for (i = j = 0, len = string.length; j < len; i = ++j) {
      substr = string[i];
      string[i] = substr[0].toUpperCase() + substr.slice(1);
    }
    return string.join('');
  };

  $.framify = function(fn, obj) {
    if (window.requestAnimationFrame) {
      return function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return requestAnimationFrame(fn.bind.apply(fn, [obj].concat(slice.call(args))));
      };
    } else {
      return fn;
    }
  };

  $.requestAnimationFrame = function(fn) {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(fn);
    } else {
      setTimeout(fn, 0);
    }
  };

  $.noop = function() {};

  $.popup = function(value) {
    var win;
    try {
      win = window.open();
      if (win.opener) {
        win.opener = null;
      }
      win.location = value.href || value;
    } catch (error) {
      window.open(value.href || value, '_blank');
    }
  };

  $.isTouchScreen = function() {
    return typeof ontouchstart !== 'undefined';
  };

  $.isWindows = function() {
    var ref;
    return ((ref = navigator.platform) != null ? ref.indexOf('Win') : void 0) >= 0;
  };

  isMac = null;

  $.isMac = function() {
    var ref;
    return isMac != null ? isMac : isMac = ((ref = navigator.userAgent) != null ? ref.indexOf('Mac') : void 0) >= 0;
  };

  isIE = null;

  $.isIE = function() {
    var ref, ref1;
    return isIE != null ? isIE : isIE = ((ref = navigator.userAgent) != null ? ref.indexOf('MSIE') : void 0) >= 0 || ((ref1 = navigator.userAgent) != null ? ref1.indexOf('rv:11.0') : void 0) >= 0;
  };

  isChromeForAndroid = null;

  $.isChromeForAndroid = function() {
    var ref;
    return isChromeForAndroid != null ? isChromeForAndroid : isChromeForAndroid = ((ref = navigator.userAgent) != null ? ref.indexOf('Android') : void 0) >= 0 && /Chrome\/([.0-9])+ Mobile/.test(navigator.userAgent);
  };

  isAndroid = null;

  $.isAndroid = function() {
    var ref;
    return isAndroid != null ? isAndroid : isAndroid = ((ref = navigator.userAgent) != null ? ref.indexOf('Android') : void 0) >= 0;
  };

  isIOS = null;

  $.isIOS = function() {
    var ref, ref1;
    return isIOS != null ? isIOS : isIOS = ((ref = navigator.userAgent) != null ? ref.indexOf('iPhone') : void 0) >= 0 || ((ref1 = navigator.userAgent) != null ? ref1.indexOf('iPad') : void 0) >= 0;
  };

  $.overlayScrollbarsEnabled = function() {
    var div, result;
    if (!$.isMac()) {
      return false;
    }
    div = document.createElement('div');
    div.setAttribute('style', 'width: 100px; height: 100px; overflow: scroll; position: absolute');
    document.body.appendChild(div);
    result = div.offsetWidth === div.clientWidth;
    document.body.removeChild(div);
    return result;
  };

  HIGHLIGHT_DEFAULTS = {
    className: 'highlight',
    delay: 1000
  };

  $.highlight = function(el, options) {
    if (options == null) {
      options = {};
    }
    options = $.extend({}, HIGHLIGHT_DEFAULTS, options);
    el.classList.add(options.className);
    setTimeout((function() {
      return el.classList.remove(options.className);
    }), options.delay);
  };

  $.copyToClipboard = function(string) {
    var result, textarea;
    textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;
    textarea.value = string;
    document.body.appendChild(textarea);
    try {
      textarea.select();
      result = !!document.execCommand('copy');
    } catch (error) {
      result = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return result;
  };

  $.easing = {
    linear: function(p) {
      return p;
    },
    swing: function(p) {
      return 0.5 - (Math.cos(p * Math.PI) / 2);
    }
  };

  $.animate = (function() {
    var INTERVAL, _anim, now;
    INTERVAL = 13;
    now = function() {
      return (new Date).getTime();
    };
    _anim = function(begin, el, changeAttr, start, end, duration, easing) {
      var pos;
      pos = (now() - begin) / duration;
      if (pos >= 1.0) {
        return false;
      }
      pos = $.easing[easing](pos);
      changeAttr.call(el, start + (end - start) * pos);
      return true;
    };
    return function(el, changeAttr, start, end, duration, easing, callback) {
      var begin, step;
      begin = void 0;
      begin = now();
      duration = duration || 1000;
      easing = easing || 'swing';
      changeAttr = changeAttr || function() {};
      callback = callback || function() {};
      step = function() {
        if (_anim(begin, el, changeAttr, start, end, duration, easing)) {
          setTimeout(step, INTERVAL);
        } else {
          changeAttr.call(el, end);
          callback.call(el, el);
        }
      };
      setTimeout(step, INTERVAL);
    };
  })();

  requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  $.decouple = function(node, event, fn) {
    var captureEvent, eve, track, tracking, update;
    eve = void 0;
    tracking = false;
    captureEvent = function(e) {
      eve = e;
      track();
    };
    track = function() {
      if (!tracking) {
        requestAnimFrame(update);
        tracking = true;
      }
    };
    update = function() {
      fn.call(node, eve);
      tracking = false;
    };
    node.addEventListener(event, captureEvent, false);
    return captureEvent;
  };

}).call(this);
(function() {
  var slice = [].slice;

  this.Events = {
    on: function(event, callback) {
      var base, i, len, name, ref;
      if (event.indexOf(' ') >= 0) {
        ref = event.split(' ');
        for (i = 0, len = ref.length; i < len; i++) {
          name = ref[i];
          this.on(name, callback);
        }
      } else {
        ((base = (this._callbacks != null ? this._callbacks : this._callbacks = {}))[event] != null ? base[event] : base[event] = []).push(callback);
      }
      return this;
    },
    off: function(event, callback) {
      var callbacks, i, index, len, name, ref, ref1;
      if (event.indexOf(' ') >= 0) {
        ref = event.split(' ');
        for (i = 0, len = ref.length; i < len; i++) {
          name = ref[i];
          this.off(name, callback);
        }
      } else if ((callbacks = (ref1 = this._callbacks) != null ? ref1[event] : void 0) && (index = callbacks.indexOf(callback)) >= 0) {
        callbacks.splice(index, 1);
        if (!callbacks.length) {
          delete this._callbacks[event];
        }
      }
      return this;
    },
    trigger: function() {
      var args, callback, callbacks, event, i, len, ref, ref1;
      event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      this.eventInProgress = {
        name: event,
        args: args
      };
      if (callbacks = (ref = this._callbacks) != null ? ref[event] : void 0) {
        ref1 = callbacks.slice(0);
        for (i = 0, len = ref1.length; i < len; i++) {
          callback = ref1[i];
          if (typeof callback === "function") {
            callback.apply(null, args);
          }
        }
      }
      this.eventInProgress = null;
      if (event !== 'all') {
        this.trigger.apply(this, ['all', event].concat(slice.call(args)));
      }
      return this;
    },
    removeEvent: function(event) {
      var i, len, name, ref;
      if (this._callbacks != null) {
        ref = event.split(' ');
        for (i = 0, len = ref.length; i < len; i++) {
          name = ref[i];
          delete this._callbacks[name];
        }
      }
      return this;
    }
  };

}).call(this);
(function() {
  this.CookieStore = (function() {
    var INT;

    function CookieStore() {}

    INT = /^\d+$/;

    CookieStore.onBlocked = function() {};

    CookieStore.prototype.get = function(key) {
      var value;
      value = Cookies.get(key);
      if ((value != null) && INT.test(value)) {
        value = parseInt(value, 10);
      }
      return value;
    };

    CookieStore.prototype.set = function(key, value) {
      if (value === false) {
        this.del(key);
        return;
      }
      if (value === true) {
        value = 1;
      }
      if (value && (typeof INT.test === "function" ? INT.test(value) : void 0)) {
        value = parseInt(value, 10);
      }
      Cookies.set(key, '' + value, {
        path: '/',
        expires: 1e8
      });
      if (this.get(key) !== value) {
        this.constructor.onBlocked(key, value, this.get(key));
      }
    };

    CookieStore.prototype.del = function(key) {
      Cookies.expire(key);
    };

    CookieStore.prototype.reset = function() {
      var cookie, i, len, ref;
      try {
        ref = document.cookie.split(/;\s?/);
        for (i = 0, len = ref.length; i < len; i++) {
          cookie = ref[i];
          Cookies.expire(cookie.split('=')[0]);
        }
      } catch (error) {

      }
    };

    CookieStore.prototype.dump = function() {
      var cookie, i, len, ref, result;
      result = {};
      ref = document.cookie.split(/;\s?/);
      for (i = 0, len = ref.length; i < len; i++) {
        cookie = ref[i];
        if (!(cookie[0] !== '_')) {
          continue;
        }
        cookie = cookie.split('=');
        result[cookie[0]] = cookie[1];
      }
      return result;
    };

    return CookieStore;

  })();

}).call(this);
(function() {
  this.LocalStorageStore = (function() {
    function LocalStorageStore() {}

    LocalStorageStore.prototype.get = function(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (error) {

      }
    };

    LocalStorageStore.prototype.set = function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {

      }
    };

    LocalStorageStore.prototype.del = function(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {

      }
    };

    LocalStorageStore.prototype.reset = function() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {

      }
    };

    return LocalStorageStore;

  })();

}).call(this);

/*
 * Based on github.com/visionmedia/page.js
 * Licensed under the MIT license
 * Copyright 2012 TJ Holowaychuk <tj@vision-media.ca>
 */

(function() {
  var Context, Route, callbacks, currentPath, currentState, isSameOrigin, onclick, onpopstate, pathtoRegexp, running, track, trackers, updateCanonicalLink;

  running = false;

  currentState = null;

  callbacks = [];

  this.page = function(value, fn) {
    var route;
    if (typeof value === 'function') {
      page('*', value);
    } else if (typeof fn === 'function') {
      route = new Route(value);
      callbacks.push(route.middleware(fn));
    } else if (typeof value === 'string') {
      page.show(value, fn);
    } else {
      page.start(value);
    }
  };

  page.start = function(options) {
    if (options == null) {
      options = {};
    }
    if (!running) {
      running = true;
      addEventListener('popstate', onpopstate);
      addEventListener('click', onclick);
      page.replace(currentPath(), null, null, true);
    }
  };

  page.stop = function() {
    if (running) {
      running = false;
      removeEventListener('click', onclick);
      removeEventListener('popstate', onpopstate);
    }
  };

  page.show = function(path, state) {
    var context, previousState, res;
    if (path === (currentState != null ? currentState.path : void 0)) {
      return;
    }
    context = new Context(path, state);
    previousState = currentState;
    currentState = context.state;
    if (res = page.dispatch(context)) {
      currentState = previousState;
      location.assign(res);
    } else {
      context.pushState();
      updateCanonicalLink();
      track();
    }
    return context;
  };

  page.replace = function(path, state, skipDispatch, init) {
    var context, result;
    context = new Context(path, state || currentState);
    context.init = init;
    currentState = context.state;
    if (!skipDispatch) {
      result = page.dispatch(context);
    }
    if (result) {
      context = new Context(result);
      context.init = init;
      currentState = context.state;
      page.dispatch(context);
    }
    context.replaceState();
    updateCanonicalLink();
    if (!skipDispatch) {
      track();
    }
    return context;
  };

  page.dispatch = function(context) {
    var i, next;
    i = 0;
    next = function() {
      var fn, res;
      if (fn = callbacks[i++]) {
        res = fn(context, next);
      }
      return res;
    };
    return next();
  };

  page.canGoBack = function() {
    return !Context.isIntialState(currentState);
  };

  page.canGoForward = function() {
    return !Context.isLastState(currentState);
  };

  currentPath = function() {
    return location.pathname + location.search + location.hash;
  };

  Context = (function() {
    Context.initialPath = currentPath();

    Context.sessionId = Date.now();

    Context.stateId = 0;

    Context.isIntialState = function(state) {
      return state.id === 0;
    };

    Context.isLastState = function(state) {
      return state.id === this.stateId - 1;
    };

    Context.isInitialPopState = function(state) {
      return state.path === this.initialPath && this.stateId === 1;
    };

    Context.isSameSession = function(state) {
      return state.sessionId === this.sessionId;
    };

    function Context(path1, state1) {
      var base, base1;
      this.path = path1 != null ? path1 : '/';
      this.state = state1 != null ? state1 : {};
      this.pathname = this.path.replace(/(?:\?([^#]*))?(?:#(.*))?$/, (function(_this) {
        return function(_, query, hash) {
          _this.query = query;
          _this.hash = hash;
          return '';
        };
      })(this));
      if ((base = this.state).id == null) {
        base.id = this.constructor.stateId++;
      }
      if ((base1 = this.state).sessionId == null) {
        base1.sessionId = this.constructor.sessionId;
      }
      this.state.path = this.path;
    }

    Context.prototype.pushState = function() {
      location.href = this.path;
    };

    Context.prototype.replaceState = function() {
      try {
        history.replaceState(this.state, '', this.path);
      } catch (error) {}
    };

    return Context;

  })();

  Route = (function() {
    function Route(path1, options) {
      this.path = path1;
      if (options == null) {
        options = {};
      }
      this.keys = [];
      this.regexp = pathtoRegexp(this.path, this.keys);
    }

    Route.prototype.middleware = function(fn) {
      return (function(_this) {
        return function(context, next) {
          var params;
          if (_this.match(context.pathname, params = [])) {
            context.params = params;
            return fn(context, next);
          } else {
            return next();
          }
        };
      })(this);
    };

    Route.prototype.match = function(path, params) {
      var i, j, key, len, matchData, ref, value;
      if (!(matchData = this.regexp.exec(path))) {
        return;
      }
      ref = matchData.slice(1);
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        value = ref[i];
        if (typeof value === 'string') {
          value = decodeURIComponent(value);
        }
        if (key = this.keys[i]) {
          params[key.name] = value;
        } else {
          params.push(value);
        }
      }
      return true;
    };

    return Route;

  })();

  pathtoRegexp = function(path, keys) {
    if (path instanceof RegExp) {
      return path;
    }
    if (path instanceof Array) {
      path = "(" + (path.join('|')) + ")";
    }
    path = path.replace(/\/\(/g, '(?:/').replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
      var str;
      if (slash == null) {
        slash = '';
      }
      if (format == null) {
        format = '';
      }
      keys.push({
        name: key,
        optional: !!optional
      });
      str = optional ? '' : slash;
      str += '(?:';
      if (optional) {
        str += slash;
      }
      str += format;
      str += capture || (format ? '([^/.]+?)' : '([^/]+?)');
      str += ')';
      if (optional) {
        str += optional;
      }
      return str;
    }).replace(/([\/.])/g, '\\$1').replace(/\*/g, '(.*)');
    return new RegExp("^" + path + "$");
  };

  onpopstate = function(event) {
    if (!event.state || Context.isInitialPopState(event.state)) {
      return;
    }
    if (Context.isSameSession(event.state)) {
      page.replace(event.state.path, event.state);
    } else {
      location.reload();
    }
  };

  onclick = function(event) {
    var link, path;
    try {
      if (event.which !== 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.defaultPrevented) {
        return;
      }
    } catch (error) {
      return;
    }
    link = $.eventTarget(event);
    while (link && link.tagName !== 'A') {
      link = link.parentNode;
    }
    if (link && !link.target && isSameOrigin(link.href)) {
      path = link.pathname + link.search + link.hash;
      path = path.replace(/^\/\/+/, '/');
      page.show(path);
    }
  };

  isSameOrigin = function(url) {
    return url.indexOf(location.protocol + "//" + location.hostname) === 0;
  };

  updateCanonicalLink = function() {
    this.canonicalLink || (this.canonicalLink = document.head.querySelector('link[rel="canonical"]'));
    return this.canonicalLink.setAttribute('href', "http://" + location.host + location.pathname);
  };

  trackers = [];

  page.track = function(fn) {
    trackers.push(fn);
  };

  track = function() {
    var j, len, tracker;
    for (j = 0, len = trackers.length; j < len; j++) {
      tracker = trackers[j];
      tracker.call();
    }
  };

}).call(this);
(function() {
  var supportsCssGradients,
    slice = [].slice;

  this.app = {
    _$: $,
    _$$: $$,
    _page: page,
    collections: {},
    models: {},
    templates: {},
    views: {},
    init: function() {
      new Lazyload('._list ._list-item', {});
      this.el = $('._app');
      this.localStorage = new LocalStorageStore;
      this.router = new app.Router;
      this.shortcuts = new app.Shortcuts;
      if (this.DOC) {
        this.docs = new app.collections.Docs;
        this.disabledDocs = new app.collections.Docs;
        this.entries = new app.collections.Entries;
        this.document = new app.views.Document;
        this.mobile = new app.views.Mobile;
        this.bootOne();
      } else {
        this.bootNDoc();
      }
    },
    browserCheck: function() {
      if (this.isSupportedBrowser()) {
        return true;
      }
      document.body.innerHTML = app.templates.unsupportedBrowser;
      this.hideLoadingScreen();
      return false;
    },
    initErrorTracking: function() {
      var ref, ref1;
      if (this.isInvalidLocation()) {
        new app.views.Notif('InvalidLocation');
      } else {
        if (this.config.sentry_dsn) {
          Raven.config(this.config.sentry_dsn, {
            release: this.config.release,
            whitelistUrls: [/devdocs/],
            includePaths: [/devdocs/],
            ignoreErrors: [/NPObject/, /NS_ERROR/, /^null$/, /EvalError/],
            tags: {
              mode: this.isSingleDoc() ? 'single' : 'full',
              iframe: (window.top !== window).toString(),
              electron: (!!((ref = window.process) != null ? (ref1 = ref.versions) != null ? ref1.electron : void 0 : void 0)).toString()
            },
            shouldSendCallback: (function(_this) {
              return function() {
                try {
                  if (_this.isInjectionError()) {
                    _this.onInjectionError();
                    return false;
                  }
                  if (_this.isAndroidWebview()) {
                    return false;
                  }
                } catch (error1) {}
                return true;
              };
            })(this),
            dataCallback: function(data) {
              try {
                $.extend(data.user || (data.user = {}), app.settings.dump());
                if (data.user.docs) {
                  data.user.docs = data.user.docs.split('/');
                }
                if (app.lastIDBTransaction) {
                  data.user.lastIDBTransaction = app.lastIDBTransaction;
                }
                data.tags.scriptCount = document.scripts.length;
              } catch (error1) {}
              return data;
            }
          }).install();
        }
        this.previousErrorHandler = onerror;
        window.onerror = this.onWindowError.bind(this);
        CookieStore.onBlocked = this.onCookieBlocked;
      }
    },
    bootOne: function() {
      this.doc = new app.models.Doc(this.DOC);
      this.docs.reset([this.doc]);
      this.doc.reset(app.INDEXDOC);
      this.start();
    },
    bootNDoc: function() {
      this.trigger('ready');
    },
    bootAll: function() {
      var doc, docs, i, len, ref;
      docs = this.settings.getDocs();
      ref = this.DOCS;
      for (i = 0, len = ref.length; i < len; i++) {
        doc = ref[i];
        (docs.indexOf(doc.slug) >= 0 ? this.docs : this.disabledDocs).add(doc);
      }
      this.migrateDocs();
      this.docs.sort();
      this.disabledDocs.sort();
      this.docs.load(this.start.bind(this), this.onBootError.bind(this), {
        readCache: true,
        writeCache: true
      });
      delete this.DOCS;
    },
    start: function() {
      var doc, i, j, k, len, len1, len2, ref, ref1, ref2;
      ref = this.docs.all();
      for (i = 0, len = ref.length; i < len; i++) {
        doc = ref[i];
        this.entries.add(doc.toEntry());
      }
      ref1 = this.disabledDocs.all();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        doc = ref1[j];
        this.entries.add(doc.toEntry());
      }
      ref2 = this.docs.all();
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        doc = ref2[k];
        this.initDoc(doc);
      }
      this.trigger('ready');
      this.router.start();
      this.removeEvent('ready bootError');
    },
    initDoc: function(doc) {
      var i, len, ref, type;
      ref = doc.types.all();
      for (i = 0, len = ref.length; i < len; i++) {
        type = ref[i];
        this.entries.add(type.toEntry());
      }
      this.entries.add(doc.entries.all());
    },
    migrateDocs: function() {
      var doc, i, len, needsSaving, ref, slug;
      ref = this.settings.getDocs();
      for (i = 0, len = ref.length; i < len; i++) {
        slug = ref[i];
        if (!(!this.docs.findBy('slug', slug))) {
          continue;
        }
        needsSaving = true;
        if (slug === 'webpack~2') {
          doc = this.disabledDocs.findBy('slug', 'webpack');
        }
        if (slug === 'angular~4_typescript') {
          doc = this.disabledDocs.findBy('slug', 'angular');
        }
        if (slug === 'angular~2_typescript') {
          doc = this.disabledDocs.findBy('slug', 'angular~2');
        }
        doc || (doc = this.disabledDocs.findBy('slug_without_version', slug));
        if (doc) {
          this.disabledDocs.remove(doc);
          this.docs.add(doc);
        }
      }
      if (needsSaving) {
        this.saveDocs();
      }
    },
    enableDoc: function(doc, _onSuccess, onError) {
      var onSuccess;
      if (this.docs.contains(doc)) {
        return;
      }
      onSuccess = (function(_this) {
        return function() {
          if (_this.docs.contains(doc)) {
            return;
          }
          _this.disabledDocs.remove(doc);
          _this.docs.add(doc);
          _this.docs.sort();
          _this.initDoc(doc);
          _this.saveDocs();
          _onSuccess();
        };
      })(this);
      doc.load(onSuccess, onError, {
        writeCache: true
      });
    },
    saveDocs: function() {
      var doc, ref;
      this.settings.setDocs((function() {
        var i, len, ref, results;
        ref = this.docs.all();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          doc = ref[i];
          results.push(doc.slug);
        }
        return results;
      }).call(this));
      this.db.migrate();
      return (ref = this.appCache) != null ? ref.updateInBackground() : void 0;
    },
    welcomeBack: function() {
      var visitCount;
      visitCount = this.settings.get('count');
      this.settings.set('count', ++visitCount);
      if (visitCount === 5) {
        new app.views.Notif('Share', {
          autoHide: null
        });
      }
      new app.views.News();
      new app.views.Updates();
      return this.updateChecker = new app.UpdateChecker();
    },
    reload: function() {
      this.docs.clearCache();
      this.disabledDocs.clearCache();
      if (this.appCache) {
        this.appCache.reload();
      } else {
        window.location = '/';
      }
    },
    reset: function() {
      var ref, ref1;
      this.localStorage.reset();
      this.settings.reset();
      if ((ref = this.db) != null) {
        ref.reset();
      }
      if ((ref1 = this.appCache) != null) {
        ref1.update();
      }
      window.location = '/';
    },
    showTip: function(tip) {
      var tips;
      if (this.isSingleDoc()) {
        return;
      }
      tips = this.settings.getTips();
      if (tips.indexOf(tip) === -1) {
        tips.push(tip);
        this.settings.setTips(tips);
        new app.views.Tip(tip);
      }
    },
    hideLoadingScreen: function() {
      if ($.overlayScrollbarsEnabled()) {
        document.body.classList.add('_overlay-scrollbars');
      }
      document.documentElement.classList.remove('_booting');
    },
    indexHost: function() {
      return this.config[this.appCache && this.settings.hasDocs() ? 'index_path' : 'docs_origin'];
    },
    onBootError: function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.trigger('bootError');
      this.hideLoadingScreen();
    },
    onQuotaExceeded: function() {
      if (this.quotaExceeded) {
        return;
      }
      this.quotaExceeded = true;
      new app.views.Notif('QuotaExceeded', {
        autoHide: null
      });
    },
    onCookieBlocked: function(key, value, actual) {
      if (this.cookieBlocked) {
        return;
      }
      this.cookieBlocked = true;
      new app.views.Notif('CookieBlocked', {
        autoHide: null
      });
      Raven.captureMessage("CookieBlocked/" + key, {
        level: 'warning',
        extra: {
          value: value,
          actual: actual
        }
      });
    },
    onWindowError: function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.cookieBlocked) {
        return;
      }
      if (this.isInjectionError.apply(this, args)) {
        this.onInjectionError();
      } else if (this.isAppError.apply(this, args)) {
        if (typeof this.previousErrorHandler === "function") {
          this.previousErrorHandler.apply(this, args);
        }
        this.hideLoadingScreen();
        this.errorNotif || (this.errorNotif = new app.views.Notif('Error'));
        this.errorNotif.show();
      }
    },
    onInjectionError: function() {
      if (!this.injectionError) {
        this.injectionError = true;
        alert("JavaScript code has been injected in the page which prevents DevDocs from running correctly.\nPlease check your browser extensions/addons. ");
        Raven.captureMessage('injection error', {
          level: 'info'
        });
      }
    },
    isInjectionError: function() {
      return window.$ !== app._$ || window.$$ !== app._$$ || window.page !== app._page || typeof $.empty !== 'function' || typeof page.show !== 'function';
    },
    isAppError: function(error, file) {
      return file && file.indexOf('devdocs') !== -1 && file.indexOf('.js') === file.length - 3;
    },
    isSupportedBrowser: function() {
      var error, features, key, value;
      try {
        features = {
          bind: !!Function.prototype.bind,
          pushState: !!history.pushState,
          matchMedia: !!window.matchMedia,
          insertAdjacentHTML: !!document.body.insertAdjacentHTML,
          defaultPrevented: document.createEvent('CustomEvent').defaultPrevented === false,
          cssGradients: supportsCssGradients()
        };
        for (key in features) {
          value = features[key];
          if (!(!value)) {
            continue;
          }
          Raven.captureMessage("unsupported/" + key, {
            level: 'info'
          });
          return false;
        }
        return true;
      } catch (error1) {
        error = error1;
        Raven.captureMessage('unsupported/exception', {
          level: 'info',
          extra: {
            error: error
          }
        });
        return false;
      }
    },
    isSingleDoc: function() {
      return !!(this.DOC || this.doc);
    },
    isMobile: function() {
      return this._isMobile != null ? this._isMobile : this._isMobile = app.views.Mobile.detect();
    },
    isAndroidWebview: function() {
      return this._isAndroidWebview != null ? this._isAndroidWebview : this._isAndroidWebview = app.views.Mobile.detectAndroidWebview();
    },
    isInvalidLocation: function() {
      return this.config.env === 'production' && location.host.indexOf(app.config.production_host) !== 0;
    }
  };

  supportsCssGradients = function() {
    var el;
    el = document.createElement('div');
    el.style.cssText = "background-image: -webkit-linear-gradient(top, #000, #fff); background-image: linear-gradient(to top, #000, #fff);";
    return el.style.backgroundImage.indexOf('gradient') >= 0;
  };

  $.extend(app, Events);

}).call(this);
var app = app ||  {};
app.config = {
    db_filename: "db.json",
    default_docs: ["css", "dom", "dom_events", "html", "http", "javascript"],
    docs_origin: "//docs.w3cub.com",
    env: "production",
    history_cache_size: 10,
    index_filename: "index.json",
    index_path: "/docs",
    max_results: 50,
    production_host: "docs.w3cub.com",
    search_param: "q",
    sentry_dsn: "https://5df3f4c982314008b52b799b1f25ad9d@app.getsentry.com/11245",
    version: 1462140802,
    mathml_stylesheet: "https://cdn.devdocs.io/mathml.css"
}


app.collections = {};
app.models = {};
app.views = {};


~
function(window, undefined) {



    Lazyload.SENCER = 30;
    var noop = function() {};

    // Lazyload Component
    function Lazyload(elements, opts) {
        var self = this;

        this.tag = "data-src";
        this.distance = 0;
        this.callback = noop;
        this._pause = false;

        // mixin
        var opts = opts || {};
        for (var key in opts) {
            this[key] = opts[key];
        }

        this.elements = typeof elements === "string" ? $(elements) : elements;
        this.wrapper = window;
        setTimeout(function() {
            self.init();
        }, 4);
    };

    // init, bind event
    Lazyload.prototype.init = function() {
        var self = this;
        self._detectElementIfInScreen();

        var timer;
        addEventListener(this.wrapper, "scroll", function() {
            timer && clearTimeout(timer);
            timer = setTimeout(function() {
                self._detectElementIfInScreen();
            }, Lazyload.SENCER);
        });
        addEventListener(window, "resize", function() {
            timer && clearTimeout(timer);
            self._detectElementIfInScreen();
        });
    };

    // detect if in screen
    Lazyload.prototype._detectElementIfInScreen = function() {

        if (!this.elements.length || this._pause) return;

        var W = window.innerWidth || document.documentElement.clientWidth;
        var H = window.innerHeight || document.documentElement.clientHeight;

        for (var i = 0, len = this.elements.length; i < len; i++) {
            var ele = this.elements[i];
            var rect = ele.getBoundingClientRect();
            if ((rect.top >= this.distance && rect.left >= this.distance || rect.top < 0 && (rect.top + rect.height) >= this.distance || rect.left < 0 && (rect.left + rect.width >= this.distance)) && rect.top <= H && rect.left <= W) {
                this.loadItem(ele);
                this.elements.splice(i, 1);
                i--;
                len--;
            }
        }

        if (!this.elements.length) {
            this.callback && this.callback();
        }
    };

    Lazyload.prototype.pause = function() {
        this._pause = true;
        return this;
    };

    Lazyload.prototype.restart = function() {
        this._pause = false;
        this._detectElementIfInScreen();
        return this;
    };

    // lazyload img or script
    Lazyload.prototype.loadItem = function(ele) {
        var imgs = ele.getElementsByTagName("img");
        for (var i = 0, len = imgs.length; i < len; i++) {
            var img = imgs[i];
            var src = img.getAttribute(this.tag);
            if (src) {
                img.setAttribute("src", src);
            }
        }
    };

    // mini Query
    function $(query) {
        var res = [];
        if (document.querySelectorAll) {
            res = document.querySelectorAll(query);
        } else {
            var firstStyleSheet = document.styleSheets[0] || document.createStyleSheet();
            firstStyleSheet.addRule(query, 'Terry:Cai');
            for (var i = 0, len = document.all.length; i < len; i++) {
                var item = document.all[i];
                item.currentStyle.Barret && res.push(item);
            }
            firstStyleSheet.removeRule(0);
        }
        if (res.item) { /* Fuck IE8 */
            var ret = [];
            for (var i = 0, len = res.length; i < len; i++) {
                ret.push(res.item(i));
            }
            res = ret;
        }
        return res;
    };

    function addEventListener(el, evt, fn) {
        window.addEventListener ? el.addEventListener(evt, fn, false) : (window.attachEvent) ? el.attachEvent('on' + evt, fn) : el['on' + evt] = fn;
    }

    window["Lazyload"] = Lazyload;

}(window, void 0);
const detectAdBlocker = () => {
  const blockedElement = document.createElement("div");
  blockedElement.className =
    "pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner";
  blockedElement.setAttribute(
    "style",
    "width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;",
  );
  document.body.appendChild(blockedElement);
  return (
    window.document.body.getAttribute("abp") != null ||
    blockedElement.offsetParent == null ||
    blockedElement.offsetHeight === 0 ||
    blockedElement.offsetLeft === 0 ||
    blockedElement.offsetTop === 0 ||
    blockedElement.offsetWidth === 0 ||
    blockedElement.clientHeight === 0 ||
    blockedElement.clientWidth === 0
  );
}
var app = app || {};
window.reload2022 = () => {
  location.reload()
}
window.redirect2022 = (url) => {
  location.href = url
}

function getCookie(name) {
  var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}
function setCookie(name, value, days) {
  var d = new Date;
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

var makeElement = () => {
  var blockElement = document.createElement("div");
  blockElement.className = "el-container"
  document.body.classList.add("el-dialog_active")
  blockElement.innerHTML = `
  <style type="text/css">
  body.el-dialog_active {
    overflow: hidden !important;
  }
  .el-dialog-overlay {
    position: fixed;
    background-color: #000;
    z-index: 1023;
    height: 100%;
    width: 100%;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .el-dialog-overlay.active {
    opacity: 0.6;
  }

  .el-dialog-overlay:not(.active),
  .el-dialog:not(.el-dialog-show) {
    display: none;
  }

  .el-dialog {
    color: #000;
    position: fixed;
    z-index: 1024;
    border-radius: 2px;
    width: 35%;
    background-color: #fff;
    box-shadow: 0 2px 2px 0 rgb(0 0 0 / 7%);
    left: 35%;
    top: 15%;
    font-size: 16px;
    text-align: center;
    border-radius: 10px;
  }

  .el-dialog-title {
    padding: 24px 24px 20px;
    font-size: 20px;
    color: #000;
    line-height: 1;
    padding-top: 0;
  }

  .el-dialog-content {
    text-align: justify;
    padding: 24px;
    padding-top: 0;
  }

  .el-dialog-message {
    margin: 0;
    padding: 0;
    color: #000;
    font-size: 13px;
    line-height: 1.5;
  }

  .el-dialog-icon.logo {
    width: 100px;
    padding: 1rem;
  }

  .el-dialog {
    padding: 10px;
  }

  .el-dialog-footer {
    padding: 10px;
    padding-top: 0;
  }

  .el-dialog-footer a {
    background-color: #372ac7;
    color: #ffffff;
    width: 100%;
  }

  .el-dialog:not(.el-dialog-show) {
    display: none;
  }

  .el-dialog .el-dialog_body .el-dialog_image_wrapper {
    padding-top: 1rem;
    padding-bottom: 0;
  }

  .el-dialog .el-dialog_body .el-dialog_content .title {
    font-size: 25px;
    font-weight: 400;
    margin: 1rem;
  }

  .el-dialog .el-dialog_body .el-dialog_content .subtitle {
    padding: 0 1rem;
  }

  .el-dialog_buttons {
    width: 100%;
    align-items: center;
    display: flex;
    justify-content: space-around;
    border-top: 1px solid #d6d6d6;
    border-bottom: 1px solid #d6d6d6;
  }

  .el-dialog_buttons_row+.el-dialog_buttons_row {
    border-left: 1px solid #d6d6d6;
  }

  .el-dialog_buttons .el-dialog_buttons_row {
    flex: 1 1 auto;
    padding: 1rem;
  }

  .el-dialog_buttons_row div {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    margin-bottom: 0.3rem;
  }

  .el-dialog_buttons_row button {
    background: #ED1E45;
    border: 1px solid #ED1E45;
    width: 90%;
    padding: 0.4rem;
    color: #fff;
    text-transform: uppercase;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    border-radius: 0.3rem;
  }

  .el-dialog_footer {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
  }

  .el-dialog_footer a,
  .el-dialog_footer a:focus {
    text-decoration: none;
    color: #000;
    font-size: 12px;
    font-weight: bold;
    border: none;
    outline: none;
  }

  @media only screen and (max-width:800px) {
    .el-dialog,
    .el-dialog {
      width: calc(35% + 25%);
      left: calc(35% - 10%);
      top: 10%;
    }
  }

  @media only screen and (max-width:500px) {
    .el-dialog,
    .el-dialog {
      width: 95%;
      left: 2%;
      top: 5%;
    }
  }
</style>
<div class="el-dialog-overlay active" id="el-dialog-overlay" tabindex="-1"></div>
<div class="el-dialog el-dialog-hide el-dialog-show" id="el-dialog-modal">
  <div class="el-dialog-modal-container" id="el-dialog-modal-container">
    <div class="el-dialog_body">
      <div class="el-dialog-wrapper">
        <img  src="/images/antivda.svg" class="el-dialog-icon logo" alt="" />
      </div>
      <div class="el-dialog_content">
        <p class="title">Ads Blocker Detected!!!</p>
        <p class="subtitle">We have detected that you are using extensions to block ads. Please support us by disabling
          these ads blocker.</p>
        <div class="el-dialog_buttons">
          <div class="el-dialog_buttons_row">
            <p>Disable Ad Block</p>
            <button type="button" onclick="reload2022()">I've disable Adblock</button>
          </div>
          <div class="el-dialog_buttons_row">
            <p>Donate me</p>
            <button type="button" onclick="redirect2022('/about/')">Go to Donate me</button>
          </div>
        </div>
      </div>
    </div>
    <div class="el-dialog_footer">
      <a href="/about/#whitelist">How to Whitelist a Website?</a>
      <a href="/privacy-policy">Privacy Policy</a>
    </div>
  </div>
</div>
`
  document.body.appendChild(blockElement);
}

const creaBlocktElement = () => {
  setTimeout(() => {
    // exist adblock or had been detected
    if (getCookie('vda') != '1') {
      if (detectAdBlocker()) {
        // body append the anti adblocker element
        makeElement()
      }
    }
  }, 1000)
}

const buildPromotion = () => {
  if (getCookie('tp') != '1'){
    setTimeout(() => {
      window.open('https://tools.w3cub.com/?_sp=docs', '_blank')
      setCookie('tp', 1, 30)
    }, 3000)
  }
}

app.on('ready', () => {
  buildPromotion();
  fetch('/conf/conf.json').then(res => res.json()).then(res => {
    if (res.vda.action) {
      creaBlocktElement()
    }
  }).catch(err => {
    creaBlocktElement()
  })
})



;
(function() {
  app.Router = (function() {
    $.extend(Router.prototype, Events);

    Router.routes = [['*', 'before'], ['/', 'root'], ['/settings', 'settings'], ['/offline', 'offline'], ['/about', 'about'], ['/news', 'news'], ['/help', 'help'], ['/:doc-:type/', 'type'], ['/:doc/', 'doc'], ['/:doc/:path(*)', 'entry'], ['*', 'notFound']];

    function Router() {
      var i, len, method, path, ref, ref1;
      ref = this.constructor.routes;
      for (i = 0, len = ref.length; i < len; i++) {
        ref1 = ref[i], path = ref1[0], method = ref1[1];
        page(path, this[method].bind(this));
      }
      this.setInitialPath();
    }

    Router.prototype.start = function() {
      page.start();
    };

    Router.prototype.show = function(path) {
      page.show(path);
    };

    Router.prototype.triggerRoute = function(name) {
      this.trigger(name, this.context);
      this.trigger('after', name, this.context);
    };

    Router.prototype.before = function(context, next) {
      var previousContext, res;
      previousContext = this.context;
      this.context = context;
      this.trigger('before', context);
      if (res = next()) {
        this.context = previousContext;
        return res;
      } else {

      }
    };

    Router.prototype.doc = function(context, next) {
      var doc;
      if (doc = app.docs.findBySlug(context.params.doc) || app.disabledDocs.findBySlug(context.params.doc)) {
        context.doc = doc;
        context.entry = doc.toEntry();
        this.triggerRoute('entry');
      } else {
        return next();
      }
    };

    Router.prototype.type = function(context, next) {
      var doc, type;
      doc = app.docs.findBySlug(context.params.doc);
      if (type = doc != null ? doc.types.findBy('slug', context.params.type) : void 0) {
        context.doc = doc;
        context.type = type;
        this.triggerRoute('type');
      } else {
        return next();
      }
    };

    Router.prototype.entry = function(context, next) {
      var doc, entry;
      doc = app.docs.findBySlug(context.params.doc);
      if (entry = doc != null ? doc.findEntryByPathAndHash(context.params.path, context.hash) : void 0) {
        context.doc = doc;
        context.entry = entry;
        this.triggerRoute('entry');
      } else {
        return next();
      }
    };

    Router.prototype.root = function() {
      if (app.isSingleDoc()) {
        return '/';
      }
      this.triggerRoute('root');
    };

    Router.prototype.settings = function(context) {
      if (app.isSingleDoc()) {
        return "/#/" + context.path;
      }
      this.triggerRoute('settings');
    };

    Router.prototype.offline = function(context) {
      if (app.isSingleDoc()) {
        return "/#/" + context.path;
      }
      this.triggerRoute('offline');
    };

    Router.prototype.about = function(context) {
      if (app.isSingleDoc()) {
        return "/#/" + context.path;
      }
      context.page = 'about';
      this.triggerRoute('page');
    };

    Router.prototype.news = function(context) {
      if (app.isSingleDoc()) {
        return "/#/" + context.path;
      }
      context.page = 'news';
      this.triggerRoute('page');
    };

    Router.prototype.help = function(context) {
      if (app.isSingleDoc()) {
        return "/#/" + context.path;
      }
      context.page = 'help';
      this.triggerRoute('page');
    };

    Router.prototype.notFound = function(context) {
      this.triggerRoute('notFound');
    };

    Router.prototype.isRoot = function() {
      return location.pathname === '/';
    };

    Router.prototype.isDocIndex = function() {
      return this.isIndex();
    };

    Router.prototype.isIndex = function() {
      var ref, ref1, ref2;
      return ((ref = this.context) != null ? ref.path : void 0) === '/' || (app.isSingleDoc() && ((ref1 = this.context) != null ? (ref2 = ref1.entry) != null ? ref2.isIndex() : void 0 : void 0));
    };

    Router.prototype.setInitialPath = function() {
      var path;
      if ((path = location.pathname.replace(/^\/{2,}/g, '/')) !== location.pathname) {
        page.replace(path + location.search + location.hash, null, true);
      }
      if (location.pathname === '/') {
        if (path = this.getInitialPathFromHash()) {
          page.replace(path + location.search, null, true);
        } else if (path = this.getInitialPathFromCookie()) {
          page.replace(path + location.search + location.hash, null, true);
        }
      }
    };

    Router.prototype.getInitialPathFromHash = function() {
      var ref;
      try {
        return (ref = (new RegExp("#/(.+)")).exec(decodeURIComponent(location.hash))) != null ? ref[1] : void 0;
      } catch (error) {

      }
    };

    Router.prototype.getInitialPathFromCookie = function() {
      var path;
      if (path = Cookies.get('initial_path')) {
        Cookies.expire('initial_path');
        return path;
      }
    };

    Router.prototype.replaceHash = function(hash) {
      page.replace(location.pathname + location.search + (hash || ''), null, true);
    };

    return Router;

  })();

}).call(this);
(function() {
  var SEPARATOR, fuzzyRegexp, i, index, lastIndex, match, matchIndex, matchLength, matcher, query, queryLength, score, separators, value, valueLength,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SEPARATOR = '.';

  query = queryLength = value = valueLength = matcher = fuzzyRegexp = index = lastIndex = match = matchIndex = matchLength = score = separators = i = null;

  function exactMatch() {;

  index = value.indexOf(query);

  if (!(index >= 0)) {
    return;
  }

  lastIndex = value.lastIndexOf(query);

  if (index !== lastIndex) {
    return Math.max(scoreExactMatch(), ((index = lastIndex) && scoreExactMatch()) || 0);
  } else {
    return scoreExactMatch();
  }

  };

  function scoreExactMatch() {;

  score = 100 - (valueLength - queryLength);

  if (index > 0) {
    if (value.charAt(index - 1) === SEPARATOR) {
      score += index - 1;
    } else if (queryLength === 1) {
      return;
    } else {
      i = index - 2;
      while (i >= 0 && value.charAt(i) !== SEPARATOR) {
        i--;
      }
      score -= (index - i) + (valueLength - queryLength - index);
    }
    separators = 0;
    i = index - 2;
    while (i >= 0) {
      if (value.charAt(i) === SEPARATOR) {
        separators++;
      }
      i--;
    }
    score -= separators;
  }

  separators = 0;

  i = valueLength - queryLength - index - 1;

  while (i >= 0) {
    if (value.charAt(index + queryLength + i) === SEPARATOR) {
      separators++;
    }
    i--;
  }

  score -= separators * 5;

  return Math.max(1, score);

  };

  function fuzzyMatch() {;

  if (valueLength <= queryLength || value.indexOf(query) >= 0) {
    return;
  }

  if (!(match = fuzzyRegexp.exec(value))) {
    return;
  }

  matchIndex = match.index;

  matchLength = match[0].length;

  score = scoreFuzzyMatch();

  if (match = fuzzyRegexp.exec(value.slice(i = value.lastIndexOf(SEPARATOR) + 1))) {
    matchIndex = i + match.index;
    matchLength = match[0].length;
    return Math.max(score, scoreFuzzyMatch());
  } else {
    return score;
  }

  };

  function scoreFuzzyMatch() {;

  if (matchIndex === 0 || value.charAt(matchIndex - 1) === SEPARATOR) {
    return Math.max(66, 100 - matchLength);
  } else if (matchIndex + matchLength === valueLength) {
    return Math.max(33, 67 - matchLength);
  } else {
    return Math.max(1, 34 - matchLength);
  }

  };

  app.Searcher = (function() {
    var CHUNK_SIZE, DEFAULTS, DOT_REGEXP, ELLIPSIS, EMPTY_PARANTHESES_REGEXP, EMPTY_STRING, EOS_SEPARATORS_REGEXP, EVENT_REGEXP, INFO_PARANTHESES_REGEXP, SEPARATORS_REGEXP, STRING, WHITESPACE_REGEXP;

    $.extend(Searcher.prototype, Events);

    CHUNK_SIZE = 20000;

    DEFAULTS = {
      max_results: app.config.max_results,
      fuzzy_min_length: 3
    };

    SEPARATORS_REGEXP = /#|::|:-|->|\$(?=\w)|\-(?=\w)|\:(?=\w)|\ [\/\-&]\ |:\ |\ /g;

    EOS_SEPARATORS_REGEXP = /(\w)[\-:]$/;

    INFO_PARANTHESES_REGEXP = /\ \(\w+?\)$/;

    EMPTY_PARANTHESES_REGEXP = /\(\)/;

    EVENT_REGEXP = /\ event$/;

    DOT_REGEXP = /\.+/g;

    WHITESPACE_REGEXP = /\s/g;

    EMPTY_STRING = '';

    ELLIPSIS = '...';

    STRING = 'string';

    Searcher.normalizeString = function(string) {
      return string.toLowerCase().replace(ELLIPSIS, EMPTY_STRING).replace(EVENT_REGEXP, EMPTY_STRING).replace(INFO_PARANTHESES_REGEXP, EMPTY_STRING).replace(SEPARATORS_REGEXP, SEPARATOR).replace(DOT_REGEXP, SEPARATOR).replace(EMPTY_PARANTHESES_REGEXP, EMPTY_STRING).replace(WHITESPACE_REGEXP, EMPTY_STRING);
    };

    Searcher.normalizeQuery = function(string) {
      string = this.normalizeString(string);
      return string.replace(EOS_SEPARATORS_REGEXP, '$1.');
    };

    function Searcher(options) {
      if (options == null) {
        options = {};
      }
      this.matchChunks = bind(this.matchChunks, this);
      this.match = bind(this.match, this);
      this.options = $.extend({}, DEFAULTS, options);
    }

    Searcher.prototype.find = function(data, attr, q) {
      this.kill();
      this.data = data;
      this.attr = attr;
      this.query = q;
      this.setup();
      if (this.isValid()) {
        this.match();
      } else {
        this.end();
      }
    };

    Searcher.prototype.setup = function() {
      query = this.query = this.constructor.normalizeQuery(this.query);
      queryLength = query.length;
      this.dataLength = this.data.length;
      this.matchers = [exactMatch];
      this.totalResults = 0;
      this.setupFuzzy();
    };

    Searcher.prototype.setupFuzzy = function() {
      if (queryLength >= this.options.fuzzy_min_length) {
        fuzzyRegexp = this.queryToFuzzyRegexp(query);
        this.matchers.push(fuzzyMatch);
      } else {
        fuzzyRegexp = null;
      }
    };

    Searcher.prototype.isValid = function() {
      return queryLength > 0 && query !== SEPARATOR;
    };

    Searcher.prototype.end = function() {
      if (!this.totalResults) {
        this.triggerResults([]);
      }
      this.trigger('end');
      this.free();
    };

    Searcher.prototype.kill = function() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.free();
      }
    };

    Searcher.prototype.free = function() {
      this.data = this.attr = this.dataLength = this.matchers = this.matcher = this.query = this.totalResults = this.scoreMap = this.cursor = this.timeout = null;
    };

    Searcher.prototype.match = function() {
      if (!this.foundEnough() && (this.matcher = this.matchers.shift())) {
        this.setupMatcher();
        this.matchChunks();
      } else {
        this.end();
      }
    };

    Searcher.prototype.setupMatcher = function() {
      this.cursor = 0;
      this.scoreMap = new Array(101);
    };

    Searcher.prototype.matchChunks = function() {
      this.matchChunk();
      if (this.cursor === this.dataLength || this.scoredEnough()) {
        this.delay(this.match);
        this.sendResults();
      } else {
        this.delay(this.matchChunks);
      }
    };

    Searcher.prototype.matchChunk = function() {
      var j, k, len, ref, ref1;
      matcher = this.matcher;
      for (j = 0, ref = this.chunkSize(); 0 <= ref ? j < ref : j > ref; 0 <= ref ? j++ : j--) {
        value = this.data[this.cursor][this.attr];
        if (value.split) {
          valueLength = value.length;
          if (score = matcher()) {
            this.addResult(this.data[this.cursor], score);
          }
        } else {
          score = 0;
          ref1 = this.data[this.cursor][this.attr];
          for (k = 0, len = ref1.length; k < len; k++) {
            value = ref1[k];
            valueLength = value.length;
            score = Math.max(score, matcher() || 0);
          }
          if (score > 0) {
            this.addResult(this.data[this.cursor], score);
          }
        }
        this.cursor++;
      }
    };

    Searcher.prototype.chunkSize = function() {
      if (this.cursor + CHUNK_SIZE > this.dataLength) {
        return this.dataLength % CHUNK_SIZE;
      } else {
        return CHUNK_SIZE;
      }
    };

    Searcher.prototype.scoredEnough = function() {
      var ref;
      return ((ref = this.scoreMap[100]) != null ? ref.length : void 0) >= this.options.max_results;
    };

    Searcher.prototype.foundEnough = function() {
      return this.totalResults >= this.options.max_results;
    };

    Searcher.prototype.addResult = function(object, score) {
      var base, name;
      ((base = this.scoreMap)[name = Math.round(score)] || (base[name] = [])).push(object);
      this.totalResults++;
    };

    Searcher.prototype.getResults = function() {
      var j, objects, ref, results;
      results = [];
      ref = this.scoreMap;
      for (j = ref.length - 1; j >= 0; j += -1) {
        objects = ref[j];
        if (objects) {
          results.push.apply(results, objects);
        }
      }
      return results.slice(0, this.options.max_results);
    };

    Searcher.prototype.sendResults = function() {
      var results;
      results = this.getResults();
      if (results.length) {
        this.triggerResults(results);
      }
    };

    Searcher.prototype.triggerResults = function(results) {
      this.trigger('results', results);
    };

    Searcher.prototype.delay = function(fn) {
      return this.timeout = setTimeout(fn, 1);
    };

    Searcher.prototype.queryToFuzzyRegexp = function(string) {
      var char, chars, j, len;
      chars = string.split('');
      for (i = j = 0, len = chars.length; j < len; i = ++j) {
        char = chars[i];
        chars[i] = $.escapeRegexp(char);
      }
      return new RegExp(chars.join('.*?'));
    };

    return Searcher;

  })();

  app.SynchronousSearcher = (function(superClass) {
    extend(SynchronousSearcher, superClass);

    function SynchronousSearcher() {
      this.match = bind(this.match, this);
      return SynchronousSearcher.__super__.constructor.apply(this, arguments);
    }

    SynchronousSearcher.prototype.match = function() {
      if (this.matcher) {
        this.allResults || (this.allResults = []);
        this.allResults.push.apply(this.allResults, this.getResults());
      }
      return SynchronousSearcher.__super__.match.apply(this, arguments);
    };

    SynchronousSearcher.prototype.free = function() {
      this.allResults = null;
      return SynchronousSearcher.__super__.free.apply(this, arguments);
    };

    SynchronousSearcher.prototype.end = function() {
      this.sendResults(true);
      return SynchronousSearcher.__super__.end.apply(this, arguments);
    };

    SynchronousSearcher.prototype.sendResults = function(end) {
      var ref;
      if (end && ((ref = this.allResults) != null ? ref.length : void 0)) {
        return this.triggerResults(this.allResults);
      }
    };

    SynchronousSearcher.prototype.delay = function(fn) {
      return fn();
    };

    return SynchronousSearcher;

  })(app.Searcher);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  app.Shortcuts = (function() {
    $.extend(Shortcuts.prototype, Events);

    function Shortcuts() {
      this.onKeypress = bind(this.onKeypress, this);
      this.onKeydown = bind(this.onKeydown, this);
      this.isWindows = $.isWindows();
      this.start();
    }

    Shortcuts.prototype.start = function() {
      $.on(document, 'keydown', this.onKeydown);
      $.on(document, 'keypress', this.onKeypress);
    };

    Shortcuts.prototype.stop = function() {
      $.off(document, 'keydown', this.onKeydown);
      $.off(document, 'keypress', this.onKeypress);
    };

    Shortcuts.prototype.showTip = function() {
      app.showTip('KeyNav');
      return this.showTip = null;
    };

    Shortcuts.prototype.onKeydown = function(event) {
      var result;
      if (this.buggyEvent(event)) {
        return;
      }
      result = event.ctrlKey || event.metaKey ? !(event.altKey || event.shiftKey) ? this.handleKeydownSuperEvent(event) : void 0 : event.shiftKey ? !event.altKey ? this.handleKeydownShiftEvent(event) : void 0 : event.altKey ? this.handleKeydownAltEvent(event) : this.handleKeydownEvent(event);
      if (result === false) {
        event.preventDefault();
      }
    };

    Shortcuts.prototype.onKeypress = function(event) {
      var result;
      if (this.buggyEvent(event)) {
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) {
        result = this.handleKeypressEvent(event);
        if (result === false) {
          event.preventDefault();
        }
      }
    };

    Shortcuts.prototype.handleKeydownEvent = function(event) {
      var ref, ref1;
      if (!event.target.form && ((48 <= (ref = event.which) && ref <= 57) || (65 <= (ref1 = event.which) && ref1 <= 90))) {
        this.trigger('typing');
        return;
      }
      switch (event.which) {
        case 8:
          if (!event.target.form) {
            return this.trigger('typing');
          }
          break;
        case 13:
          return this.trigger('enter');
        case 27:
          return this.trigger('escape');
        case 32:
          if (!this.lastKeypress || this.lastKeypress < Date.now() - 500) {
            this.trigger('pageDown');
            return false;
          }
          break;
        case 33:
          return this.trigger('pageUp');
        case 34:
          return this.trigger('pageDown');
        case 35:
          return this.trigger('end');
        case 36:
          return this.trigger('home');
        case 37:
          if (!event.target.value) {
            return this.trigger('left');
          }
          break;
        case 38:
          this.trigger('up');
          if (typeof this.showTip === "function") {
            this.showTip();
          }
          return false;
        case 39:
          if (!event.target.value) {
            return this.trigger('right');
          }
          break;
        case 40:
          this.trigger('down');
          if (typeof this.showTip === "function") {
            this.showTip();
          }
          return false;
        case 191:
          if (!event.target.form) {
            this.trigger('typing');
            return false;
          }
      }
    };

    Shortcuts.prototype.handleKeydownSuperEvent = function(event) {
      switch (event.which) {
        case 13:
          return this.trigger('superEnter');
        case 37:
          if (!this.isWindows) {
            this.trigger('superLeft');
            return false;
          }
          break;
        case 38:
          this.trigger('pageTop');
          return false;
        case 39:
          if (!this.isWindows) {
            this.trigger('superRight');
            return false;
          }
          break;
        case 40:
          this.trigger('pageBottom');
          return false;
      }
    };

    Shortcuts.prototype.handleKeydownShiftEvent = function(event) {
      var ref, ref1, ref2;
      if (!event.target.form && (65 <= (ref = event.which) && ref <= 90)) {
        this.trigger('typing');
        return;
      }
      switch (event.which) {
        case 32:
          this.trigger('pageUp');
          return false;
        case 38:
          if (!((ref1 = getSelection()) != null ? ref1.toString() : void 0)) {
            this.trigger('altUp');
            return false;
          }
          break;
        case 40:
          if (!((ref2 = getSelection()) != null ? ref2.toString() : void 0)) {
            this.trigger('altDown');
            return false;
          }
      }
    };

    Shortcuts.prototype.handleKeydownAltEvent = function(event) {
      switch (event.which) {
        case 9:
          return this.trigger('altRight', event);
        case 37:
          if (this.isWindows) {
            this.trigger('superLeft');
            return false;
          }
          break;
        case 38:
          this.trigger('altUp');
          return false;
        case 39:
          if (this.isWindows) {
            this.trigger('superRight');
            return false;
          }
          break;
        case 40:
          this.trigger('altDown');
          return false;
        case 70:
          return this.trigger('altF', event);
        case 71:
          this.trigger('altG');
          return false;
        case 79:
          this.trigger('altO');
          return false;
        case 82:
          this.trigger('altR');
          return false;
        case 83:
          this.trigger('altS');
          return false;
      }
    };

    Shortcuts.prototype.handleKeypressEvent = function(event) {
      if (event.which === 63 && !event.target.value) {
        this.trigger('help');
        return false;
      } else {
        return this.lastKeypress = Date.now();
      }
    };

    Shortcuts.prototype.buggyEvent = function(event) {
      try {
        event.target;
        event.ctrlKey;
        event.which;
        return false;
      } catch (error) {
        return true;
      }
    };

    return Shortcuts;

  })();

}).call(this);
(function() {
  app.Collection = (function() {
    function Collection(objects) {
      if (objects == null) {
        objects = [];
      }
      this.reset(objects);
    }

    Collection.prototype.model = function() {
      return app.models[this.constructor.model];
    };

    Collection.prototype.reset = function(objects) {
      var j, len, object;
      if (objects == null) {
        objects = [];
      }
      this.models = [];
      for (j = 0, len = objects.length; j < len; j++) {
        object = objects[j];
        this.add(object);
      }
    };

    Collection.prototype.add = function(object) {
      var j, len, obj, ref;
      if (object instanceof app.Model) {
        this.models.push(object);
      } else if (object instanceof Array) {
        for (j = 0, len = object.length; j < len; j++) {
          obj = object[j];
          this.add(obj);
        }
      } else if (object instanceof app.Collection) {
        (ref = this.models).push.apply(ref, object.all());
      } else {
        this.models.push(new (this.model())(object));
      }
    };

    Collection.prototype.remove = function(model) {
      this.models.splice(this.models.indexOf(model), 1);
    };

    Collection.prototype.size = function() {
      return this.models.length;
    };

    Collection.prototype.isEmpty = function() {
      return this.models.length === 0;
    };

    Collection.prototype.each = function(fn) {
      var j, len, model, ref;
      ref = this.models;
      for (j = 0, len = ref.length; j < len; j++) {
        model = ref[j];
        fn(model);
      }
    };

    Collection.prototype.all = function() {
      return this.models;
    };

    Collection.prototype.contains = function(model) {
      return this.models.indexOf(model) >= 0;
    };

    Collection.prototype.findBy = function(attr, value) {
      var j, len, model, ref;
      ref = this.models;
      for (j = 0, len = ref.length; j < len; j++) {
        model = ref[j];
        if (model[attr] === value) {
          return model;
        }
      }
    };

    Collection.prototype.findAllBy = function(attr, value) {
      var j, len, model, ref, results;
      ref = this.models;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        model = ref[j];
        if (model[attr] === value) {
          results.push(model);
        }
      }
      return results;
    };

    Collection.prototype.countAllBy = function(attr, value) {
      var i, j, len, model, ref;
      i = 0;
      ref = this.models;
      for (j = 0, len = ref.length; j < len; j++) {
        model = ref[j];
        if (model[attr] === value) {
          i += 1;
        }
      }
      return i;
    };

    return Collection;

  })();

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  app.collections.Docs = (function(superClass) {
    var CONCURRENCY, NORMALIZE_VERSION_RGX, NORMALIZE_VERSION_SUB;

    extend(Docs, superClass);

    function Docs() {
      return Docs.__super__.constructor.apply(this, arguments);
    }

    Docs.model = 'Doc';

    Docs.prototype.findBySlug = function(slug) {
      return this.findBy('slug', slug) || this.findBy('slug_without_version', slug);
    };

    NORMALIZE_VERSION_RGX = /\.(\d)$/;

    NORMALIZE_VERSION_SUB = '.0$1';

    Docs.prototype.sort = function() {
      return this.models.sort(function(a, b) {
        if (a.name === b.name) {
          if (!a.version || a.version.replace(NORMALIZE_VERSION_RGX, NORMALIZE_VERSION_SUB) > b.version.replace(NORMALIZE_VERSION_RGX, NORMALIZE_VERSION_SUB)) {
            return -1;
          } else {
            return 1;
          }
        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        } else {
          return -1;
        }
      });
    };

    CONCURRENCY = 3;

    Docs.prototype.load = function(onComplete, onError, options) {
      var fail, i, j, next, ref;
      i = 0;
      next = (function(_this) {
        return function() {
          if (i < _this.models.length) {
            _this.models[i].load(next, fail, options);
          } else if (i === _this.models.length + CONCURRENCY - 1) {
            onComplete();
          }
          i++;
        };
      })(this);
      fail = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (onError) {
          onError.apply(null, args);
          onError = null;
        }
        next();
      };
      for (j = 0, ref = CONCURRENCY; 0 <= ref ? j < ref : j > ref; 0 <= ref ? j++ : j--) {
        next();
      }
    };

    Docs.prototype.clearCache = function() {
      var doc, j, len, ref;
      ref = this.models;
      for (j = 0, len = ref.length; j < len; j++) {
        doc = ref[j];
        doc.clearCache();
      }
    };

    Docs.prototype.uninstall = function(callback) {
      var i, next;
      i = 0;
      next = (function(_this) {
        return function() {
          if (i < _this.models.length) {
            _this.models[i++].uninstall(next, next);
          } else {
            callback();
          }
        };
      })(this);
      next();
    };

    Docs.prototype.getInstallStatuses = function(callback) {
      app.db.versions(this.models, function(statuses) {
        var key, value;
        if (statuses) {
          for (key in statuses) {
            value = statuses[key];
            statuses[key] = {
              installed: !!value,
              mtime: value
            };
          }
        }
        callback(statuses);
      });
    };

    Docs.prototype.checkForUpdates = function(callback) {
      this.getInstallStatuses((function(_this) {
        return function(statuses) {
          var i, slug, status;
          i = 0;
          if (statuses) {
            for (slug in statuses) {
              status = statuses[slug];
              if (_this.findBy('slug', slug).isOutdated(status)) {
                i += 1;
              }
            }
          }
          callback(i);
        };
      })(this));
    };

    Docs.prototype.updateInBackground = function() {
      this.getInstallStatuses((function(_this) {
        return function(statuses) {
          var doc, slug, status;
          if (!statuses) {
            return;
          }
          for (slug in statuses) {
            status = statuses[slug];
            doc = _this.findBy('slug', slug);
            if (doc.isOutdated(status)) {
              doc.install($.noop, $.noop);
            }
          }
        };
      })(this));
    };

    return Docs;

  })(app.Collection);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.collections.Entries = (function(superClass) {
    extend(Entries, superClass);

    function Entries() {
      return Entries.__super__.constructor.apply(this, arguments);
    }

    Entries.model = 'Entry';

    return Entries;

  })(app.Collection);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.collections.Types = (function(superClass) {
    var APPENDIX_RGX, GUIDES_RGX;

    extend(Types, superClass);

    function Types() {
      return Types.__super__.constructor.apply(this, arguments);
    }

    Types.model = 'Type';

    Types.prototype.groups = function() {
      var i, len, name, ref, result, type;
      result = [];
      ref = this.models;
      for (i = 0, len = ref.length; i < len; i++) {
        type = ref[i];
        (result[name = this._groupFor(type)] || (result[name] = [])).push(type);
      }
      return result.filter(function(e) {
        return e.length > 0;
      });
    };

    GUIDES_RGX = /(^|\()(guides?|tutorials?|reference|book|getting\ started|manual|examples)($|[\):])/i;

    APPENDIX_RGX = /appendix/i;

    Types.prototype._groupFor = function(type) {
      if (GUIDES_RGX.test(type.name)) {
        return 0;
      } else if (APPENDIX_RGX.test(type.name)) {
        return 2;
      } else {
        return 1;
      }
    };

    return Types;

  })(app.Collection);

}).call(this);
(function() {
  app.Model = (function() {
    function Model(attributes) {
      var key, value;
      for (key in attributes) {
        value = attributes[key];
        this[key] = value;
      }
    }

    return Model;

  })();

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.models.Doc = (function(superClass) {
    extend(Doc, superClass);

    function Doc() {
      Doc.__super__.constructor.apply(this, arguments);
      this.reset(this);
      this.slug_without_version = this.slug.split('~')[0];
      this.fullName = ("" + this.name) + (this.version ? " " + this.version : '');
      this.icon = this.slug_without_version;
      if (this.version) {
        this.short_version = this.version.split(' ')[0];
      }
      this.text = this.toEntry().text;
    }

    Doc.prototype.reset = function(data) {
      this.resetEntries(data.entries);
      this.resetTypes(data.types);
    };

    Doc.prototype.resetEntries = function(entries) {
      this.entries = new app.collections.Entries(entries);
      this.entries.each((function(_this) {
        return function(entry) {
          return entry.doc = _this;
        };
      })(this));
    };

    Doc.prototype.resetTypes = function(types) {
      this.types = new app.collections.Types(types);
      this.types.each((function(_this) {
        return function(type) {
          return type.doc = _this;
        };
      })(this));
    };

    Doc.prototype.fullPath = function(path) {
      if (path == null) {
        path = '';
      }
      if (path === "javascript:;") {
        return path;
      } else {
        if (path[0] !== '/') {
          path = "/" + path;
        }
        return "/" + this.slug + path;
      }
    };

    Doc.prototype.fileUrl = function(path) {
      return "" + app.config.docs_origin + (this.fullPath(path)) + "?" + this.mtime;
    };

    Doc.prototype.dbUrl = function() {
      return app.config.docs_origin + "/" + this.slug + "/" + app.config.db_filename + "?" + this.mtime;
    };

    Doc.prototype.indexUrl = function() {
      return (app.indexHost()) + "/" + this.slug + "/" + app.config.index_filename + "?" + this.mtime;
    };

    Doc.prototype.toEntry = function() {
      if (this.entry) {
        return this.entry;
      }
      this.entry = new app.models.Entry({
        doc: this,
        name: this.fullName,
        path: '/'
      });
      if (this.version) {
        this.entry.addAlias(this.name);
      }
      return this.entry;
    };

    Doc.prototype.findEntryByPathAndHash = function(path, hash) {
      var entry;
      if (hash && (entry = this.entries.findBy('path', path + "#" + hash))) {
        return entry;
      } else if (path === '/') {
        return this.toEntry();
      } else {
        return this.entries.findBy('path', path);
      }
    };

    Doc.prototype.load = function(onSuccess, onError, options) {
      var callback;
      if (options == null) {
        options = {};
      }
      if (options.readCache && this._loadFromCache(onSuccess)) {
        return;
      }
      callback = (function(_this) {
        return function(data) {
          _this.reset(data);
          onSuccess();
          if (options.writeCache) {
            _this._setCache(data);
          }
        };
      })(this);
      return ajax({
        url: this.indexUrl(),
        success: callback,
        error: onError
      });
    };

    Doc.prototype.clearCache = function() {
      app.localStorage.del(this.slug);
    };

    Doc.prototype._loadFromCache = function(onSuccess) {
      var callback, data;
      if (!(data = this._getCache())) {
        return;
      }
      callback = (function(_this) {
        return function() {
          _this.reset(data);
          onSuccess();
        };
      })(this);
      setTimeout(callback, 0);
      return true;
    };

    Doc.prototype._getCache = function() {
      var data;
      if (!(data = app.localStorage.get(this.slug))) {
        return;
      }
      if (data[0] === this.mtime) {
        return data[1];
      } else {
        this.clearCache();
      }
    };

    Doc.prototype._setCache = function(data) {
      app.localStorage.set(this.slug, [this.mtime, data]);
    };

    Doc.prototype.install = function(onSuccess, onError, onProgress) {
      var error, success;
      if (this.installing) {
        return;
      }
      this.installing = true;
      error = (function(_this) {
        return function() {
          _this.installing = null;
          onError();
        };
      })(this);
      success = (function(_this) {
        return function(data) {
          _this.installing = null;
          app.db.store(_this, data, onSuccess, error);
        };
      })(this);
      ajax({
        url: this.dbUrl(),
        success: success,
        error: error,
        progress: onProgress,
        timeout: 3600
      });
    };

    Doc.prototype.uninstall = function(onSuccess, onError) {
      var error, success;
      if (this.installing) {
        return;
      }
      this.installing = true;
      success = (function(_this) {
        return function() {
          _this.installing = null;
          onSuccess();
        };
      })(this);
      error = (function(_this) {
        return function() {
          _this.installing = null;
          onError();
        };
      })(this);
      app.db.unstore(this, success, error);
    };

    Doc.prototype.getInstallStatus = function(callback) {
      app.db.version(this, function(value) {
        return callback({
          installed: !!value,
          mtime: value
        });
      });
    };

    Doc.prototype.isOutdated = function(status) {
      return status && status.installed && this.mtime !== status.mtime;
    };

    return Doc;

  })(app.Model);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.models.Entry = (function(superClass) {
    var ALIASES, applyAliases;

    extend(Entry, superClass);

    function Entry() {
      Entry.__super__.constructor.apply(this, arguments);
      this.text = applyAliases(app.Searcher.normalizeString(this.name));
    }

    Entry.prototype.addAlias = function(name) {
      var text;
      text = applyAliases(app.Searcher.normalizeString(name));
      if (!Array.isArray(this.text)) {
        this.text = [this.text];
      }
      this.text.push(Array.isArray(text) ? text[1] : text);
    };

    Entry.prototype.fullPath = function() {
      return this.doc.fullPath(this.isIndex() ? '' : this.path);
    };

    Entry.prototype.dbPath = function() {
      return this.path.replace(/#.*/, '');
    };

    Entry.prototype.filePath = function() {
      return this.doc.fullPath(this._filePath());
    };

    Entry.prototype.fileUrl = function() {
      return this.doc.fileUrl(this._filePath());
    };

    Entry.prototype._filePath = function() {
      var result;
      result = this.path.replace(/#.*/, '');
      if (result.slice(-5) !== '.html') {
        result += '.html';
      }
      return result;
    };

    Entry.prototype.isIndex = function() {
      return this.path === '/';
    };

    Entry.prototype.getType = function() {
      return this.doc.types.findBy('name', this.type);
    };

    Entry.prototype.loadFile = function(onSuccess, onError) {
      return app.db.load(this, onSuccess, onError);
    };

    applyAliases = function(string) {
      var i, j, len, word, words;
      if (ALIASES.hasOwnProperty(string)) {
        return [string, ALIASES[string]];
      } else {
        words = string.split('.');
        for (i = j = 0, len = words.length; j < len; i = ++j) {
          word = words[i];
          if (!(ALIASES.hasOwnProperty(word))) {
            continue;
          }
          words[i] = ALIASES[word];
          return [string, words.join('.')];
        }
      }
      return string;
    };

    Entry.ALIASES = ALIASES = {
      'angular': 'ng',
      'angular.js': 'ng',
      'backbone.js': 'bb',
      'c++': 'cpp',
      'coffeescript': 'cs',
      'crystal': 'cr',
      'elixir': 'ex',
      'javascript': 'js',
      'julia': 'jl',
      'jquery': '$',
      'knockout.js': 'ko',
      'less': 'ls',
      'lodash': '_',
      'löve': 'love',
      'marionette': 'mn',
      'markdown': 'md',
      'modernizr': 'mdr',
      'moment.js': 'mt',
      'openjdk': 'java',
      'nginx': 'ngx',
      'numpy': 'np',
      'pandas': 'pd',
      'postgresql': 'pg',
      'python': 'py',
      'ruby.on.rails': 'ror',
      'ruby': 'rb',
      'rust': 'rs',
      'sass': 'scss',
      'tensorflow': 'tf',
      'typescript': 'ts',
      'underscore.js': '_'
    };

    return Entry;

  })(app.Model);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.models.Type = (function(superClass) {
    extend(Type, superClass);

    function Type() {
      return Type.__super__.constructor.apply(this, arguments);
    }

    Type.prototype.fullPath = function() {
      return "javascript:;";
    };

    Type.prototype.entries = function() {
      return this.doc.entries.findAllBy('type', this.name);
    };

    Type.prototype.toEntry = function() {
      return new app.models.Entry({
        doc: this.doc,
        name: this.doc.name + " / " + this.name,
        path: this.fullPath()
      });
    };

    return Type;

  })(app.Model);

}).call(this);
(function() {
  var slice = [].slice;

  app.View = (function() {
    $.extend(View.prototype, Events);

    function View() {
      this.setupElement();
      if (this.el.className) {
        this.originalClassName = this.el.className;
      }
      if (this.constructor.className) {
        this.resetClass();
      }
      this.refreshElements();
      if (typeof this.init === "function") {
        this.init();
      }
      this.refreshElements();
    }

    View.prototype.setupElement = function() {
      var key, ref, value;
      if (this.el == null) {
        this.el = typeof this.constructor.el === 'string' ? $(this.constructor.el) : this.constructor.el ? this.constructor.el : document.createElement(this.constructor.tagName || 'div');
      }
      if (this.constructor.attributes) {
        ref = this.constructor.attributes;
        for (key in ref) {
          value = ref[key];
          this.el.setAttribute(key, value);
        }
      }
    };

    View.prototype.refreshElements = function() {
      var name, ref, selector;
      if (this.constructor.elements) {
        ref = this.constructor.elements;
        for (name in ref) {
          selector = ref[name];
          this[name] = this.find(selector);
        }
      }
    };

    View.prototype.addClass = function(name) {
      this.el.classList.add(name);
    };

    View.prototype.removeClass = function(name) {
      this.el.classList.remove(name);
    };

    View.prototype.toggleClass = function(name) {
      this.el.classList.toggle(name);
    };

    View.prototype.hasClass = function(name) {
      return this.el.classList.contains(name);
    };

    View.prototype.resetClass = function() {
      var i, len, name, ref;
      this.el.className = this.originalClassName || '';
      if (this.constructor.className) {
        ref = this.constructor.className.split(' ');
        for (i = 0, len = ref.length; i < len; i++) {
          name = ref[i];
          this.addClass(name);
        }
      }
    };

    View.prototype.find = function(selector) {
      return $(selector, this.el);
    };

    View.prototype.findAll = function(selector) {
      return $$(selector, this.el);
    };

    View.prototype.findByClass = function(name) {
      return this.findAllByClass(name)[0];
    };

    View.prototype.findLastByClass = function(name) {
      var all;
      all = this.findAllByClass(name)[0];
      return all[all.length - 1];
    };

    View.prototype.findAllByClass = function(name) {
      return this.el.getElementsByClassName(name);
    };

    View.prototype.findByTag = function(tag) {
      return this.findAllByTag(tag)[0];
    };

    View.prototype.findLastByTag = function(tag) {
      var all;
      all = this.findAllByTag(tag);
      return all[all.length - 1];
    };

    View.prototype.findAllByTag = function(tag) {
      return this.el.getElementsByTagName(tag);
    };

    View.prototype.append = function(value) {
      $.append(this.el, value.el || value);
    };

    View.prototype.appendTo = function(value) {
      $.append(value.el || value, this.el);
    };

    View.prototype.prepend = function(value) {
      $.prepend(this.el, value.el || value);
    };

    View.prototype.prependTo = function(value) {
      $.prepend(value.el || value, this.el);
    };

    View.prototype.before = function(value) {
      $.before(this.el, value.el || value);
    };

    View.prototype.after = function(value) {
      $.after(this.el, value.el || value);
    };

    View.prototype.remove = function(value) {
      $.remove(value.el || value);
    };

    View.prototype.empty = function() {
      $.empty(this.el);
      this.refreshElements();
    };

    View.prototype.html = function(value) {
      this.empty();
      this.append(value);
    };

    View.prototype.inserthtml = function(el, value) {
      $.empty(el);
      this.refreshElements();
      $.append(el, value.el || value);
    };

    View.prototype.tmpl = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = app.templates).render.apply(ref, args);
    };

    View.prototype.delay = function() {
      var args, delay, fn;
      fn = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      delay = typeof args[args.length - 1] === 'number' ? args.pop() : 0;
      return setTimeout(fn.bind.apply(fn, [this].concat(slice.call(args))), delay);
    };

    View.prototype.onDOM = function(event, callback) {
      $.on(this.el, event, callback);
    };

    View.prototype.offDOM = function(event, callback) {
      $.off(this.el, event, callback);
    };

    View.prototype.bindEvents = function() {
      var method, name, ref, ref1, ref2;
      if (this.constructor.events) {
        ref = this.constructor.events;
        for (name in ref) {
          method = ref[name];
          this.onDOM(name, this[method]);
        }
      }
      if (this.constructor.routes) {
        ref1 = this.constructor.routes;
        for (name in ref1) {
          method = ref1[name];
          app.router.on(name, this[method]);
        }
      }
      if (this.constructor.shortcuts) {
        ref2 = this.constructor.shortcuts;
        for (name in ref2) {
          method = ref2[name];
          app.shortcuts.on(name, this[method]);
        }
      }
    };

    View.prototype.unbindEvents = function() {
      var method, name, ref, ref1, ref2;
      if (this.constructor.events) {
        ref = this.constructor.events;
        for (name in ref) {
          method = ref[name];
          this.offDOM(name, this[method]);
        }
      }
      if (this.constructor.routes) {
        ref1 = this.constructor.routes;
        for (name in ref1) {
          method = ref1[name];
          app.router.off(name, this[method]);
        }
      }
      if (this.constructor.shortcuts) {
        ref2 = this.constructor.shortcuts;
        for (name in ref2) {
          method = ref2[name];
          app.shortcuts.off(name, this[method]);
        }
      }
    };

    View.prototype.addSubview = function(view) {
      return (this.subviews || (this.subviews = [])).push(view);
    };

    View.prototype.activate = function() {
      var i, len, ref, view;
      if (this.activated) {
        return;
      }
      this.bindEvents();
      if (this.subviews) {
        ref = this.subviews;
        for (i = 0, len = ref.length; i < len; i++) {
          view = ref[i];
          view.activate();
        }
      }
      this.activated = true;
      return true;
    };

    View.prototype.deactivate = function() {
      var i, len, ref, view;
      if (!this.activated) {
        return;
      }
      this.unbindEvents();
      if (this.subviews) {
        ref = this.subviews;
        for (i = 0, len = ref.length; i < len; i++) {
          view = ref[i];
          view.deactivate();
        }
      }
      this.activated = false;
      return true;
    };

    View.prototype.detach = function() {
      this.deactivate();
      $.remove(this.el);
    };

    return View;

  })();

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Document = (function(superClass) {
    var HIDE_SIDEBAR_CLASS, MAX_WIDTH_CLASS;

    extend(Document, superClass);

    function Document() {
      this.onVisibilityChange = bind(this.onVisibilityChange, this);
      this.onSearchClear = bind(this.onSearchClear, this);
      this.onSearching = bind(this.onSearching, this);
      return Document.__super__.constructor.apply(this, arguments);
    }

    MAX_WIDTH_CLASS = '_max-width';

    HIDE_SIDEBAR_CLASS = '_sidebar-hidden';

    Document.el = document;

    Document.events = {
      visibilitychange: 'onVisibilityChange'
    };

    Document.shortcuts = {
      help: 'onHelp',
      escape: 'onEscape',
      superLeft: 'onBack',
      superRight: 'onForward'
    };

    Document.prototype.init = function() {
      this.addSubview(this.nav = new app.views.Nav, this.addSubview(this.sidebar = new app.views.Sidebar));
      this.addSubview(this.content = new app.views.Content);
      if (!(app.isSingleDoc() || app.isMobile())) {
        this.addSubview(this.path = new app.views.Path);
      }
      this.addSubview(this.totop = new app.views.ToTopView);
      $.on(document.body, 'click', this.onClick);
      this.activate();
    };

    Document.prototype.toggleLight = function() {
      var alt, css, ref;
      css = $('link[rel="stylesheet"][data-alt]');
      alt = css.getAttribute('data-alt');
      css.setAttribute('data-alt', css.getAttribute('href'));
      css.setAttribute('href', alt);
      app.settings.setDark(alt.indexOf('dark') > 0);
      if ((ref = app.appCache) != null) {
        ref.updateInBackground();
      }
    };

    Document.prototype.toggleLayout = function() {
      var ref, wantsMaxWidth;
      wantsMaxWidth = !app.el.classList.contains(MAX_WIDTH_CLASS);
      app.el.classList[wantsMaxWidth ? 'add' : 'remove'](MAX_WIDTH_CLASS);
      app.settings.setLayout(MAX_WIDTH_CLASS, wantsMaxWidth);
      if ((ref = app.appCache) != null) {
        ref.updateInBackground();
      }
    };

    Document.prototype.showSidebar = function(options) {
      if (options == null) {
        options = {};
      }
      this.toggleSidebar(options, true);
    };

    Document.prototype.hideSidebar = function(options) {
      if (options == null) {
        options = {};
      }
      this.toggleSidebar(options, false);
    };

    Document.prototype.toggleSidebar = function(options, shouldShow) {
      var ref;
      if (options == null) {
        options = {};
      }
      if (shouldShow == null) {
        shouldShow = options.save ? !this.hasSidebar() : app.el.classList.contains(HIDE_SIDEBAR_CLASS);
      }
      app.el.classList[shouldShow ? 'remove' : 'add'](HIDE_SIDEBAR_CLASS);
      if (options.save) {
        app.settings.setLayout(HIDE_SIDEBAR_CLASS, !shouldShow);
        if ((ref = app.appCache) != null) {
          ref.updateInBackground();
        }
      }
    };

    Document.prototype.hasSidebar = function() {
      return !app.settings.hasLayout(HIDE_SIDEBAR_CLASS);
    };

    Document.prototype.onSearching = function() {
      if (!this.hasSidebar()) {
        this.showSidebar();
      }
    };

    Document.prototype.onSearchClear = function() {
      if (!this.hasSidebar()) {
        this.hideSidebar();
      }
    };

    Document.prototype.setTitle = function(title) {};

    Document.prototype.onVisibilityChange = function() {
      if (this.el.visibilityState !== 'visible') {
        return;
      }
      this.delay(function() {
        if (app.isMobile() !== app.views.Mobile.detect()) {
          location.reload();
        }
      }, 300);
    };

    Document.prototype.onHelp = function() {
      return app.router.show('/help#shortcuts');
    };

    Document.prototype.onEscape = function() {
      var path;
      path = !app.isSingleDoc() || location.pathname === app.doc.fullPath() ? '/' : app.doc.fullPath();
      app.router.show(path);
    };

    Document.prototype.onBack = function() {
      history.back();
    };

    Document.prototype.onForward = function() {
      history.forward();
    };

    Document.prototype.onClick = function(event) {
      if (!event.target.hasAttribute('data-behavior')) {
        return;
      }
      $.stopEvent(event);
      switch (event.target.getAttribute('data-behavior')) {
        case 'back':
          history.back();
          break;
        case 'reload':
          window.location.reload();
          break;
        case 'reboot':
          window.location = '/';
          break;
        case 'hard-reload':
          app.reload();
          break;
        case 'reset':
          if (confirm('Are you sure you want to reset DevDocs?')) {
            app.reset();
          }
      }
    };

    return Document;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Mobile = (function(superClass) {
    extend(Mobile, superClass);

    Mobile.elements = {
      body: 'body',
      content: '._container',
      sidebar: '._sidebar'
    };

    Mobile.routes = {
      after: 'afterRoute'
    };

    Mobile.detect = function() {
      try {
        return (window.matchMedia('(max-width: 480px)').matches) || (window.matchMedia('(max-device-width: 767px)').matches) || (window.matchMedia('(max-device-height: 767px) and (max-device-width: 1024px)').matches) || (navigator.userAgent.indexOf('Android') !== -1 && navigator.userAgent.indexOf('Mobile') !== -1) || (navigator.userAgent.indexOf('IEMobile') !== -1);
      } catch (error) {
        return false;
      }
    };

    Mobile.detectAndroidWebview = function() {
      try {
        return /(Android).*( Version\/.\.. ).*(Chrome)/.test(navigator.userAgent);
      } catch (error) {
        return false;
      }
    };

    function Mobile() {
      this.afterRoute = bind(this.afterRoute, this);
      this.onTapSearch = bind(this.onTapSearch, this);
      this.onClickMenu = bind(this.onClickMenu, this);
      this.onClickHome = bind(this.onClickHome, this);
      this.onClick = bind(this.onClick, this);
      this.hideSidebar = bind(this.hideSidebar, this);
      this.showSidebar = bind(this.showSidebar, this);
      this.el = document.documentElement;
      Mobile.__super__.constructor.apply(this, arguments);
    }

    Mobile.prototype.init = function() {
      var doc, html, msPointerSupported, scrollTimeout, scrolling, self, touch;
      if ($.isTouchScreen()) {
        FastClick.attach(this.body);
        app.shortcuts.stop();
      }
      doc = window.document;
      html = this.el;
      this.panel = $("._container");
      this.panelCentent = $("._content");
      this.sidebar = $("._sidebar");
      this.header = $("._header");
      self = this;
      msPointerSupported = window.navigator.msPointerEnabled;
      touch = {
        'start': msPointerSupported ? 'MSPointerDown' : 'touchstart',
        'move': msPointerSupported ? 'MSPointerMove' : 'touchmove',
        'end': msPointerSupported ? 'MSPointerUp' : 'touchend'
      };
      this._prefix = (function() {
        var prop, regex, styleDeclaration;
        regex = /^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/;
        styleDeclaration = doc.getElementsByTagName('script')[0].style;
        for (prop in styleDeclaration) {
          if (regex.test(prop)) {
            return '-' + prop.match(regex)[0].toLowerCase() + '-';
          }
        }
        if ('WebkitOpacity' in styleDeclaration) {
          return '-webkit-';
        }
        if ('KhtmlOpacity' in styleDeclaration) {
          return '-khtml-';
        }
        return '';
      })();
      $.on(this.body, 'click', this.onClick);
      $.on($('._menu-link'), 'click', this.onClickMenu);
      $.on($('._search'), 'touchend', this.onTapSearch);
      scrollTimeout = void 0;
      scrolling = false;
      this._startOffsetX = 0;
      this._currentOffsetX = 0;
      this._startOffsetY = 0;
      this._currentOffsetY = 0;
      this._opening = false;
      this._moved = false;
      this._opened = false;
      this._preventOpen = false;
      this._touch = true;
      this._fx = 'ease';
      this._duration = 300;
      this._tolerance = 70;
      this._ratio = 2;
      this._padding = this._translateTo = 250;
      this._orientation = 1;
      this._translateTo *= this._orientation;
      this._onScrollFn = $.decouple(this.panelCentent, 'scroll', function() {
        if (!self._moved) {
          clearTimeout(scrollTimeout);
          scrolling = true;
          scrollTimeout = setTimeout((function() {
            scrolling = false;
          }), 250);
        }
      });

      /**
       * Prevents touchmove event if slideout is moving
       */
      this._preventMove = function(eve) {
        if (self._moved) {
          eve.preventDefault();
        }
      };
      this.panel.addEventListener(touch.move, this._preventMove);

      /**
       * Resets values on touchstart
       */
      this._resetTouchFn = function(eve) {
        if (typeof eve.touches === 'undefined') {
          return;
        }
        self._moved = false;
        self._opening = false;
        self._startOffsetX = eve.touches[0].clientX;
        self._startOffsetY = eve.touches[0].clientY;
        self._preventOpen = !self._touch || !self.isSidebarShown() && self.sidebar.clientWidth !== 0;
      };
      this.panel.addEventListener(touch.start, this._resetTouchFn);

      /**
       * Resets values on touchcancel
       */
      this._onTouchCancelFn = function() {
        self._moved = false;
        self._opening = false;
      };
      this.panel.addEventListener('touchcancel', this._onTouchCancelFn);

      /**
       * Toggles slideout on touchend
       */
      this._onTouchEndFn = function() {
        if (self._moved) {
          if (self._opening && Math.abs(self._currentOffsetX / self._currentOffsetY) > self._ratio && Math.abs(self._currentOffsetX) > self._tolerance) {
            self.showSidebar();
          } else {
            self.hideSidebar();
          }
        }
        self._moved = false;
      };
      this.panel.addEventListener(touch.end, this._onTouchEndFn);

      /**
       * Translates panel on touchmove
       */
      this._onTouchMoveFn = function(eve) {
        var dif_x, dif_y, oriented_dif_x, translateX, translateY;
        if (scrolling || self._preventOpen || typeof eve.touches === 'undefined') {
          return;
        }
        dif_x = eve.touches[0].clientX - self._startOffsetX;
        dif_y = eve.touches[0].clientY - self._startOffsetY;
        translateX = self._currentOffsetX = dif_x;
        translateY = self._currentOffsetY = dif_y;
        if (Math.abs(translateX) > self._padding) {
          return;
        }
        if (Math.abs(dif_x) > 20 && Math.abs(dif_x / dif_y) > self._ratio && eve.cancelable) {
          self._opening = true;
          oriented_dif_x = dif_x * self._orientation;
          if (self._opened && oriented_dif_x > 0 || !self._opened && oriented_dif_x < 0) {
            return;
          }
          if (oriented_dif_x <= 0) {
            translateX = dif_x + self._padding * self._orientation;
            self._opening = false;
          }
          if (!self._moved && html.className.search('_open-sidebar') === -1) {
            html.className += ' _open-sidebar';
          }
          self.panel.style[self._prefix + 'transform'] = self.panel.style.transform = 'translateX(' + translateX + 'px)';
          self.header.style[self._prefix + 'transform'] = self.header.style.transform = 'translateX(' + translateX + 'px)';
          self._moved = true;
        }
      };
      this.panel.addEventListener(touch.move, this._onTouchMoveFn);
      this.activate();
    };

    Mobile.prototype._setTransition = function() {
      this.panel.style[this._prefix + 'transition'] = this.panel.style.transition = this._prefix + 'transform ' + this._duration + 'ms ' + this._fx;
      this.header.style[this._prefix + 'transition'] = this.header.style.transition = this._prefix + 'transform ' + this._duration + 'ms ' + this._fx;
    };

    Mobile.prototype._translateXTo = function(translateX) {
      this._currentOffsetX = translateX;
      this._currentOffsetY = 0;
      this.panel.style[this._prefix + 'transform'] = this.panel.style.transform = 'translateX(' + translateX + 'px)';
      this.header.style[this._prefix + 'transform'] = this.header.style.transform = 'translateX(' + translateX + 'px)';
    };

    Mobile.prototype.showSidebar = function() {
      var selection;
      if (this.isSidebarShown()) {
        return;
      }
      this.contentTop = this.body.scrollTop;
      this.addClass('_open-sidebar');
      this._setTransition();
      this._translateXTo(this._translateTo);
      this._opened = true;
      if (selection = this.findByClass(app.views.ListSelect.activeClass)) {
        $.scrollTo(selection, this.body, 'center');
      } else {
        this.body.scrollTop = this.findByClass(app.views.ListFold.activeClass) && this.sidebarTop || 0;
      }
      setTimeout(((function(_this) {
        return function() {
          _this.panel.style.transition = _this.panel.style['-webkit-transition'] = _this.panel.style[_this._prefix + 'transform'] = _this.panel.style.transform = '';
          _this.header.style.transition = _this.header.style['-webkit-transition'] = _this.header.style[_this._prefix + 'transform'] = _this.header.style.transform = '';
        };
      })(this)), this._duration + 50);
    };

    Mobile.prototype.hideSidebar = function() {
      if (!this.isSidebarShown() && !this._opening) {
        return;
      }
      this.sidebarTop = this.body.scrollTop;
      this._setTransition();
      this._translateXTo(0);
      this._opened = false;
      this.body.scrollTop = this.contentTop || 0;
      setTimeout(((function(_this) {
        return function() {
          _this.removeClass('_open-sidebar');
          _this.panel.style.transition = _this.panel.style['-webkit-transition'] = _this.panel.style[_this._prefix + 'transform'] = _this.panel.style.transform = '';
          _this.header.style.transition = _this.header.style['-webkit-transition'] = _this.header.style[_this._prefix + 'transform'] = _this.header.style.transform = '';
        };
      })(this)), this._duration + 50);
    };

    Mobile.prototype.isSidebarShown = function() {
      return this._opened;
    };

    Mobile.prototype.onClick = function(event) {
      if (event.target.hasAttribute('data-pick-docs')) {
        this.showSidebar();
      }
    };

    Mobile.prototype.onClickHome = function() {
      app.shortcuts.trigger('escape');
      this.hideSidebar();
    };

    Mobile.prototype.onClickMenu = function() {
      if (this.isSidebarShown()) {
        this.hideSidebar();
      } else {
        this.showSidebar();
      }
    };

    Mobile.prototype.onTapSearch = function() {
      return this.body.scrollTop = 0;
    };

    Mobile.prototype.afterRoute = function() {
      this.hideSidebar();
    };

    return Mobile;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Nav = (function(superClass) {
    extend(Nav, superClass);

    function Nav() {
      this.afterRoute = bind(this.afterRoute, this);
      return Nav.__super__.constructor.apply(this, arguments);
    }

    Nav.el = '._nav';

    Nav.activeClass = '_nav-current';

    Nav.routes = {
      after: 'afterRoute'
    };

    Nav.prototype.select = function(href) {
      this.deselect();
      if (this.current = this.find("a[href='" + href + "']")) {
        this.current.classList.add(this.constructor.activeClass);
        this.current.setAttribute('tabindex', '-1');
      }
    };

    Nav.prototype.deselect = function() {
      if (this.current) {
        this.current.classList.remove(this.constructor.activeClass);
        this.current.removeAttribute('tabindex');
        this.current = null;
      }
    };

    Nav.prototype.afterRoute = function(route, context) {
      if (route === 'page' || route === 'offline') {
        return this.select(context.pathname);
      } else {
        return this.deselect();
      }
    };

    return Nav;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  app.views.Path = (function(superClass) {
    extend(Path, superClass);

    function Path() {
      this.afterRoute = bind(this.afterRoute, this);
      this.onClick = bind(this.onClick, this);
      return Path.__super__.constructor.apply(this, arguments);
    }

    Path.className = '_path';

    Path.attributes = {
      role: 'complementary'
    };

    Path.events = {
      click: 'onClick'
    };

    Path.routes = {
      after: 'afterRoute'
    };

    Path.prototype.render = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.html(this.tmpl.apply(this, ['path'].concat(slice.call(args))));
      this.show();
    };

    Path.prototype.show = function() {
      if (!this.el.parentNode) {
        this.prependTo(app.el);
      }
    };

    Path.prototype.hide = function() {
      if (this.el.parentNode) {
        $.remove(this.el);
      }
    };

    Path.prototype.onClick = function(event) {
      var link;
      if (link = $.closestLink(event.target, this.el)) {
        this.clicked = true;
      }
    };

    Path.prototype.afterRoute = function(route, context) {
      if (context.type) {
        this.render(context.doc, context.type);
      } else if (context.entry) {
        if (context.entry.isIndex()) {
          this.render(context.doc);
        } else {
          this.render(context.doc, context.entry.getType(), context.entry);
        }
      } else {
        this.hide();
      }
      if (this.clicked) {
        this.clicked = null;
        app.document.sidebar.reset();
      }
    };

    return Path;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Resizer = (function(superClass) {
    var MAX, MIN;

    extend(Resizer, superClass);

    function Resizer() {
      this.onDragEnd = bind(this.onDragEnd, this);
      this.onDrag = bind(this.onDrag, this);
      this.onDragStart = bind(this.onDragStart, this);
      return Resizer.__super__.constructor.apply(this, arguments);
    }

    Resizer.className = '_resizer';

    Resizer.attributes = {
      title: 'Click to toggle sidebar on/off'
    };

    Resizer.events = {
      dragstart: 'onDragStart',
      dragend: 'onDragEnd',
      click: 'onClick'
    };

    Resizer.isSupported = function() {
      return 'ondragstart' in document.createElement('div') && !app.isMobile();
    };

    Resizer.prototype.init = function() {
      this.el.setAttribute('draggable', 'true');
      this.appendTo($('._app'));
      this.style = $('style[data-resizer]');
      this.size = this.style.getAttribute('data-size');
    };

    MIN = 260;

    MAX = 600;

    Resizer.prototype.resize = function(value, save) {
      var newSize, ref;
      value -= app.el.offsetLeft;
      if (!(value > 0)) {
        return;
      }
      value = Math.min(Math.max(Math.round(value), MIN), MAX);
      newSize = value + "px";
      this.style.innerHTML = this.style.innerHTML.replace(new RegExp(this.size, 'g'), newSize);
      this.size = newSize;
      if (save) {
        app.settings.setSize(value);
        if ((ref = app.appCache) != null) {
          ref.updateInBackground();
        }
      }
    };

    Resizer.prototype.onClick = function() {
      app.document.toggleSidebar({
        save: true
      });
    };

    Resizer.prototype.onDragStart = function(event) {
      this.style.removeAttribute('disabled');
      event.dataTransfer.effectAllowed = 'link';
      event.dataTransfer.setData('Text', '');
      $.on(window, 'dragover', this.onDrag);
    };

    Resizer.prototype.onDrag = function(event) {
      var value;
      value = event.pageX;
      if (!(value > 0)) {
        return;
      }
      this.lastDragValue = value;
      if (this.lastDrag && this.lastDrag > Date.now() - 50) {
        return;
      }
      this.lastDrag = Date.now();
      this.resize(value, false);
    };

    Resizer.prototype.onDragEnd = function(event) {
      var value;
      $.off(window, 'dragover', this.onDrag);
      value = event.pageX || (event.screenX - window.screenX);
      if (this.lastDragValue && !((this.lastDragValue - 5 < value && value < this.lastDragValue + 5))) {
        value = this.lastDragValue;
      }
      this.resize(value, true);
    };

    return Resizer;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.BasePage = (function(superClass) {
    extend(BasePage, superClass);

    function BasePage(el1, entry) {
      this.el = el1;
      this.entry = entry;
      this.paintCode = bind(this.paintCode, this);
      BasePage.__super__.constructor.apply(this, arguments);
    }

    BasePage.prototype.deactivate = function() {
      if (BasePage.__super__.deactivate.apply(this, arguments)) {
        return this.highlightNodes = [];
      }
    };

    BasePage.prototype.render = function(content, fromCache) {
      if (fromCache == null) {
        fromCache = false;
      }
      this.highlightNodes = [];
      this.previousTiming = null;
      if (!this.constructor.className) {
        this.addClass("_" + this.entry.doc.type);
      }
      if (!fromCache) {
        this.highlightCode();
      }
      this.activate();
      if (this.afterRender) {
        this.delay(this.afterRender);
      }
      if (this.highlightNodes.length > 0) {
        $.requestAnimationFrame((function(_this) {
          return function() {
            return $.requestAnimationFrame(_this.paintCode);
          };
        })(this));
      }
    };

    BasePage.prototype.highlightCode = function() {
      var el, i, language, len, ref;
      ref = this.findAll('pre[data-language]');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        language = el.getAttribute('data-language');
        el.classList.add("language-" + language);
        this.highlightNodes.push(el);
      }
    };

    BasePage.prototype.paintCode = function(timing) {
      var clipEl, el, i, len, ref;
      if (this.previousTiming) {
        if (Math.round(1000 / (timing - this.previousTiming)) > 50) {
          this.nodesPerFrame = Math.round(Math.min(this.nodesPerFrame * 1.25, 50));
        } else {
          this.nodesPerFrame = Math.round(Math.max(this.nodesPerFrame * .8, 10));
        }
      } else {
        this.nodesPerFrame = 10;
      }
      ref = this.highlightNodes.splice(0, this.nodesPerFrame);
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        if (clipEl = el.lastElementChild) {
          $.remove(clipEl);
        }
        Prism.highlightElement(el);
        if (clipEl) {
          $.append(el, clipEl);
        }
      }
      if (this.highlightNodes.length > 0) {
        $.requestAnimationFrame(this.paintCode);
      }
      this.previousTiming = timing;
    };

    return BasePage;

  })(app.View);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.GithubPage = (function(superClass) {
    var LANGUAGE_RGX;

    extend(GithubPage, superClass);

    function GithubPage() {
      return GithubPage.__super__.constructor.apply(this, arguments);
    }

    LANGUAGE_RGX = /highlight-source-(\w+)/;

    GithubPage.prototype.prepare = function() {
      var el, i, len, ref;
      ref = this.findAll('pre.highlight');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        this.highlightCode(el, el.className.match(LANGUAGE_RGX)[1]);
      }
    };

    return GithubPage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.HiddenPage = (function(superClass) {
    extend(HiddenPage, superClass);

    HiddenPage.events = {
      click: 'onClick'
    };

    function HiddenPage(el, entry) {
      this.el = el;
      this.entry = entry;
      this.onClick = bind(this.onClick, this);
      HiddenPage.__super__.constructor.apply(this, arguments);
    }

    HiddenPage.prototype.init = function() {
      this.addSubview(this.notice = new app.views.Notice('disabledDoc'));
      this.activate();
    };

    HiddenPage.prototype.onClick = function(event) {
      var link;
      if (link = $.closestLink(event.target, this.el)) {
        $.stopEvent(event);
        $.popup(link);
      }
    };

    return HiddenPage;

  })(app.View);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.JavascriptPage = (function(superClass) {
    extend(JavascriptPage, superClass);

    function JavascriptPage() {
      return JavascriptPage.__super__.constructor.apply(this, arguments);
    }

    JavascriptPage.prototype.prepare = function() {
      this.highlightCode(this.findAllByTag('pre'), 'javascript');
    };

    return JavascriptPage;

  })(app.views.BasePage);

  app.views.JavascriptWithMarkupCheckPage = (function(superClass) {
    extend(JavascriptWithMarkupCheckPage, superClass);

    function JavascriptWithMarkupCheckPage() {
      return JavascriptWithMarkupCheckPage.__super__.constructor.apply(this, arguments);
    }

    JavascriptWithMarkupCheckPage.prototype.prepare = function() {
      var el, i, language, len, ref;
      ref = this.findAllByTag('pre');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        language = el.textContent.match(/^\s*</) ? 'markup' : 'javascript';
        this.highlightCode(el, language);
      }
    };

    return JavascriptWithMarkupCheckPage;

  })(app.views.BasePage);

  app.views.GruntPage = app.views.JavascriptPage;

  app.views.DojoPage = app.views.RequirejsPage = app.views.JavascriptWithMarkupCheckPage;

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.JqueryPage = (function(superClass) {
    extend(JqueryPage, superClass);

    function JqueryPage() {
      this.onIframeLoaded = bind(this.onIframeLoaded, this);
      return JqueryPage.__super__.constructor.apply(this, arguments);
    }

    JqueryPage.demoClassName = '_jquery-demo';

    JqueryPage.prototype.afterRender = function() {
      var i, iframe, len, ref;
      ref = this.findAllByTag('iframe');
      for (i = 0, len = ref.length; i < len; i++) {
        iframe = ref[i];
        iframe.style.display = 'none';
        $.on(iframe, 'load', this.onIframeLoaded);
      }
      return this.runExamples();
    };

    JqueryPage.prototype.onIframeLoaded = function(event) {
      event.target.style.display = '';
      $.off(event.target, 'load', this.onIframeLoaded);
    };

    JqueryPage.prototype.runExamples = function() {
      var el, i, len, ref;
      ref = this.findAllByClass('entry-example');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        try {
          this.runExample(el);
        } catch (error) {

        }
      }
    };

    JqueryPage.prototype.runExample = function(el) {
      var doc, iframe, source;
      source = el.getElementsByClassName('syntaxhighlighter')[0];
      if (!(source && source.innerHTML.indexOf('!doctype') !== -1)) {
        return;
      }
      if (!(iframe = el.getElementsByClassName(this.constructor.demoClassName)[0])) {
        iframe = document.createElement('iframe');
        iframe.className = this.constructor.demoClassName;
        iframe.width = '100%';
        iframe.height = 200;
        el.appendChild(iframe);
      }
      doc = iframe.contentDocument;
      doc.write(this.fixIframeSource(source.textContent));
      doc.close();
    };

    JqueryPage.prototype.fixIframeSource = function(source) {
      source = source.replace('"/resources/', '"https://api.jquery.com/resources/');
      source = source.replace('</head>', "<style>\n  html, body { border: 0; margin: 0; padding: 0; }\n  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }\n</style>\n<script>\n  $.ajaxPrefilter(function(opt, opt2, xhr) {\n    if (opt.url.indexOf('http') !== 0) {\n      xhr.abort();\n      document.body.innerHTML = \"<p><strong>This demo cannot run inside DevDocs.</strong></p>\";\n    }\n  });\n</script>\n</head>");
      return source.replace(/<script>/gi, '<script nonce="devdocs">');
    };

    return JqueryPage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.LuaPage = (function(superClass) {
    extend(LuaPage, superClass);

    function LuaPage() {
      return LuaPage.__super__.constructor.apply(this, arguments);
    }

    LuaPage.prototype.prepare = function() {
      this.highlightCode(this.findAllByTag('pre'), 'lua');
    };

    return LuaPage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.RdocPage = (function(superClass) {
    extend(RdocPage, superClass);

    function RdocPage() {
      return RdocPage.__super__.constructor.apply(this, arguments);
    }

    RdocPage.events = {
      click: 'onClick'
    };

    RdocPage.prototype.onClick = function(event) {
      var isShown, source;
      if (!event.target.classList.contains('method-click-advice')) {
        return;
      }
      $.stopEvent(event);
      source = $('.method-source-code', event.target.parentNode.parentNode);
      isShown = source.style.display === 'block';
      source.style.display = isShown ? 'none' : 'block';
      return event.target.textContent = isShown ? 'Show source' : 'Hide source';
    };

    return RdocPage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.SimplePage = (function(superClass) {
    extend(SimplePage, superClass);

    function SimplePage() {
      return SimplePage.__super__.constructor.apply(this, arguments);
    }

    SimplePage.prototype.prepare = function() {
      var el, i, len, ref;
      ref = this.findAll('pre[data-language]');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        this.highlightCode(el, el.getAttribute('data-language'));
      }
    };

    return SimplePage;

  })(app.views.BasePage);

  app.views.AngularPage = app.views.AngularjsPage = app.views.AsyncPage = app.views.BootstrapPage = app.views.BowerPage = app.views.CPage = app.views.CakephpPage = app.views.ChaiPage = app.views.CodeceptionPage = app.views.CodeceptjsPage = app.views.CoffeescriptPage = app.views.CordovaPage = app.views.CrystalPage = app.views.D3Page = app.views.DrupalPage = app.views.ElixirPage = app.views.EmberPage = app.views.ExpressPage = app.views.GoPage = app.views.ImmutablePage = app.views.InfluxdataPage = app.views.KnockoutPage = app.views.KotlinPage = app.views.LaravelPage = app.views.LodashPage = app.views.LovePage = app.views.MarionettePage = app.views.MdnPage = app.views.MeteorPage = app.views.MochaPage = app.views.ModernizrPage = app.views.MomentPage = app.views.MongoosePage = app.views.NginxPage = app.views.NodePage = app.views.PerlPage = app.views.PhalconPage = app.views.PhaserPage = app.views.PhpPage = app.views.PhpunitPage = app.views.PostgresPage = app.views.RamdaPage = app.views.ReactPage = app.views.ReduxPage = app.views.RethinkdbPage = app.views.RubydocPage = app.views.RustPage = app.views.SinonPage = app.views.SocketioPage = app.views.SphinxPage = app.views.SphinxSimplePage = app.views.TensorflowPage = app.views.TypescriptPage = app.views.UnderscorePage = app.views.VagrantPage = app.views.VuePage = app.views.WebpackPage = app.views.YarnPage = app.views.YiiPage = app.views.SimplePage;

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.SqlitePage = (function(superClass) {
    extend(SqlitePage, superClass);

    function SqlitePage() {
      this.onClick = bind(this.onClick, this);
      return SqlitePage.__super__.constructor.apply(this, arguments);
    }

    SqlitePage.events = {
      click: 'onClick'
    };

    SqlitePage.prototype.onClick = function(event) {
      var el, id;
      if (!(id = event.target.getAttribute('data-toggle'))) {
        return;
      }
      if (!(el = this.find("#" + id))) {
        return;
      }
      $.stopEvent(event);
      if (el.style.display === 'none') {
        el.style.display = 'block';
        event.target.textContent = 'hide';
      } else {
        el.style.display = 'none';
        event.target.textContent = 'show';
      }
    };

    return SqlitePage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.SupportTablesPage = (function(superClass) {
    extend(SupportTablesPage, superClass);

    function SupportTablesPage() {
      return SupportTablesPage.__super__.constructor.apply(this, arguments);
    }

    SupportTablesPage.events = {
      click: 'onClick'
    };

    SupportTablesPage.prototype.onClick = function(event) {
      var el;
      if (!event.target.classList.contains('show-all')) {
        return;
      }
      $.stopEvent(event);
      el = event.target;
      while (el.tagName !== 'TABLE') {
        el = el.parentNode;
      }
      el.classList.add('show-all');
    };

    return SupportTablesPage;

  })(app.views.BasePage);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.ListFocus = (function(superClass) {
    extend(ListFocus, superClass);

    ListFocus.activeClass = 'focus';

    ListFocus.events = {
      click: 'onClick'
    };

    ListFocus.shortcuts = {
      up: 'onUp',
      down: 'onDown',
      left: 'onLeft',
      enter: 'onEnter',
      superEnter: 'onSuperEnter',
      escape: 'blur'
    };

    function ListFocus(el1) {
      this.el = el1;
      this.onClick = bind(this.onClick, this);
      this.onSuperEnter = bind(this.onSuperEnter, this);
      this.onEnter = bind(this.onEnter, this);
      this.onLeft = bind(this.onLeft, this);
      this.onUp = bind(this.onUp, this);
      this.onDown = bind(this.onDown, this);
      this.blur = bind(this.blur, this);
      ListFocus.__super__.constructor.apply(this, arguments);
      this.focusOnNextFrame = $.framify(this.focus, this);
    }

    ListFocus.prototype.focus = function(el, options) {
      if (options == null) {
        options = {};
      }
      if (el && !el.classList.contains(this.constructor.activeClass)) {
        this.blur();
        el.classList.add(this.constructor.activeClass);
        if (options.silent !== true) {
          $.trigger(el, 'focus');
        }
      }
    };

    ListFocus.prototype.blur = function() {
      var cursor;
      if (cursor = this.getCursor()) {
        cursor.classList.remove(this.constructor.activeClass);
        $.trigger(cursor, 'blur');
      }
    };

    ListFocus.prototype.getCursor = function() {
      return this.findByClass(this.constructor.activeClass) || this.findByClass(app.views.ListSelect.activeClass);
    };

    ListFocus.prototype.findNext = function(cursor) {
      var next;
      if (next = cursor.nextSibling) {
        if (next.tagName === 'A') {
          return next;
        } else if (next.tagName === 'SPAN') {
          $.click(next);
          return this.findNext(cursor);
        } else if (next.tagName === 'DIV') {
          if (cursor.className.indexOf(' open') >= 0) {
            return this.findFirst(next) || this.findNext(next);
          } else {
            return this.findNext(next);
          }
        } else if (next.tagName === 'H6') {
          return this.findNext(next);
        }
      } else if (cursor.parentElement !== this.el) {
        return this.findNext(cursor.parentElement);
      }
    };

    ListFocus.prototype.findFirst = function(cursor) {
      var first;
      if (!(first = cursor.firstChild)) {
        return;
      }
      if (first.tagName === 'A') {
        return first;
      } else if (first.tagName === 'SPAN') {
        $.click(first);
        return this.findFirst(cursor);
      }
    };

    ListFocus.prototype.findPrev = function(cursor) {
      var prev;
      if (prev = cursor.previousSibling) {
        if (prev.tagName === 'A') {
          return prev;
        } else if (prev.tagName === 'SPAN') {
          $.click(prev);
          return this.findPrev(cursor);
        } else if (prev.tagName === 'DIV') {
          if (prev.previousSibling.className.indexOf('open') >= 0) {
            return this.findLast(prev) || this.findPrev(prev);
          } else {
            return this.findPrev(prev);
          }
        } else if (prev.tagName === 'H6') {
          return this.findPrev(prev);
        }
      } else if (cursor.parentElement !== this.el) {
        return this.findPrev(cursor.parentElement);
      }
    };

    ListFocus.prototype.findLast = function(cursor) {
      var last;
      if (!(last = cursor.lastChild)) {
        return;
      }
      if (last.tagName === 'A') {
        return last;
      } else if (last.tagName === 'SPAN' || last.tagName === 'H6') {
        return this.findPrev(last);
      } else if (last.tagName === 'DIV') {
        return this.findLast(last);
      }
    };

    ListFocus.prototype.onDown = function() {
      var cursor;
      if (cursor = this.getCursor()) {
        this.focusOnNextFrame(this.findNext(cursor));
      } else {
        this.focusOnNextFrame(this.findByTag('a'));
      }
    };

    ListFocus.prototype.onUp = function() {
      var cursor;
      if (cursor = this.getCursor()) {
        this.focusOnNextFrame(this.findPrev(cursor));
      } else {
        this.focusOnNextFrame(this.findLastByTag('a'));
      }
    };

    ListFocus.prototype.onLeft = function() {
      var cursor;
      cursor = this.getCursor();
      if (cursor && !cursor.classList.contains(app.views.ListFold.activeClass) && cursor.parentElement !== this.el) {
        this.focusOnNextFrame(cursor.parentElement.previousSibling);
      }
    };

    ListFocus.prototype.onEnter = function() {
      var cursor;
      if (cursor = this.getCursor()) {
        $.click(cursor);
      }
    };

    ListFocus.prototype.onSuperEnter = function() {
      var cursor;
      if (cursor = this.getCursor()) {
        $.popup(cursor);
      }
    };

    ListFocus.prototype.onClick = function(event) {
      if (event.which !== 1 || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.target.tagName === 'A') {
        this.focus(event.target, {
          silent: true
        });
      }
    };

    return ListFocus;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.ListFold = (function(superClass) {
    extend(ListFold, superClass);

    ListFold.targetClass = '_list-dir';

    ListFold.handleClass = '_list-arrow';

    ListFold.activeClass = 'open';

    ListFold.events = {
      click: 'onClick'
    };

    ListFold.shortcuts = {
      left: 'onLeft',
      right: 'onRight'
    };

    function ListFold(el1) {
      this.el = el1;
      this.onClick = bind(this.onClick, this);
      this.onRight = bind(this.onRight, this);
      this.onLeft = bind(this.onLeft, this);
      ListFold.__super__.constructor.apply(this, arguments);
    }

    ListFold.prototype.open = function(el) {
      if (el && !el.classList.contains(this.constructor.activeClass)) {
        el.classList.add(this.constructor.activeClass);
        $.trigger(el, 'open');
      }
    };

    ListFold.prototype.close = function(el) {
      if (el && el.classList.contains(this.constructor.activeClass)) {
        el.classList.remove(this.constructor.activeClass);
        $.trigger(el, 'close');
      }
    };

    ListFold.prototype.toggle = function(el) {
      if (el.classList.contains(this.constructor.activeClass)) {
        this.close(el);
      } else {
        this.open(el);
      }
    };

    ListFold.prototype.reset = function() {
      var el;
      while (el = this.findByClass(this.constructor.activeClass)) {
        this.close(el);
      }
    };

    ListFold.prototype.getCursor = function() {
      return this.findByClass(app.views.ListFocus.activeClass) || this.findByClass(app.views.ListSelect.activeClass);
    };

    ListFold.prototype.onLeft = function() {
      var cursor;
      cursor = this.getCursor();
      if (cursor != null ? cursor.classList.contains(this.constructor.activeClass) : void 0) {
        this.close(cursor);
      }
    };

    ListFold.prototype.onRight = function() {
      var cursor;
      cursor = this.getCursor();
      if (cursor != null ? cursor.classList.contains(this.constructor.targetClass) : void 0) {
        this.open(cursor);
      }
    };

    ListFold.prototype.onClick = function(event) {
      var el;
      if (event.which !== 1 || event.metaKey || event.ctrlKey) {
        return;
      }
      if (!event.pageY) {
        return;
      }
      el = event.target;
      if (el.parentElement.tagName.toUpperCase() === 'SVG') {
        el = el.parentElement;
      }
      if (el.classList.contains(this.constructor.handleClass)) {
        $.stopEvent(event);
        this.toggle(el.parentElement);
      } else if (el.classList.contains(this.constructor.targetClass)) {
        if (el.hasAttribute('href')) {
          if (el.classList.contains(this.constructor.activeClass)) {
            if (el.classList.contains(app.views.ListSelect.activeClass)) {
              this.close(el);
            }
          } else {
            this.open(el);
          }
        } else {
          this.toggle(el);
        }
      }
    };

    return ListFold;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.ListSelect = (function(superClass) {
    extend(ListSelect, superClass);

    ListSelect.activeClass = 'active';

    ListSelect.events = {
      click: 'onClick'
    };

    function ListSelect(el1) {
      this.el = el1;
      this.onClick = bind(this.onClick, this);
      ListSelect.__super__.constructor.apply(this, arguments);
    }

    ListSelect.prototype.deactivate = function() {
      if (ListSelect.__super__.deactivate.apply(this, arguments)) {
        this.deselect();
      }
    };

    ListSelect.prototype.select = function(el) {
      this.deselect();
      if (el) {
        el.classList.add(this.constructor.activeClass);
        $.trigger(el, 'select');
      }
    };

    ListSelect.prototype.deselect = function() {
      var selection;
      if (selection = this.getSelection()) {
        selection.classList.remove(this.constructor.activeClass);
        $.trigger(selection, 'deselect');
      }
    };

    ListSelect.prototype.selectByHref = function(href) {
      var ref;
      if (((ref = this.getSelection()) != null ? ref.getAttribute('href') : void 0) !== href) {
        this.select(this.find("a[href='" + href + "']"));
      }
    };

    ListSelect.prototype.selectCurrent = function() {
      this.selectByHref(location.pathname + location.hash);
    };

    ListSelect.prototype.getSelection = function() {
      return this.findByClass(this.constructor.activeClass);
    };

    ListSelect.prototype.onClick = function(event) {
      if (event.which !== 1 || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.target.tagName === 'A') {
        this.select(event.target);
      }
    };

    return ListSelect;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.PaginatedList = (function(superClass) {
    var PER_PAGE;

    extend(PaginatedList, superClass);

    PER_PAGE = app.config.max_results;

    function PaginatedList(data) {
      var base, base1;
      this.data = data;
      this.onClick = bind(this.onClick, this);
      if ((base = ((base1 = this.constructor).events || (base1.events = {}))).click == null) {
        base.click = 'onClick';
      }
      PaginatedList.__super__.constructor.apply(this, arguments);
    }

    PaginatedList.prototype.renderPaginated = function() {
      this.page = 0;
      if (this.totalPages() > 1) {
        this.paginateNext();
      } else {
        this.html(this.renderAll());
      }
    };

    PaginatedList.prototype.renderAll = function() {
      return this.render(this.data);
    };

    PaginatedList.prototype.renderPage = function(page) {
      return this.render(this.data.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    };

    PaginatedList.prototype.renderPageLink = function(count) {
      return this.tmpl('sidebarPageLink', count);
    };

    PaginatedList.prototype.renderPrevLink = function(page) {
      return this.renderPageLink((page - 1) * PER_PAGE);
    };

    PaginatedList.prototype.renderNextLink = function(page) {
      return this.renderPageLink(this.data.length - page * PER_PAGE);
    };

    PaginatedList.prototype.totalPages = function() {
      return Math.ceil(this.data.length / PER_PAGE);
    };

    PaginatedList.prototype.paginate = function(link) {
      $.lockScroll(link.nextSibling || link.previousSibling, (function(_this) {
        return function() {
          $.batchUpdate(_this.el, function() {
            if (link.nextSibling) {
              _this.paginatePrev(link);
            } else {
              _this.paginateNext(link);
            }
          });
        };
      })(this));
    };

    PaginatedList.prototype.paginateNext = function() {
      if (this.el.lastChild) {
        this.remove(this.el.lastChild);
      }
      if (this.page >= 2) {
        this.hideTopPage();
      }
      this.page++;
      this.append(this.renderPage(this.page));
      if (this.page < this.totalPages()) {
        this.append(this.renderNextLink(this.page));
      }
    };

    PaginatedList.prototype.paginatePrev = function() {
      this.remove(this.el.firstChild);
      this.hideBottomPage();
      this.page--;
      this.prepend(this.renderPage(this.page - 1));
      if (this.page >= 3) {
        this.prepend(this.renderPrevLink(this.page - 1));
      }
    };

    PaginatedList.prototype.paginateTo = function(object) {
      var i, index, ref;
      index = this.data.indexOf(object);
      if (index >= PER_PAGE) {
        for (i = 0, ref = Math.floor(index / PER_PAGE); 0 <= ref ? i < ref : i > ref; 0 <= ref ? i++ : i--) {
          this.paginateNext();
        }
      }
    };

    PaginatedList.prototype.hideTopPage = function() {
      var i, n, ref;
      n = this.page <= 2 ? PER_PAGE : PER_PAGE + 1;
      for (i = 0, ref = n; 0 <= ref ? i < ref : i > ref; 0 <= ref ? i++ : i--) {
        this.remove(this.el.firstChild);
      }
      this.prepend(this.renderPrevLink(this.page));
    };

    PaginatedList.prototype.hideBottomPage = function() {
      var i, n, ref;
      n = this.page === this.totalPages() ? this.data.length % PER_PAGE || PER_PAGE : PER_PAGE + 1;
      for (i = 0, ref = n; 0 <= ref ? i < ref : i > ref; 0 <= ref ? i++ : i--) {
        this.remove(this.el.lastChild);
      }
      this.append(this.renderNextLink(this.page - 1));
    };

    PaginatedList.prototype.onClick = function(event) {
      if (event.target.tagName === 'SPAN') {
        $.stopEvent(event);
        this.paginate(event.target);
      }
    };

    return PaginatedList;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Search = (function(superClass) {
    var HASH_RGX, SEARCH_PARAM;

    extend(Search, superClass);

    function Search() {
      this.afterRoute = bind(this.afterRoute, this);
      this.onRoot = bind(this.onRoot, this);
      this.onClick = bind(this.onClick, this);
      this.onEnd = bind(this.onEnd, this);
      this.onResults = bind(this.onResults, this);
      this.stackoverflow = bind(this.stackoverflow, this);
      this.google = bind(this.google, this);
      this.searchUrl = bind(this.searchUrl, this);
      this.onInput = bind(this.onInput, this);
      this.onReady = bind(this.onReady, this);
      this.autoFocus = bind(this.autoFocus, this);
      return Search.__super__.constructor.apply(this, arguments);
    }

    SEARCH_PARAM = app.config.search_param;

    Search.el = '._search';

    Search.activeClass = '_search-active';

    Search.elements = {
      input: '._search-input',
      resetLink: '._search-clear'
    };

    Search.events = {
      input: 'onInput',
      click: 'onClick',
      submit: 'onSubmit'
    };

    Search.shortcuts = {
      typing: 'autoFocus',
      altG: 'google',
      altS: 'stackoverflow'
    };

    Search.routes = {
      root: 'onRoot',
      after: 'afterRoute'
    };

    Search.prototype.init = function() {
      this.addSubview(this.scope = new app.views.SearchScope(this.el));
      this.searcher = new app.Searcher;
      this.searcher.on('results', this.onResults).on('end', this.onEnd);
      app.on('ready', this.onReady);
      $.on(window, 'hashchange', this.searchUrl);
      $.on(window, 'focus', this.autoFocus);
    };

    Search.prototype.focus = function() {
      this.delay((function(_this) {
        return function() {
          if (document.activeElement !== _this.input) {
            return _this.input.focus();
          }
        };
      })(this));
    };

    Search.prototype.autoFocus = function() {
      if (!$.isTouchScreen()) {
        if (document.activeElement !== this.input) {
          this.input.focus();
        }
      }
    };

    Search.prototype.reset = function() {
      this.el.reset();
      this.onInput();
      this.autoFocus();
    };

    Search.prototype.disable = function() {
      this.input.setAttribute('disabled', 'disabled');
    };

    Search.prototype.enable = function() {
      this.input.removeAttribute('disabled');
    };

    Search.prototype.onReady = function() {
      this.value = '';
      this.delay(this.onInput);
    };

    Search.prototype.onInput = function() {
      if ((this.value == null) || this.value === this.input.value) {
        return;
      }
      this.value = this.input.value;
      if (this.value.length) {
        this.search();
      } else {
        this.clear();
      }
    };

    Search.prototype.search = function(url) {
      if (url == null) {
        url = false;
      }
      this.addClass(this.constructor.activeClass);
      this.trigger('searching');
      this.hasResults = null;
      this.flags = {
        urlSearch: url,
        initialResults: true
      };
      this.searcher.find(this.scope.getScope().entries.all(), 'text', this.value);
    };

    Search.prototype.searchUrl = function() {
      var value;
      if (app.router.isRoot()) {
        this.scope.searchUrl();
      }
      if (!(value = this.extractHashValue())) {
        return;
      }
      this.input.value = this.value = value;
      this.input.setSelectionRange(value.length, value.length);
      this.search(true);
      return true;
    };

    Search.prototype.clear = function() {
      this.removeClass(this.constructor.activeClass);
      this.trigger('clear');
    };

    Search.prototype.externalSearch = function(url) {
      var value;
      if (value = this.value) {
        if (this.scope.name()) {
          value = (this.scope.name()) + " " + value;
        }
        $.popup("" + url + (encodeURIComponent(value)));
        this.reset();
      }
    };

    Search.prototype.google = function() {
      this.externalSearch("https://www.google.com/search?q=");
    };

    Search.prototype.stackoverflow = function() {
      this.externalSearch("https://stackoverflow.com/search?q=");
    };

    Search.prototype.onResults = function(results) {
      results = results.filter(function(e) {
        return e.path !== "javascript:;";
      });
      if (results.length) {
        this.hasResults = true;
      }
      this.trigger('results', results, this.flags);
      this.flags.initialResults = false;
    };

    Search.prototype.onEnd = function() {
      if (!this.hasResults) {
        this.trigger('noresults');
      }
    };

    Search.prototype.onClick = function(event) {
      if (event.target === this.resetLink) {
        $.stopEvent(event);
        this.reset();
        this.focus();
      }
    };

    Search.prototype.onSubmit = function(event) {
      $.stopEvent(event);
    };

    Search.prototype.onRoot = function(context) {
      if (!context.init) {
        this.reset();
      }
    };

    Search.prototype.afterRoute = function(name, context) {
      if (context.hash) {
        this.delay(this.searchUrl);
      }
      return this.autoFocus();
    };

    Search.prototype.extractHashValue = function() {
      var value;
      if ((value = this.getHashValue()) != null) {
        app.router.replaceHash();
        return value;
      }
    };

    HASH_RGX = new RegExp("^#" + SEARCH_PARAM + "=(.*)");

    Search.prototype.getHashValue = function() {
      var ref;
      try {
        return (ref = HASH_RGX.exec($.urlDecode(location.hash))) != null ? ref[1] : void 0;
      } catch (error) {

      }
    };

    return Search;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.SearchScope = (function(superClass) {
    var HASH_RGX, SEARCH_PARAM;

    extend(SearchScope, superClass);

    SEARCH_PARAM = app.config.search_param;

    SearchScope.elements = {
      input: '._search-input',
      tag: '._search-tag'
    };

    SearchScope.events = {
      keydown: 'onKeydown'
    };

    SearchScope.routes = {
      after: 'afterRoute'
    };

    SearchScope.shortcuts = {
      escape: 'reset'
    };

    function SearchScope(el) {
      this.el = el;
      this.afterRoute = bind(this.afterRoute, this);
      this.onKeydown = bind(this.onKeydown, this);
      this.reset = bind(this.reset, this);
      this.onResults = bind(this.onResults, this);
      SearchScope.__super__.constructor.apply(this, arguments);
    }

    SearchScope.prototype.init = function() {
      this.placeholder = this.input.getAttribute('placeholder');
      this.searcher = new app.SynchronousSearcher({
        fuzzy_min_length: 2,
        max_results: 1
      });
      this.searcher.on('results', this.onResults);
    };

    SearchScope.prototype.getScope = function() {
      return this.doc || app;
    };

    SearchScope.prototype.name = function() {
      var ref;
      return (ref = this.doc) != null ? ref.name : void 0;
    };

    SearchScope.prototype.search = function(value, searchDisabled) {
      if (searchDisabled == null) {
        searchDisabled = false;
      }
      if (this.doc) {
        return;
      }
      this.searcher.find(app.docs.all(), 'text', value);
      if (!this.doc && searchDisabled) {
        this.searcher.find(app.disabledDocs.all(), 'text', value);
      }
    };

    SearchScope.prototype.searchUrl = function() {
      var value;
      if (value = this.extractHashValue()) {
        this.search(value, true);
      }
    };

    SearchScope.prototype.onResults = function(results) {
      var doc;
      if (!(doc = results[0])) {
        return;
      }
      if (app.docs.contains(doc)) {
        this.selectDoc(doc);
      } else {
        this.redirectToDoc(doc);
      }
    };

    SearchScope.prototype.selectDoc = function(doc) {
      var previousDoc;
      previousDoc = this.doc;
      if (doc === previousDoc) {
        return;
      }
      this.doc = doc;
      this.tag.textContent = doc.fullName;
      this.tag.style.display = 'block';
      this.input.removeAttribute('placeholder');
      this.input.value = this.input.value.slice(this.input.selectionStart);
      this.input.style.paddingLeft = this.tag.offsetWidth + 10 + 'px';
      $.trigger(this.input, 'input');
      this.trigger('change', this.doc, previousDoc);
    };

    SearchScope.prototype.redirectToDoc = function(doc) {
      var hash;
      hash = location.hash;
      app.router.replaceHash('');
      window.location = doc.fullPath() + hash;
    };

    SearchScope.prototype.reset = function() {
      var previousDoc;
      if (!this.doc) {
        return;
      }
      previousDoc = this.doc;
      this.doc = null;
      this.tag.textContent = '';
      this.tag.style.display = 'none';
      this.input.setAttribute('placeholder', this.placeholder);
      this.input.style.paddingLeft = '';
      this.trigger('change', null, previousDoc);
    };

    SearchScope.prototype.onKeydown = function(event) {
      if (event.which === 8) {
        if (this.doc && !this.input.value) {
          $.stopEvent(event);
          this.reset();
        }
      } else if (!this.doc && this.input.value) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        if (event.which === 9 || event.which === 32 && (app.isMobile() || $.isTouchScreen())) {
          this.search(this.input.value.slice(0, this.input.selectionStart));
          if (this.doc) {
            $.stopEvent(event);
          }
        }
      }
    };

    SearchScope.prototype.extractHashValue = function() {
      var newHash, value;
      if (value = this.getHashValue()) {
        newHash = $.urlDecode(location.hash).replace("#" + SEARCH_PARAM + "=" + value + " ", "#" + SEARCH_PARAM + "=");
        app.router.replaceHash(newHash);
        return value;
      }
    };

    HASH_RGX = new RegExp("^#" + SEARCH_PARAM + "=(.+?) .");

    SearchScope.prototype.getHashValue = function() {
      var ref;
      try {
        return (ref = HASH_RGX.exec($.urlDecode(location.hash))) != null ? ref[1] : void 0;
      } catch (error) {

      }
    };

    SearchScope.prototype.afterRoute = function(name, context) {
      if (!app.isSingleDoc() && context.init && context.doc) {
        this.selectDoc(context.doc);
      }
    };

    return SearchScope;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.DocList = (function(superClass) {
    extend(DocList, superClass);

    function DocList() {
      this.afterRoute = bind(this.afterRoute, this);
      this.onEnabled = bind(this.onEnabled, this);
      this.onClick = bind(this.onClick, this);
      this.onClose = bind(this.onClose, this);
      this.onOpen = bind(this.onOpen, this);
      this.render = bind(this.render, this);
      return DocList.__super__.constructor.apply(this, arguments);
    }

    DocList.className = '_list';

    DocList.attributes = {
      role: 'navigation'
    };

    DocList.events = {
      open: 'onOpen',
      close: 'onClose',
      click: 'onClick'
    };

    DocList.routes = {
      after: 'afterRoute'
    };

    DocList.elements = {
      disabledTitle: '._list-title',
      disabledList: '._disabled-list'
    };

    DocList.prototype.init = function() {
      this.lists = {};
      this.addSubview(this.listFocus = new app.views.ListFocus(this.el));
      this.addSubview(this.listFold = new app.views.ListFold(this.el));
      this.addSubview(this.listSelect = new app.views.ListSelect(this.el));
      app.on('ready', this.render);
    };

    DocList.prototype.activate = function() {
      var list, ref, slug;
      if (DocList.__super__.activate.apply(this, arguments)) {
        ref = this.lists;
        for (slug in ref) {
          list = ref[slug];
          list.activate();
        }
        this.listSelect.selectCurrent();
      }
    };

    DocList.prototype.deactivate = function() {
      var list, ref, slug;
      if (DocList.__super__.deactivate.apply(this, arguments)) {
        ref = this.lists;
        for (slug in ref) {
          list = ref[slug];
          list.deactivate();
        }
      }
    };

    DocList.prototype.render = function() {
      var doc, html, i, len, ref;
      html = '';
      ref = app.docs.all();
      for (i = 0, len = ref.length; i < len; i++) {
        doc = ref[i];
        html += this.tmpl('sidebarDoc', doc, {
          fullName: app.docs.countAllBy('name', doc.name) > 1
        });
      }
      this.html(html);
      if (!(app.isSingleDoc() || app.disabledDocs.size() === 0)) {
        this.renderDisabled();
      }
    };

    DocList.prototype.renderDisabled = function() {
      this.append(this.tmpl('sidebarDisabled', {
        count: app.disabledDocs.size()
      }));
      this.refreshElements();
      this.renderDisabledList();
    };

    DocList.prototype.renderDisabledList = function() {
      if (app.settings.get('hideDisabled')) {
        this.removeDisabledList();
      } else {
        this.appendDisabledList();
      }
    };

    DocList.prototype.appendDisabledList = function() {
      var doc, docs, html, ref, ref1, versions;
      html = '';
      docs = (ref = []).concat.apply(ref, app.disabledDocs.all());
      while (doc = docs.shift()) {
        if (doc.version != null) {
          versions = '';
          while (true) {
            versions += this.tmpl('sidebarDoc', doc, {
              disabled: true
            });
            if (((ref1 = docs[0]) != null ? ref1.name : void 0) !== doc.name) {
              break;
            }
            doc = docs.shift();
          }
          html += this.tmpl('sidebarDisabledVersionedDoc', doc, versions);
        } else {
          html += this.tmpl('sidebarDoc', doc, {
            disabled: true
          });
        }
      }
      this.append(this.tmpl('sidebarDisabledList', html));
      this.disabledTitle.classList.add('open-title');
      this.refreshElements();
    };

    DocList.prototype.removeDisabledList = function() {
      if (this.disabledList) {
        $.remove(this.disabledList);
      }
      this.disabledTitle.classList.remove('open-title');
      this.refreshElements();
    };

    DocList.prototype.reset = function(options) {
      var ref;
      if (options == null) {
        options = {};
      }
      this.listSelect.deselect();
      if ((ref = this.listFocus) != null) {
        ref.blur();
      }
      this.listFold.reset();
      if (options.revealCurrent || app.isSingleDoc()) {
        this.revealCurrent();
      }
    };

    DocList.prototype.onOpen = function(event) {
      var doc;
      $.stopEvent(event);
      doc = app.docs.findBy('slug', event.target.getAttribute('data-slug'));
      if (doc && !this.lists[doc.slug]) {
        this.lists[doc.slug] = doc.types.isEmpty() ? new app.views.EntryList(doc.entries.all()) : new app.views.TypeList(doc);
        $.after(event.target, this.lists[doc.slug].el);
      }
    };

    DocList.prototype.onClose = function(event) {
      var doc;
      $.stopEvent(event);
      doc = app.docs.findBy('slug', event.target.getAttribute('data-slug'));
      if (doc && this.lists[doc.slug]) {
        this.lists[doc.slug].detach();
        delete this.lists[doc.slug];
      }
    };

    DocList.prototype.select = function(model) {
      this.listSelect.selectByHref(model != null ? model.fullPath() : void 0);
    };

    DocList.prototype.reveal = function(model) {
      this.openDoc(model.doc);
      if (model.type) {
        this.openType(model.getType());
      }
      this.focus(model);
      this.paginateTo(model);
      this.scrollTo(model);
    };

    DocList.prototype.focus = function(model) {
      var ref;
      if ((ref = this.listFocus) != null) {
        ref.focus(this.find("a[href='" + (model.fullPath()) + "']"));
      }
    };

    DocList.prototype.revealCurrent = function() {
      var model;
      if (model = app.router.context.type || app.router.context.entry) {
        this.reveal(model);
        this.select(model);
      }
    };

    DocList.prototype.openDoc = function(doc) {
      if (app.disabledDocs.contains(doc) && doc.version) {
        this.listFold.open(this.find("[data-slug='" + doc.slug_without_version + "']"));
      }
      this.listFold.open(this.find("[data-slug='" + doc.slug + "']"));
    };

    DocList.prototype.closeDoc = function(doc) {
      this.listFold.close(this.find("[data-slug='" + doc.slug + "']"));
    };

    DocList.prototype.openType = function(type) {
      this.listFold.open(this.lists[type.doc.slug].find("[data-slug='" + type.slug + "']"));
    };

    DocList.prototype.paginateTo = function(model) {
      var ref;
      if ((ref = this.lists[model.doc.slug]) != null) {
        ref.paginateTo(model);
      }
    };

    DocList.prototype.scrollTo = function(model) {
      $.scrollTo(this.find("a[href='" + (model.fullPath()) + "']"), null, 'top', {
        margin: app.isMobile() ? 48 : 0
      });
    };

    DocList.prototype.toggleDisabled = function() {
      if (this.disabledTitle.classList.contains('open-title')) {
        this.removeDisabledList();
        app.settings.set('hideDisabled', true);
      } else {
        this.appendDisabledList();
        app.settings.set('hideDisabled', false);
      }
    };

    DocList.prototype.onClick = function(event) {
      var doc, slug, target;
      target = $.eventTarget(event);
      if (this.disabledTitle && $.hasChild(this.disabledTitle, target) && target.tagName !== 'A') {
        $.stopEvent(event);
        this.toggleDisabled();
      } else if (slug = target.getAttribute('data-enable')) {
        $.stopEvent(event);
        doc = app.disabledDocs.findBy('slug', slug);
        if (doc) {
          app.enableDoc(doc, this.onEnabled, this.onEnabled);
        }
      }
    };

    DocList.prototype.onEnabled = function() {
      this.reset();
      this.render();
    };

    DocList.prototype.afterRoute = function(route, context) {
      if (context.init) {
        if (this.activated) {
          this.reset({
            revealCurrent: true
          });
        }
      } else {
        this.select(context.type || context.entry);
      }
    };

    return DocList;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.DocPicker = (function(superClass) {
    extend(DocPicker, superClass);

    function DocPicker() {
      this.onDOMFocus = bind(this.onDOMFocus, this);
      this.onMouseUp = bind(this.onMouseUp, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      return DocPicker.__super__.constructor.apply(this, arguments);
    }

    DocPicker.className = '_list _list-picker';

    DocPicker.events = {
      mousedown: 'onMouseDown',
      mouseup: 'onMouseUp'
    };

    DocPicker.prototype.init = function() {
      this.addSubview(this.listFold = new app.views.ListFold(this.el));
    };

    DocPicker.prototype.activate = function() {
      if (DocPicker.__super__.activate.apply(this, arguments)) {
        this.render();
        $.on(this.el, 'focus', this.onDOMFocus, true);
      }
    };

    DocPicker.prototype.deactivate = function() {
      if (DocPicker.__super__.deactivate.apply(this, arguments)) {
        this.empty();
        $.off(this.el, 'focus', this.onDOMFocus, true);
        this.focusEl = null;
      }
    };

    DocPicker.prototype.render = function() {
      var doc, docs, html, ref, ref1, versions;
      html = this.tmpl('docPickerHeader');
      docs = (ref = app.docs.all()).concat.apply(ref, app.disabledDocs.all());
      while (doc = docs.shift()) {
        if (doc.version != null) {
          ref1 = this.extractVersions(docs, doc), docs = ref1[0], versions = ref1[1];
          html += this.tmpl('sidebarVersionedDoc', doc, this.renderVersions(versions), {
            open: app.docs.contains(doc)
          });
        } else {
          html += this.tmpl('sidebarLabel', doc, {
            checked: app.docs.contains(doc)
          });
        }
      }
      this.html(html + this.tmpl('docPickerNote'));
      $.requestAnimationFrame((function(_this) {
        return function() {
          var ref2;
          return (ref2 = _this.findByTag('input')) != null ? ref2.focus() : void 0;
        };
      })(this));
    };

    DocPicker.prototype.renderVersions = function(docs) {
      var doc, html, i, len;
      html = '';
      for (i = 0, len = docs.length; i < len; i++) {
        doc = docs[i];
        html += this.tmpl('sidebarLabel', doc, {
          checked: app.docs.contains(doc)
        });
      }
      return html;
    };

    DocPicker.prototype.extractVersions = function(originalDocs, version) {
      var doc, docs, i, len, versions;
      docs = [];
      versions = [version];
      for (i = 0, len = originalDocs.length; i < len; i++) {
        doc = originalDocs[i];
        (doc.name === version.name ? versions : docs).push(doc);
      }
      return [docs, versions];
    };

    DocPicker.prototype.empty = function() {
      this.resetClass();
      DocPicker.__super__.empty.apply(this, arguments);
    };

    DocPicker.prototype.getSelectedDocs = function() {
      var i, input, len, ref, results;
      ref = this.findAllByTag('input');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        input = ref[i];
        if (input != null ? input.checked : void 0) {
          results.push(input.name);
        }
      }
      return results;
    };

    DocPicker.prototype.onMouseDown = function() {
      this.mouseDown = Date.now();
    };

    DocPicker.prototype.onMouseUp = function() {
      this.mouseUp = Date.now();
    };

    DocPicker.prototype.onDOMFocus = function(event) {
      var prev, target;
      target = event.target;
      if (target.tagName === 'INPUT') {
        if (!((this.mouseDown && Date.now() < this.mouseDown + 100) || (this.mouseUp && Date.now() < this.mouseUp + 100))) {
          $.scrollTo(target.parentNode, null, 'continuous');
        }
      } else if (target.classList.contains(app.views.ListFold.targetClass)) {
        target.blur();
        if (!(this.mouseDown && Date.now() < this.mouseDown + 100)) {
          if (this.focusEl === $('input', target.nextElementSibling)) {
            if (target.classList.contains(app.views.ListFold.activeClass)) {
              this.listFold.close(target);
            }
            prev = target.previousElementSibling;
            while (!(prev.tagName === 'LABEL' || prev.classList.contains(app.views.ListFold.targetClass))) {
              prev = prev.previousElementSibling;
            }
            if (prev.classList.contains(app.views.ListFold.activeClass)) {
              prev = $.makeArray($$('input', prev.nextElementSibling)).pop();
            }
            this.delay(function() {
              return prev.focus();
            });
          } else {
            if (!target.classList.contains(app.views.ListFold.activeClass)) {
              this.listFold.open(target);
            }
            this.delay(function() {
              return $('input', target.nextElementSibling).focus();
            });
          }
        }
      }
      this.focusEl = target;
    };

    return DocPicker;

  })(app.View);

}).call(this);
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.EntryList = (function(superClass) {
    extend(EntryList, superClass);

    EntryList.tagName = 'div';

    EntryList.className = '_list _list-sub';

    function EntryList(entries1) {
      this.entries = entries1;
      EntryList.__super__.constructor.apply(this, arguments);
    }

    EntryList.prototype.init = function() {
      this.renderPaginated();
      this.activate();
    };

    EntryList.prototype.render = function(entries) {
      return this.tmpl('sidebarEntry', entries);
    };

    return EntryList;

  })(app.views.PaginatedList);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Results = (function(superClass) {
    extend(Results, superClass);

    Results.className = '_list';

    Results.events = {
      click: 'onClick'
    };

    Results.routes = {
      after: 'afterRoute'
    };

    function Results(sidebar, search) {
      this.sidebar = sidebar;
      this.search = search;
      this.onClick = bind(this.onClick, this);
      this.afterRoute = bind(this.afterRoute, this);
      this.onClear = bind(this.onClear, this);
      this.onNoResults = bind(this.onNoResults, this);
      this.onResults = bind(this.onResults, this);
      Results.__super__.constructor.apply(this, arguments);
    }

    Results.prototype.deactivate = function() {
      if (Results.__super__.deactivate.apply(this, arguments)) {
        this.empty();
      }
    };

    Results.prototype.init = function() {
      this.addSubview(this.listFocus = new app.views.ListFocus(this.el));
      this.addSubview(this.listSelect = new app.views.ListSelect(this.el));
      this.search.on('results', this.onResults).on('noresults', this.onNoResults).on('clear', this.onClear);
    };

    Results.prototype.onResults = function(entries, flags) {
      var ref;
      if (flags.initialResults) {
        if ((ref = this.listFocus) != null) {
          ref.blur();
        }
      }
      if (flags.initialResults) {
        this.empty();
      }
      this.append(this.tmpl('sidebarResult', entries));
      if (flags.initialResults) {
        if (flags.urlSearch) {
          this.openFirst();
        } else {
          this.focusFirst();
        }
      }
    };

    Results.prototype.onNoResults = function() {
      this.html(this.tmpl('sidebarNoResults'));
    };

    Results.prototype.onClear = function() {
      this.empty();
    };

    Results.prototype.focusFirst = function() {
      var ref;
      if (!app.isMobile()) {
        if ((ref = this.listFocus) != null) {
          ref.focusOnNextFrame(this.el.firstElementChild);
        }
      }
    };

    Results.prototype.openFirst = function() {
      var ref;
      if ((ref = this.el.firstElementChild) != null) {
        ref.click();
      }
    };

    Results.prototype.onDocEnabled = function(doc) {
      app.router.show(doc.fullPath());
      return this.sidebar.onDocEnabled();
    };

    Results.prototype.afterRoute = function(route, context) {
      if (route === 'entry') {
        this.listSelect.selectByHref(context.entry.fullPath());
      } else {
        this.listSelect.deselect();
      }
    };

    Results.prototype.onClick = function(event) {
      var doc, slug;
      if (event.which !== 1) {
        return;
      }
      if (slug = $.eventTarget(event).getAttribute('data-enable')) {
        $.stopEvent(event);
        doc = app.disabledDocs.findBy('slug', slug);
        if (doc) {
          return app.enableDoc(doc, this.onDocEnabled.bind(this, doc), $.noop);
        }
      }
    };

    return Results;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Sidebar = (function(superClass) {
    extend(Sidebar, superClass);

    function Sidebar() {
      this.afterRoute = bind(this.afterRoute, this);
      this.onEscape = bind(this.onEscape, this);
      this.onAltR = bind(this.onAltR, this);
      this.onClick = bind(this.onClick, this);
      this.onSelect = bind(this.onSelect, this);
      this.onFocus = bind(this.onFocus, this);
      this.onSearchClear = bind(this.onSearchClear, this);
      this.onSearching = bind(this.onSearching, this);
      this.onScopeChange = bind(this.onScopeChange, this);
      this.onReady = bind(this.onReady, this);
      this.showResults = bind(this.showResults, this);
      this.resetHover = bind(this.resetHover, this);
      this.resetHoverOnMouseMove = bind(this.resetHoverOnMouseMove, this);
      return Sidebar.__super__.constructor.apply(this, arguments);
    }

    Sidebar.el = '._sidebar';

    Sidebar.elements = {
      siderlist: '._list-wrap'
    };

    Sidebar.events = {
      focus: 'onFocus',
      select: 'onSelect',
      click: 'onClick'
    };

    Sidebar.routes = {
      after: 'afterRoute'
    };

    Sidebar.shortcuts = {
      altR: 'onAltR',
      escape: 'onEscape'
    };

    Sidebar.prototype.init = function() {
      if (!app.isMobile()) {
        this.addSubview(this.hover = new app.views.SidebarHover(this.el));
      }
      this.addSubview(this.search = new app.views.Search);
      this.search.on('searching', this.onSearching).on('clear', this.onSearchClear).scope.on('change', this.onScopeChange);
      this.results = new app.views.Results(this, this.search);
      this.docList = new app.views.DocList;
      app.on('ready', this.onReady);
      $.on(document.documentElement, 'mouseleave', (function(_this) {
        return function(event) {
          if (!(event.clientX <= 0)) {
            return _this.display();
          }
        };
      })(this));
      $.on(document.documentElement, 'mouseenter', (function(_this) {
        return function() {
          return _this.resetDisplay({
            forceNoHover: false
          });
        };
      })(this));
    };

    Sidebar.prototype.display = function() {
      this.addClass('show');
    };

    Sidebar.prototype.resetDisplay = function(options) {
      if (options == null) {
        options = {};
      }
      if (!this.hasClass('show')) {
        return;
      }
      this.removeClass('show');
      if (!(options.forceNoHover === false || this.hasClass('no-hover'))) {
        this.addClass('no-hover');
        $.on(window, 'mousemove', this.resetHoverOnMouseMove);
      }
    };

    Sidebar.prototype.resetHoverOnMouseMove = function() {
      $.off(window, 'mousemove', this.resetHoverOnMouseMove);
      return $.requestAnimationFrame(this.resetHover);
    };

    Sidebar.prototype.resetHover = function() {
      return this.removeClass('no-hover');
    };

    Sidebar.prototype.showView = function(view) {
      var ref, ref1;
      if (this.view !== view) {
        if ((ref = this.hover) != null) {
          ref.hide();
        }
        this.saveScrollPosition();
        if ((ref1 = this.view) != null) {
          ref1.deactivate();
        }
        this.view = view;
        this.render();
        this.view.activate();
        this.restoreScrollPosition();
      }
    };

    Sidebar.prototype.render = function() {
      this.inserthtml(this.siderlist, this.view);
    };

    Sidebar.prototype.showDocList = function() {
      this.showView(this.docList);
    };

    Sidebar.prototype.showResults = function() {
      this.display();
      this.showView(this.results);
    };

    Sidebar.prototype.reset = function() {
      this.display();
      this.showDocList();
      this.docList.reset();
      this.search.reset();
    };

    Sidebar.prototype.onReady = function() {
      this.view = this.docList;
      this.render();
      this.view.activate();
    };

    Sidebar.prototype.onScopeChange = function(newDoc, previousDoc) {
      if (previousDoc) {
        this.docList.closeDoc(previousDoc);
      }
      if (newDoc) {
        this.docList.reveal(newDoc.toEntry());
      } else {
        this.scrollToTop();
      }
    };

    Sidebar.prototype.saveScrollPosition = function() {
      if (this.view === this.docList) {
        this.scrollTop = this.el.scrollTop;
      }
    };

    Sidebar.prototype.restoreScrollPosition = function() {
      if (this.view === this.docList && this.scrollTop) {
        this.el.scrollTop = this.scrollTop;
        this.scrollTop = null;
      } else {
        this.scrollToTop();
      }
    };

    Sidebar.prototype.scrollToTop = function() {
      this.el.scrollTop = 0;
    };

    Sidebar.prototype.onSearching = function() {
      this.showResults();
    };

    Sidebar.prototype.onSearchClear = function() {
      this.resetDisplay();
      this.showDocList();
    };

    Sidebar.prototype.onFocus = function(event) {
      this.display();
      if (event.target !== this.el) {
        $.scrollTo(event.target, this.el, 'continuous', {
          bottomGap: 2
        });
      }
    };

    Sidebar.prototype.onSelect = function() {
      this.resetDisplay();
    };

    Sidebar.prototype.onClick = function(event) {
      var base;
      if (event.which !== 1) {
        return;
      }
      if (typeof (base = $.eventTarget(event)).hasAttribute === "function" ? base.hasAttribute('data-reset-list') : void 0) {
        $.stopEvent(event);
        this.onAltR();
      }
    };

    Sidebar.prototype.onAltR = function() {
      this.reset();
      this.docList.reset({
        revealCurrent: true
      });
      this.display();
    };

    Sidebar.prototype.onEscape = function() {
      var doc;
      this.reset();
      this.resetDisplay();
      if (doc = this.search.getScopeDoc()) {
        this.docList.reveal(doc.toEntry());
      } else {
        this.scrollToTop();
      }
    };

    Sidebar.prototype.onDocEnabled = function() {
      this.docList.onEnabled();
      this.reset();
    };

    Sidebar.prototype.afterRoute = function(name, context) {
      var ref;
      if (((ref = app.shortcuts.eventInProgress) != null ? ref.name : void 0) === 'escape') {
        return;
      }
      if (!context.init && app.router.isIndex()) {
        this.reset();
      }
      this.resetDisplay();
    };

    return Sidebar;

  })(app.View);

}).call(this);
(function() {
  var isPointerEventsSupported,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.SidebarHover = (function(superClass) {
    extend(SidebarHover, superClass);

    SidebarHover.itemClass = '_list-hover';

    SidebarHover.events = {
      focus: 'onFocus',
      blur: 'onBlur',
      mouseover: 'onMouseover',
      mouseout: 'onMouseout',
      scroll: 'onScroll',
      click: 'onClick'
    };

    SidebarHover.routes = {
      after: 'onRoute'
    };

    function SidebarHover(el1) {
      this.el = el1;
      this.onRoute = bind(this.onRoute, this);
      this.onClick = bind(this.onClick, this);
      this.onScroll = bind(this.onScroll, this);
      this.onMouseout = bind(this.onMouseout, this);
      this.onMouseover = bind(this.onMouseover, this);
      this.onBlur = bind(this.onBlur, this);
      this.onFocus = bind(this.onFocus, this);
      this.position = bind(this.position, this);
      if (!isPointerEventsSupported()) {
        delete this.constructor.events.mouseover;
      }
      SidebarHover.__super__.constructor.apply(this, arguments);
    }

    SidebarHover.prototype.show = function(el) {
      if (el !== this.cursor) {
        this.hide();
        if (this.isTarget(el) && this.isTruncated(el.lastElementChild || el)) {
          this.cursor = el;
          this.clone = this.makeClone(this.cursor);
          $.append(document.body, this.clone);
          if (this.offsetTop == null) {
            this.offsetTop = this.el.offsetTop;
          }
          this.position();
        }
      }
    };

    SidebarHover.prototype.hide = function() {
      if (this.cursor) {
        $.remove(this.clone);
        this.cursor = this.clone = null;
      }
    };

    SidebarHover.prototype.position = function() {
      var rect;
      if (this.cursor) {
        rect = $.rect(this.cursor);
        if (rect.top >= this.offsetTop) {
          this.clone.style.top = rect.top + 'px';
          this.clone.style.left = rect.left + 'px';
        } else {
          this.hide();
        }
      }
    };

    SidebarHover.prototype.makeClone = function(el) {
      var clone;
      clone = el.cloneNode(true);
      clone.classList.add('clone');
      return clone;
    };

    SidebarHover.prototype.isTarget = function(el) {
      var ref;
      return el != null ? (ref = el.classList) != null ? ref.contains(this.constructor.itemClass) : void 0 : void 0;
    };

    SidebarHover.prototype.isSelected = function(el) {
      return el.classList.contains('active');
    };

    SidebarHover.prototype.isTruncated = function(el) {
      return el.scrollWidth > el.offsetWidth;
    };

    SidebarHover.prototype.onFocus = function(event) {
      this.focusTime = Date.now();
      this.show(event.target);
    };

    SidebarHover.prototype.onBlur = function() {
      this.hide();
    };

    SidebarHover.prototype.onMouseover = function(event) {
      if (this.isTarget(event.target) && !this.isSelected(event.target) && this.mouseActivated()) {
        this.show(event.target);
      }
    };

    SidebarHover.prototype.onMouseout = function(event) {
      if (this.isTarget(event.target) && this.mouseActivated()) {
        this.hide();
      }
    };

    SidebarHover.prototype.mouseActivated = function() {
      return !this.focusTime || Date.now() - this.focusTime > 500;
    };

    SidebarHover.prototype.onScroll = function() {
      this.position();
    };

    SidebarHover.prototype.onClick = function(event) {
      if (event.target === this.clone) {
        $.click(this.cursor);
      }
    };

    SidebarHover.prototype.onRoute = function() {
      this.hide();
    };

    return SidebarHover;

  })(app.View);

  isPointerEventsSupported = function() {
    var el;
    el = document.createElement('div');
    el.style.cssText = 'pointer-events: auto';
    return el.style.pointerEvents === 'auto';
  };

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.TypeList = (function(superClass) {
    extend(TypeList, superClass);

    TypeList.tagName = 'div';

    TypeList.className = '_list _list-sub';

    TypeList.events = {
      open: 'onOpen',
      close: 'onClose'
    };

    function TypeList(doc) {
      this.doc = doc;
      this.onClose = bind(this.onClose, this);
      this.onOpen = bind(this.onOpen, this);
      TypeList.__super__.constructor.apply(this, arguments);
    }

    TypeList.prototype.init = function() {
      this.lists = {};
      this.render();
      this.activate();
    };

    TypeList.prototype.activate = function() {
      var list, ref, slug;
      if (TypeList.__super__.activate.apply(this, arguments)) {
        ref = this.lists;
        for (slug in ref) {
          list = ref[slug];
          list.activate();
        }
      }
    };

    TypeList.prototype.deactivate = function() {
      var list, ref, slug;
      if (TypeList.__super__.deactivate.apply(this, arguments)) {
        ref = this.lists;
        for (slug in ref) {
          list = ref[slug];
          list.deactivate();
        }
      }
    };

    TypeList.prototype.render = function() {
      var group, html, i, len, ref;
      html = '';
      ref = this.doc.types.groups();
      for (i = 0, len = ref.length; i < len; i++) {
        group = ref[i];
        html += this.tmpl('sidebarType', group);
      }
      return this.html(html);
    };

    TypeList.prototype.onOpen = function(event) {
      var type;
      $.stopEvent(event);
      type = this.doc.types.findBy('slug', event.target.getAttribute('data-slug'));
      if (type && !this.lists[type.slug]) {
        this.lists[type.slug] = new app.views.EntryList(type.entries());
        $.after(event.target, this.lists[type.slug].el);
      }
    };

    TypeList.prototype.onClose = function(event) {
      var type;
      $.stopEvent(event);
      type = this.doc.types.findBy('slug', event.target.getAttribute('data-slug'));
      if (type && this.lists[type.slug]) {
        this.lists[type.slug].detach();
        delete this.lists[type.slug];
      }
    };

    TypeList.prototype.paginateTo = function(model) {
      var ref;
      if (model.type) {
        if ((ref = this.lists[model.getType().slug]) != null) {
          ref.paginateTo(model);
        }
      }
    };

    return TypeList;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.ToTopView = (function(superClass) {
    extend(ToTopView, superClass);

    function ToTopView() {
      this.updatePosition = bind(this.updatePosition, this);
      this.onClick = bind(this.onClick, this);
      this.onTouchEnd = bind(this.onTouchEnd, this);
      return ToTopView.__super__.constructor.apply(this, arguments);
    }

    ToTopView.tagName = 'a';

    ToTopView.className = '_totop';

    ToTopView.events = {
      click: 'onClick',
      touchend: 'onTouchEnd'
    };

    ToTopView.prototype.init = function() {
      this.activate();
      this.render();
      return this.bindContentScroll();
    };

    ToTopView.prototype.bindContentScroll = function() {
      var addEventListener, timer;
      this._content = document.documentElement;
      timer = void 0;
      addEventListener = function(el, evt, fn) {
        if (window.addEventListener) {
          el.addEventListener(evt, fn, false);
        } else if (window.attachEvent) {
          el.attachEvent('on' + evt, fn);
        } else {
          el['on' + evt] = fn;
        }
      };
      addEventListener(window, "scroll", (function(_this) {
        return function() {
          timer && clearTimeout(timer);
          return setTimeout(function() {
            return _this.updatePosition();
          }, 50);
        };
      })(this));
      addEventListener(window, "load", (function(_this) {
        return function() {
          return _this.updatePosition();
        };
      })(this));
      return this.updatePosition();
    };

    ToTopView.prototype.render = function() {
      this.el.setAttribute('href', 'javascript:;');
      this.el.setAttribute('title', 'Go to Top');
      return document.body.appendChild(this.el);
    };

    ToTopView.prototype.show = function() {
      return this.el.style.display = 'block';
    };

    ToTopView.prototype.hide = function() {
      return this.el.style.display = 'none';
    };

    ToTopView.prototype.onTouchEnd = function() {
      return this.el.blur();
    };

    ToTopView.prototype.onClick = function() {
      var content;
      this.el.focus();
      content = this._content;
      return $.animate(content, (function(process) {
        return this.scrollTop = process;
      }), content.scrollTop, 0, 500);
    };

    ToTopView.prototype.updatePosition = function() {
      if (this._content.scrollTop > 100) {
        return this.show();
      } else {
        return this.hide();
      }
    };

    return ToTopView;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.Content = (function(superClass) {
    extend(Content, superClass);

    function Content() {
      this.onAltF = bind(this.onAltF, this);
      this.onClick = bind(this.onClick, this);
      this.afterRoute = bind(this.afterRoute, this);
      this.beforeRoute = bind(this.beforeRoute, this);
      this.onEntryLoaded = bind(this.onEntryLoaded, this);
      this.onEntryLoading = bind(this.onEntryLoading, this);
      this.onBootError = bind(this.onBootError, this);
      this.onReady = bind(this.onReady, this);
      this.scrollPageDown = bind(this.scrollPageDown, this);
      this.scrollPageUp = bind(this.scrollPageUp, this);
      this.scrollStepDown = bind(this.scrollStepDown, this);
      this.scrollStepUp = bind(this.scrollStepUp, this);
      this.scrollToBottom = bind(this.scrollToBottom, this);
      this.scrollToTop = bind(this.scrollToTop, this);
      return Content.__super__.constructor.apply(this, arguments);
    }

    Content.el = '._content';

    Content.loadingClass = '_content-loading';

    Content.events = {
      click: 'onClick'
    };

    Content.shortcuts = {
      altUp: 'scrollStepUp',
      altDown: 'scrollStepDown',
      pageUp: 'scrollPageUp',
      pageDown: 'scrollPageDown',
      pageTop: 'scrollToTop',
      pageBottom: 'scrollToBottom',
      altF: 'onAltF'
    };

    Content.routes = {
      before: 'beforeRoute',
      after: 'afterRoute'
    };

    Content.prototype.init = function() {
      this.scrollEl = app.isMobile() ? document.body : this.el;
      this.scrollMap = {};
      this.scrollStack = [];
      this.entryPage = new app.views.EntryPage;
      this.entryPage.on('loading', this.onEntryLoading).on('loaded', this.onEntryLoaded);
      app.on('ready', this.onReady).on('bootError', this.onBootError);
    };

    Content.prototype.show = function(view) {
      var ref;
      this.hideLoading();
      if (view !== this.view) {
        if ((ref = this.view) != null) {
          ref.deactivate();
        }
        this.view = view;
        this.view.activate();
      }
    };

    Content.prototype.showLoading = function() {
      this.addClass(this.constructor.loadingClass);
    };

    Content.prototype.isLoading = function() {
      return this.el.classList.contains(this.constructor.loadingClass);
    };

    Content.prototype.hideLoading = function() {
      this.removeClass(this.constructor.loadingClass);
    };

    Content.prototype.scrollTo = function(value) {
      this.scrollEl.scrollTop = value || 0;
    };

    Content.prototype.smoothScrollTo = function(value) {
      $.smoothScroll(this.scrollEl, value || 0);
    };

    Content.prototype.scrollBy = function(n) {
      this.smoothScrollTo(this.scrollEl.scrollTop + n);
    };

    Content.prototype.scrollToTop = function() {
      this.smoothScrollTo(0);
    };

    Content.prototype.scrollToBottom = function() {
      this.smoothScrollTo(this.scrollEl.scrollHeight);
    };

    Content.prototype.scrollStepUp = function() {
      this.scrollBy(-80);
    };

    Content.prototype.scrollStepDown = function() {
      this.scrollBy(80);
    };

    Content.prototype.scrollPageUp = function() {
      this.scrollBy(40 - this.scrollEl.clientHeight);
    };

    Content.prototype.scrollPageDown = function() {
      this.scrollBy(this.scrollEl.clientHeight - 40);
    };

    Content.prototype.scrollToTarget = function() {
      var el;
      if (this.routeCtx.hash && (el = this.findTargetByHash(this.routeCtx.hash))) {
        $.scrollToWithImageLock(el, this.scrollEl, 'top', {
          margin: this.scrollEl === this.el ? 0 : $.offset(this.el).top
        });
        $.highlight(el, {
          className: '_highlight'
        });
      } else {
        this.scrollTo(this.scrollMap[this.routeCtx.state.id]);
      }
    };

    Content.prototype.onReady = function() {
      this.hideLoading();
    };

    Content.prototype.onBootError = function() {
      this.hideLoading();
      this.html(this.tmpl('bootError'));
    };

    Content.prototype.onEntryLoading = function() {
      this.showLoading();
      if (this.scrollToTargetTimeout) {
        clearTimeout(this.scrollToTargetTimeout);
        this.scrollToTargetTimeout = null;
      }
    };

    Content.prototype.onEntryLoaded = function() {
      this.hideLoading();
      if (this.scrollToTargetTimeout) {
        clearTimeout(this.scrollToTargetTimeout);
        this.scrollToTargetTimeout = null;
      }
      this.scrollToTarget();
    };

    Content.prototype.beforeRoute = function(context) {
      this.cacheScrollPosition();
      this.routeCtx = context;
      this.scrollToTargetTimeout = this.delay(this.scrollToTarget);
    };

    Content.prototype.cacheScrollPosition = function() {
      if (!this.routeCtx || this.routeCtx.hash) {
        return;
      }
      if (this.routeCtx.path === '/') {
        return;
      }
      if (this.scrollMap[this.routeCtx.state.id] == null) {
        this.scrollStack.push(this.routeCtx.state.id);
        while (this.scrollStack.length > app.config.history_cache_size) {
          delete this.scrollMap[this.scrollStack.shift()];
        }
      }
      this.scrollMap[this.routeCtx.state.id] = this.scrollEl.scrollTop;
    };

    Content.prototype.afterRoute = function(route, context) {
      var base;
      switch (route) {
        case 'root':
          this.show(this.rootPage);
          break;
        case 'entry':
          this.show(this.entryPage);
          break;
        case 'type':
          this.show(this.typePage);
          break;
        case 'settings':
          this.show(this.settingsPage);
          break;
        case 'offline':
          this.show(this.offlinePage);
          break;
        default:
          this.show(this.staticPage);
      }
      this.view.onRoute(context);
      app.document.setTitle(typeof (base = this.view).getTitle === "function" ? base.getTitle() : void 0);
    };

    Content.prototype.onClick = function(event) {
      var link;
      link = $.closestLink(event.target, this.el);
      if (link && this.isExternalUrl(link.getAttribute('href'))) {
        $.stopEvent(event);
        $.popup(link);
      }
    };

    Content.prototype.onAltF = function(event) {
      var ref;
      if (!(document.activeElement && $.hasChild(this.el, document.activeElement))) {
        if ((ref = this.find('a:not(:empty)')) != null) {
          ref.focus();
        }
        return $.stopEvent(event);
      }
    };

    Content.prototype.findTargetByHash = function(hash) {
      var el;
      el = (function() {
        try {
          return $.id(decodeURIComponent(hash));
        } catch (error) {

        }
      })();
      el || (el = (function() {
        try {
          return $.id(hash);
        } catch (error) {

        }
      })());
      return el;
    };

    Content.prototype.isExternalUrl = function(url) {
      var ref;
      return (ref = url != null ? url.slice(0, 6) : void 0) === 'http:/' || ref === 'https:';
    };

    return Content;

  })(app.View);

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  app.views.EntryPage = (function(superClass) {
    var LINKS;

    extend(EntryPage, superClass);

    EntryPage.className = '_page';

    EntryPage.errorClass = '_page-error';

    function EntryPage(el, entry) {
      if (entry == null) {
        entry = {};
      }
      this.onAltO = bind(this.onAltO, this);
      this.onClick = bind(this.onClick, this);
      this.onError = bind(this.onError, this);
      this.onSuccess = bind(this.onSuccess, this);
      this.beforeRoute = bind(this.beforeRoute, this);
      this.el = $(el || '._page');
      EntryPage.__super__.constructor.apply(this, arguments);
    }

    EntryPage.events = {
      click: 'onClick'
    };

    EntryPage.shortcuts = {
      altO: 'onAltO'
    };

    EntryPage.routes = {
      before: 'beforeRoute'
    };

    EntryPage.prototype.init = function() {
      this.cacheMap = {};
      this.cacheStack = [];
    };

    EntryPage.prototype.deactivate = function() {
      if (EntryPage.__super__.deactivate.apply(this, arguments)) {
        this.empty();
        this.entry = null;
      }
    };

    EntryPage.prototype.loading = function() {
      this.empty();
      this.trigger('loading');
    };

    EntryPage.prototype.render = function(content, fromCache) {
      if (content == null) {
        content = '';
      }
      if (fromCache == null) {
        fromCache = false;
      }
      if (!this.activated) {
        return;
      }
      this.subview = new (this.subViewClass())(this.el, this.entry);
      this.subview.render(this.el, fromCache);
      if (!fromCache) {
        this.addClipboardLinks();
      }
      this.delay(this.polyfillMathML);
      this.trigger('loaded');
    };

    EntryPage.prototype.addClipboardLinks = function() {
      var el, i, len, ref;
      if (!this.clipBoardLink) {
        this.clipBoardLink = document.createElement('a');
        this.clipBoardLink.className = '_pre-clip';
        this.clipBoardLink.title = 'Copy to clipboard';
        this.clipBoardLink.tabIndex = -1;
      }
      ref = this.findAllByTag('pre');
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        el.appendChild(this.clipBoardLink.cloneNode());
      }
    };

    EntryPage.prototype.polyfillMathML = function() {
      if (!(window.supportsMathML === false && !this.polyfilledMathML && this.findByTag('math'))) {
        return;
      }
      this.polyfilledMathML = true;
      $.append(document.head, "<link rel=\"stylesheet\" href=\"" + app.config.mathml_stylesheet + "\">");
    };

    LINKS = {
      home: 'Homepage',
      code: 'Source code'
    };

    EntryPage.prototype.prepareContent = function(content) {
      var link, links, url;
      if (!(this.entry.isIndex() && this.entry.doc.links)) {
        return content;
      }
      links = (function() {
        var ref, results;
        ref = this.entry.doc.links;
        results = [];
        for (link in ref) {
          url = ref[link];
          results.push("<a href=\"" + url + "\" class=\"_links-link\">" + LINKS[link] + "</a>");
        }
        return results;
      }).call(this);
      return "<p class=\"_links\">" + (links.join('')) + "</p>" + content;
    };

    EntryPage.prototype.empty = function() {
      var ref, ref1;
      if ((ref = this.subview) != null) {
        ref.deactivate();
      }
      this.subview = null;
      if ((ref1 = this.hiddenView) != null) {
        ref1.deactivate();
      }
      this.hiddenView = null;
      this.resetClass();
      EntryPage.__super__.empty.apply(this, arguments);
    };

    EntryPage.prototype.subViewClass = function() {
      return app.views[($.classify(this.entry.doc.type)) + "Page"] || app.views.BasePage;
    };

    EntryPage.prototype.getTitle = function() {
      return this.entry.doc.fullName + (this.entry.isIndex() ? ' documentation' : " / " + this.entry.name);
    };

    EntryPage.prototype.beforeRoute = function() {
      this.abort();
      this.cache();
    };

    EntryPage.prototype.onRoute = function(context) {
      this.entry = context.entry;
      this.render();
    };

    EntryPage.prototype.load = function() {
      this.loading();
      this.xhr = this.entry.loadFile(this.onSuccess, this.onError);
    };

    EntryPage.prototype.abort = function() {
      if (this.xhr) {
        this.xhr.abort();
        this.xhr = this.entry = null;
      }
    };

    EntryPage.prototype.onSuccess = function(response) {
      if (!this.activated) {
        return;
      }
      this.xhr = null;
      this.render(this.prepareContent(response));
    };

    EntryPage.prototype.onError = function() {
      var ref;
      this.xhr = null;
      this.render(this.tmpl('pageLoadError'));
      this.resetClass();
      this.addClass(this.constructor.errorClass);
      if ((ref = app.appCache) != null) {
        ref.update();
      }
    };

    EntryPage.prototype.cache = function() {
      var path;
      if (this.xhr || !this.entry || this.cacheMap[path = this.entry.filePath()]) {
        return;
      }
      this.cacheMap[path] = this.el.innerHTML;
      this.cacheStack.push(path);
      while (this.cacheStack.length > app.config.history_cache_size) {
        delete this.cacheMap[this.cacheStack.shift()];
      }
    };

    EntryPage.prototype.restore = function() {
      var path;
      if (this.cacheMap[path = this.entry.filePath()]) {
        this.render(this.cacheMap[path], true);
        return true;
      }
    };

    EntryPage.prototype.onClick = function(event) {
      var target;
      target = event.target;
      if (target.hasAttribute('data-retry')) {
        $.stopEvent(event);
        this.load();
      } else if (target.classList.contains('_pre-clip')) {
        $.stopEvent(event);
        target.classList.add($.copyToClipboard(target.parentNode.textContent) ? '_pre-clip-success' : '_pre-clip-error');
        setTimeout((function() {
          return target.className = '_pre-clip';
        }), 2000);
      }
    };

    EntryPage.prototype.onAltO = function() {
      var link;
      if (!(link = this.find('._attribution:last-child ._attribution-link'))) {
        return;
      }
      $.popup(link.href + location.hash);
    };

    return EntryPage;

  })(app.View);

}).call(this);
(function() {
  var slice = [].slice;

  app.templates.render = function() {
    var args, i, len, name, result, template, val, value;
    name = arguments[0], value = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    template = app.templates[name];
    if (Array.isArray(value)) {
      result = '';
      for (i = 0, len = value.length; i < len; i++) {
        val = value[i];
        result += template.apply(null, [val].concat(slice.call(args)));
      }
      return result;
    } else if (typeof template === 'function') {
      return template.apply(null, [value].concat(slice.call(args)));
    } else {
      return template;
    }
  };

}).call(this);
(function() {
  var arrow, sidebarFooter, templates;

  templates = app.templates;

  arrow = "<svg class=\"_list-arrow\"><use xlink:href=\"#icon-dir\"/></svg>";

  templates.sidebarDoc = function(doc, options) {
    var link;
    if (options == null) {
      options = {};
    }
    link = "<a href=\"" + (doc.fullPath()) + "\" class=\"_list-item _icon-" + doc.icon + " ";
    link += options.disabled ? '_list-disabled' : '_list-dir';
    link += "\" data-slug=\"" + doc.slug + "\" title=\"" + doc.fullName + "\" tabindex=\"-1\">";
    if (options.disabled) {
      link += "<span class=\"_list-enable\" data-enable=\"" + doc.slug + "\">Enable</span>";
    } else {
      link += arrow;
    }
    if (doc.release) {
      link += "<span class=\"_list-count\">" + doc.release + "</span>";
    }
    link += "<span class=\"_list-text\">" + doc.name;
    if (options.fullName || options.disabled && doc.version) {
      link += " " + doc.version;
    }
    return link + "</span></a>";
  };

  templates.sidebarType = function(type) {
    return "<a href=\"" + (type.fullPath()) + "\" class=\"_list-item _list-dir\" data-slug=\"" + type.slug + "\" tabindex=\"-1\">" + arrow + "<span class=\"_list-count\">" + type.count + "</span><span class=\"_list-text\">" + ($.escape(type.name)) + "</span></a>";
  };

  templates.sidebarEntry = function(entry) {
    return "<a href=\"" + (entry.fullPath()) + "\" class=\"_list-item _list-hover\" tabindex=\"-1\">" + ($.escape(entry.name)) + "</a>";
  };

  templates.sidebarResult = function(entry) {
    var addons;
    addons = entry.isIndex() && app.disabledDocs.contains(entry.doc) ? "<span class=\"_list-enable\" data-enable=\"" + entry.doc.slug + "\">Enable</span>" : "<span class=\"_list-reveal\" data-reset-list title=\"Reveal in list\"></span>";
    if (entry.doc.version && !entry.isIndex()) {
      addons += "<span class=\"_list-count\">" + entry.doc.short_version + "</span>";
    }
    return "<a href=\"" + (entry.fullPath()) + "\" class=\"_list-item _list-hover _list-result _icon-" + entry.doc.icon + "\" tabindex=\"-1\">" + addons + "<span class=\"_list-text\">" + ($.escape(entry.name)) + "</span></a>";
  };

  templates.sidebarNoResults = function() {
    var html;
    html = " <div class=\"_list-note\">No results.</div> ";
    if (!(app.isSingleDoc() || app.disabledDocs.isEmpty())) {
      html += "<div class=\"_list-note\">Note: documentations must be <a href=\"/settings\" class=\"_list-note-link\">enabled</a> to appear in the search.</div>";
    }
    return html;
  };

  templates.sidebarPageLink = function(count) {
    return "<span role=\"link\" class=\"_list-item _list-pagelink\">Show more\u2026 (" + count + ")</span>";
  };

  templates.sidebarLabel = function(doc, options) {
    var label;
    if (options == null) {
      options = {};
    }
    label = "<label class=\"_list-item";
    if (!doc.version) {
      label += " _icon-" + doc.icon;
    }
    label += "\"><input type=\"checkbox\" name=\"" + doc.slug + "\" class=\"_list-checkbox\" ";
    if (options.checked) {
      label += "checked";
    }
    return label + ("><span class=\"_list-text\">" + doc.fullName + "</span></label>");
  };

  templates.sidebarVersionedDoc = function(doc, versions, options) {
    var html;
    if (options == null) {
      options = {};
    }
    html = "<div class=\"_list-item _list-dir _list-rdir _icon-" + doc.icon;
    if (options.open) {
      html += " open";
    }
    return html + ("\" tabindex=\"0\">" + arrow + doc.name + "</div><div class=\"_list _list-sub\">" + versions + "</div>");
  };

  templates.sidebarDisabled = function(options) {
    return "<h6 class=\"_list-title\">" + arrow + "Disabled (" + options.count + ") <a href=\"/settings\" class=\"_list-title-link\" tabindex=\"-1\">Customize</a></h6>";
  };

  templates.sidebarDisabledList = function(html) {
    return "<div class=\"_disabled-list\">" + html + "</div>";
  };

  templates.sidebarDisabledVersionedDoc = function(doc, versions) {
    return "<a class=\"_list-item _list-dir _icon-" + doc.icon + " _list-disabled\" data-slug=\"" + doc.slug_without_version + "\" tabindex=\"-1\">" + arrow + doc.name + "</a><div class=\"_list _list-sub\">" + versions + "</div>";
  };

  templates.docPickerHeader = "<div class=\"_list-picker-head\"><span>Documentation</span> <span>Enable</span></div>";

  templates.docPickerNote = "<div class=\"_list-note\">Tip: for faster and better search results, select only the docs you need.</div>\n<a href=\"https://trello.com/b/6BmTulfx/devdocs-documentation\" class=\"_list-link\" target=\"_blank\" rel=\"noopener\">Vote for new documentation</a>";

  sidebarFooter = function(html) {
    return "<div class=\"_sidebar-footer\">" + html + "</div>";
  };

  templates.sidebarSettings = function() {
    return sidebarFooter("<button type=\"button\" class=\"_sidebar-footer-link _sidebar-footer-edit\" data-pick-docs>Select documentation</button>\n<button type=\"button\" class=\"_sidebar-footer-link _sidebar-footer-light\" title=\"Toggle light\" data-light>Toggle light</button>\n<button type=\"button\" class=\"_sidebar-footer-link _sidebar-footer-layout\" title=\"Toggle layout\" data-layout>Toggle layout</button>");
  };

  templates.sidebarSave = function() {
    return sidebarFooter("<a class=\"_sidebar-footer-link _sidebar-footer-save\" role=\"button\">Save</a>");
  };

}).call(this);
(function() {
  var init;

  init = function() {
    document.removeEventListener('DOMContentLoaded', init, false);
    if (document.body) {
      return app.init();
    } else {
      return setTimeout(init, 42);
    }
  };

  document.addEventListener('DOMContentLoaded', init, false);

}).call(this);
