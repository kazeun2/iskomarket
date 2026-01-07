const fs = require('fs');
const s = fs.readFileSync('src/components/CvSUMarket.tsx','utf8');
let paren=[], brace=[], bracket=[];
let i=0; const len=s.length;
while(i<len){ const ch=s[i];
  if(ch==="'"||ch==='"'){ const q=ch; i++; while(i<len){ if(s[i]==='\\') i+=2; else if(s[i]===q){ i++; break;} else i++; } continue; }
  if(ch==='`'){ i++; while(i<len){ if(s[i]==='\\') i+=2; else if(s[i]==='`'){ i++; break;} else if(s[i]==='$' && s[i+1]==='{'){ i+=2; let depth=1; while(i<len && depth){ if(s[i]==='{') depth++; else if(s[i]==='}') depth--; else if(s[i]==='"' || s[i]==="'" || s[i]==='`'){ const q=s[i]; i++; while(i<len){ if(s[i]==='\\') i+=2; else if(s[i]===q){ i++; break;} else i++; } continue; } i++; } } else i++; } continue; }
  if(ch==='/' && s[i+1]==='/'){ i+=2; while(i<len && s[i]!=='\n') i++; continue; }
  if(ch==='/' && s[i+1]=='*'){ i+=2; while(i<len && !(s[i]==='*' && s[i+1]==='/')) i++; i+=2; continue; }
  if(ch==='(') paren.push(i);
  else if(ch===')') paren.pop();
  else if(ch==='{') brace.push(i);
  else if(ch==='}') brace.pop();
  else if(ch==='[') bracket.push(i);
  else if(ch===']') bracket.pop();
  i++;
}
const posToLine=(idx)=>{ const prefix=s.substring(0,idx); const lines=prefix.split('\n'); return {line:lines.length,col:lines[lines.length-1].length+1,ctx:s.substring(Math.max(0,idx-80),Math.min(len,idx+80)).replace(/\n/g,'↵')}; };
if(paren.length) console.log('Unmatched ( at', posToLine(paren[paren.length-1]));
if(brace.length) console.log('Unmatched { at', posToLine(brace[brace.length-1]));
if(bracket.length) console.log('Unmatched [ at', posToLine(bracket[bracket.length-1]));
console.log('Remaining counts -> paren',paren.length,'brace',brace.length,'bracket',bracket.length);
