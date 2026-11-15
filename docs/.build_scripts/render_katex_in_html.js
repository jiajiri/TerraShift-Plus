const fs = require('fs');
const katex = require('./docs/research-paper/katex/katex.min.js');

let html = fs.readFileSync('docs/research-paper/research-paper.html', 'utf8');

// Replace \( ... \) inline math
html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
  try {
    return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
  } catch (e) {
    console.error('Error rendering inline math:', math, e);
    return match;
  }
});

// Replace equation-math blocks
html = html.replace(/<div class="equation-math">\s*([\s\S]*?)\s*<\/div>/g, (match, math) => {
  // If math is already HTML (e.g. contains <span), leave it or re-render if raw
  if (math.includes('<span class="katex">')) return match;
  try {
    const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    return `<div class="equation-math">${rendered}</div>`;
  } catch (e) {
    console.error('Error rendering display math:', math, e);
    return match;
  }
});

// Inject katex-embedded.min.css into <head>
const embeddedCss = fs.readFileSync('docs/research-paper/katex/katex-embedded.min.css', 'utf8');
html = html.replace('</head>', `<style>\n${embeddedCss}\n</style>\n</head>`);

fs.writeFileSync('docs/research-paper/research-paper.html', html, 'utf8');
console.log('Successfully pre-rendered all KaTeX math in research-paper.html! New size:', html.length);
