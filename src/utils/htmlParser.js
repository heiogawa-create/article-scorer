export function extractText(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;
  if (!body) return '';

  function getTextNodes(node) {
    let text = '';
    for (const child of node.childNodes) {
      const tag = child.nodeName.toLowerCase();
      if (['img', 'table', 'style', 'script', 'thead', 'tbody', 'tr', 'td', 'th'].includes(tag)) {
        continue;
      }
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        text += getTextNodes(child);
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br'].includes(tag)) {
          text += '\n';
        }
      }
    }
    return text;
  }

  return getTextNodes(body).replace(/\n{3,}/g, '\n\n').trim();
}

export function injectText(originalHtml, newText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHtml, 'text/html');
  const body = doc.body;
  if (!body) return originalHtml;

  const preserved = [];
  const KEEP_TAGS = ['img', 'table', 'style', 'script', 'figure'];

  function collectPreserved(node) {
    for (const child of [...node.childNodes]) {
      const tag = child.nodeName.toLowerCase();
      if (KEEP_TAGS.includes(tag)) {
        const placeholder = doc.createComment(`PLACEHOLDER_${preserved.length}`);
        child.parentNode.replaceChild(placeholder, child);
        preserved.push(child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        collectPreserved(child);
      }
    }
  }

  collectPreserved(body);

  const lines = newText.split('\n');
  body.innerHTML = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
      return `<p>${trimmed}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  for (const el of preserved) {
    body.appendChild(el);
  }

  return doc.documentElement.outerHTML;
}
