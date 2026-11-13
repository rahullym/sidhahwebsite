// Run: node --experimental-strip-types scripts/markup.test.ts
import assert from 'node:assert/strict';
import { renderBody } from '../src/lib/markup.ts';

assert.equal(renderBody('## Why classroom\n\nHello **world**'), '<h2>Why classroom</h2>\n<p>Hello <strong>world</strong></p>');
assert.equal(renderBody('- one\n- two'), '<ul><li>one</li><li>two</li></ul>');
assert.equal(renderBody('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
assert.equal(renderBody('[x](javascript:alert(1))'), '<p>[x](javascript:alert(1))</p>');
assert.equal(renderBody('[site](https://sidhah.com)'), '<p><a href="https://sidhah.com">site</a></p>');
assert.equal(renderBody('[q](https://a.com/"onmouseover=x)'), '<p><a href="https://a.com/&quot;onmouseover=x">q</a></p>');
assert.equal(renderBody('line one\nline two'), '<p>line one<br>line two</p>');
console.log('markup ok');
