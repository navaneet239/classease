import { KeyTerm } from '../types';
import { parse } from 'marked';

export const renderMarkdownWithTooltips = (markdown: string, keyTerms: KeyTerm[]): string => {
  // 1. Convert Markdown to base HTML first
  const rawHtml = parse(markdown) as string;

  if (!keyTerms || keyTerms.length === 0) return rawHtml;
  if (typeof window === 'undefined') return rawHtml; // Server-side safety

  // 2. Parse HTML string into a DOM Document to safely manipulate text nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Sort terms by length (descending) to match longest phrases first
  const sortedTerms = [...keyTerms].sort((a, b) => b.term.length - a.term.length);

  // 3. Walk through all Text Nodes
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  const textNodes: Node[] = [];
  
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  // 4. Process text nodes and inject tooltips
  textNodes.forEach(node => {
    const text = node.nodeValue;
    if (!text) return;

    // Check if this text node contains any key terms
    // We create a regex for all terms
    const pattern = new RegExp(`\\b(${sortedTerms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    if (!pattern.test(text)) return;

    // If matches found, we need to replace this text node with a fragment of text + spans
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    
    // Reset regex
    pattern.lastIndex = 0;
    let match;
    
    // We cannot use replace() string method because we need to insert DOM elements
    // We loop through matches manually
    while ((match = pattern.exec(text)) !== null) {
      const matchedTerm = match[0];
      const startIndex = match.index;
      
      // Append text before match
      if (startIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, startIndex)));
      }

      // Find definition
      const termObj = sortedTerms.find(t => t.term.toLowerCase() === matchedTerm.toLowerCase());
      
      if (termObj) {
        // Create Tooltip DOM Structure
        // Wrapper
        const wrapper = document.createElement('span');
        wrapper.className = "group/tooltip relative inline-block cursor-help border-b-[1.5px] border-dotted border-stone-400 dark:border-stone-500 hover:border-accent dark:hover:border-accent transition-colors z-10";
        wrapper.textContent = matchedTerm;

        // Tooltip Popup
        const popup = document.createElement('span');
        popup.className = `
          invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 
          transition-all duration-200 ease-out transform translate-y-2 group-hover/tooltip:translate-y-0
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 md:w-72 
          bg-stone-900/95 dark:bg-stone-100/95 backdrop-blur-md
          text-stone-100 dark:text-stone-900 
          p-4 rounded-xl shadow-xl
          z-[9999] pointer-events-none text-left
          border border-white/10 dark:border-stone-200/50
        `;
        
        // Inner Content
        const title = document.createElement('span');
        title.className = "block font-serif text-lg font-bold text-accent mb-1.5 border-b border-white/10 dark:border-black/5 pb-1";
        title.textContent = termObj.term;
        
        const desc = document.createElement('span');
        desc.className = "block text-sm leading-relaxed opacity-90 font-sans font-normal normal-case tracking-normal";
        desc.textContent = termObj.definition;

        // Arrow
        const arrow = document.createElement('span');
        arrow.className = "absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-stone-900/95 dark:border-t-stone-100/95";

        popup.appendChild(title);
        popup.appendChild(desc);
        popup.appendChild(arrow);
        wrapper.appendChild(popup);
        
        fragment.appendChild(wrapper);
      } else {
        // Fallback (shouldn't happen due to logic)
        fragment.appendChild(document.createTextNode(matchedTerm));
      }

      lastIndex = startIndex + matchedTerm.length;
    }

    // Append remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Replace the original text node with our new fragment
    node.parentNode?.replaceChild(fragment, node);
  });

  // 5. Return the serialized HTML
  return doc.body.innerHTML;
};
