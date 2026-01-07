const fs = require('fs');
const path = 'src/components/SellerProfile.tsx';
const s = fs.readFileSync(path, 'utf8');
let state = null;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const prev = s[i - 1];
  if (state === null) {
    if (ch === "'") state = "'";
    else if (ch === '"') state = '"';
    else if (ch === '`') state = '`';
  } else if (state === "'") {
    if (ch === "'" && prev !== "\\") state = null;
  } else if (state === '"') {
    if (ch === '"' && prev !== "\\") state = null;
  } else if (state === '`') {
    if (ch === '`' && prev !== "\\") state = null;
  }
}
console.log('final string state:', state);
