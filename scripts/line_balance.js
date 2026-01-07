const fs = require('fs');
const s = fs.readFileSync('src/components/SellerProfile.tsx','utf8');
const lines = s.split('\n');
let p=0,b=0,inString=null;
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  for(let j=0;j<line.length;j++){
    const ch = line[j];
    if(inString){
      if(ch === inString && line[j-1] !== '\\') inString = null;
      continue;
    }
    if(ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
    if(ch === '(') p++; else if(ch === ')') p--;
    if(ch === '{') b++; else if(ch === '}') b--;
  }
  if(p !== 0 || b !== 0) console.log((i+1).toString().padStart(4)+": p="+p+" b="+b+" | "+line.trim());
}
console.log('final:', 'p=',p,'b=',b);
