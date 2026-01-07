const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path, 'utf8');
const counts = {
  '(': (s.split('(').length - 1),
  ')': (s.split(')').length - 1),
  '{': (s.split('{').length - 1),
  '}': (s.split('}').length - 1),
  '[': (s.split('[').length - 1),
  ']': (s.split(']').length - 1),
};
console.log(counts);