const SKIP_TEXT_SELECTOR = 'img, table, style, script';

function parseHtml(htmlString) {
  return new DOMParser().parseFromString(htmlString, 'text/html');
}

function isInsideSkippedElement(node) {
  return Boolean(node.parentElement?.closest(SKIP_TEXT_SELECTOR));
}

function createTextFragment(documentRef, newText) {
  const fragment = documentRef.createDocumentFragment();
  const blocks = newText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return fragment;
  }

  blocks.forEach((block) => {
    const paragraph = documentRef.createElement('p');
    const lines = block.split('\n');

    lines.forEach((line, index) => {
      if (index > 0) {
        paragraph.appendChild(documentRef.createElement('br'));
      }
      paragraph.appendChild(documentRef.createTextNode(line));
    });

    fragment.appendChild(paragraph);
  });

  return fragment;
}

export function extractText(htmlString) {
  if (!htmlString?.trim()) {
    return '';
  }

  const documentRef = parseHtml(htmlString);
  const body = documentRef.body;

  if (!body) {
    return '';
  }

  const walker = documentRef.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInsideSkippedElement(node) || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textParts = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textParts.push(currentNode.textContent.replace(/\s+/g, ' ').trim());
    currentNode = walker.nextNode();
  }

  return textParts.join('\n').trim();
}

export function injectText(originalHtml, newText) {
  if (!originalHtml?.trim()) {
    return newText;
  }

  const documentRef = parseHtml(originalHtml);
  const body = documentRef.body;

  if (!body) {
    return originalHtml;
  }

  const replacementFragment = createTextFragment(documentRef, newText);
  const walker = documentRef.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInsideSkippedElement(node) || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  if (textNodes.length === 0) {
    body.prepend(replacementFragment);
  } else {
    textNodes.forEach((textNode, index) => {
      if (index === 0) {
        textNode.parentNode.replaceChild(replacementFragment, textNode);
      } else {
        textNode.textContent = '';
      }
    });
  }

  return `<!doctype html>\n${documentRef.documentElement.outerHTML}`;
}
