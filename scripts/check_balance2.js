const fs = require('fs');
const s = fs.readFileSync('src/components/SellerProfile.tsx','utf8');
let p=0,b=0,angle=0;let inString=null;let prev=null;
for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(inString){
    if(ch===inString && s[i-1]!=='\\') inString=null;
    continue;
  }
  if(ch==="'" || ch==='"' || ch==='`') { inString = ch; continue; }
  if(ch==='(') p++; else if(ch===')') p--;
  if(ch==='{') b++; else if(ch==='}') b--;
  if(ch==='<' && s.slice(i,i+4) !== '<!--') angle++; else if(ch==='>' && angle>0) angle--;
  if(p<0 || b<0) {
    console.log('Negative balance at index', i, 'char', ch, 'line', s.slice(0,i).split('\n').length);
    break;
  }
}
console.log('final balances: paren=',p,' brace=',b,' angle=',angle);
