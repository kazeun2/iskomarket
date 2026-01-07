const fs = require('fs');
const path = 'src/components/SellerProfile.tsx';
let s = fs.readFileSync(path, 'utf8');
const start = s.indexOf('const content = (');
if (start === -1) { console.error('start not found'); process.exit(1); }
let i = start + ('const content = ('.length);
let paren = 1;
while (i < s.length) {
  const ch = s[i];
  if (ch === '(') paren++;
  if (ch === ')') paren--;
  i++;
  if (paren === 0) break;
}
if (paren !== 0) { console.error('matching ) not found'); process.exit(1); }
const newContent = "  // Render the inner modal content (shared between both embedded and full-screen usages)\n  const content = (<div />);\n";
s = s.slice(0, start) + newContent + s.slice(i);
fs.writeFileSync(path, s, 'utf8');
console.log('Replaced content block');
