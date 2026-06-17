import fs from 'fs';

const code = fs.readFileSync('c:/Users/uttam rajpurrohit/OneDrive/Desktop/school/frontend/src/pages/AcademicPanel.jsx', 'utf8');
const lines = code.split('\n');

// We want to find hooks called inside helper functions or conditionally.
// A common mistake is rendering hooks inside helper render functions, like:
// const renderSomething = () => { const [state, setState] = useState() ... }
// or calling them inside if statements.

let currentFunction = null;
let braceCount = 0;
let functionsStack = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const trimmed = line.trim();
  
  // Try to track functions
  const funcMatch = trimmed.match(/(?:const|let|function)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^\s=]+)\s*=>/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    functionsStack.push({ name: funcName, line: lineNum });
  }
  
  // Look for hook calls
  const hookMatch = trimmed.match(/\b(use[A-Z]\w+)\b/);
  if (hookMatch) {
    const hookName = hookMatch[1];
    
    // Check if we are inside a helper function or nested structure
    // (If the hook is defined inside a function that starts with 'render' or similar)
    const activeFunc = functionsStack.length > 0 ? functionsStack[functionsStack.length - 1] : null;
    if (activeFunc && activeFunc.name !== 'AcademicPanel') {
      console.log(`Hook '${hookName}' found inside nested/helper function '${activeFunc.name}' at line ${lineNum}:`);
      console.log(`  ${trimmed}`);
    } else if (trimmed.startsWith('if') || trimmed.includes('?')) {
      console.log(`Potential conditional hook call of '${hookName}' at line ${lineNum}:`);
      console.log(`  ${trimmed}`);
    }
  }

  // Very simple brace balance to pop functions (just heuristic for now)
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  braceCount += openBraces - closeBraces;
  
  // Since our function stack tracking is simple, if brace count is zero, we clear stack,
  // but let's just use a simpler marker: if a line ends with a return or we close a render function
  if (trimmed === '};' || trimmed === '}') {
    if (functionsStack.length > 0) {
      functionsStack.pop();
    }
  }
});
