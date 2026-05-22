// ==UserScript==
// @name         Webpage Data Highlighter
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Highlight selected text on webpages, persist, copy, and clear highlights
// @author       You
// @match        *://*.ft.com/*
// @match        *://*.wsj.com/*
// @match        *://*.nytimes.com/*
// @match        *://*.bloomberg.com/*
// @match        *://*.economist.com/*
// // Uncomment the line below to run the script on all webpages:
// // @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Inject custom CSS styling for high-quality aesthetics
    function injectStyles() {
        if (document.getElementById('highlighter-styles')) return;
        const style = document.createElement('style');
        style.id = 'highlighter-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');

            /* Highlight visual style matching existing scripts */
            .highlighter--highlighted {
                background-color: #ffeb3b !important;
                color: #000000 !important;
                border-radius: 2px;
                padding: 0 2px;
                display: inline;
            }

            /* Glassmorphic Panel Container */
            #highlighter-panel-root {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 2147483647;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(15, 23, 42, 0.75);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 30px;
                padding: 8px 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
            }

            #highlighter-panel-root:hover {
                background: rgba(15, 23, 42, 0.85);
                border-color: rgba(255, 255, 255, 0.18);
                transform: translateY(-2px);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
            }

            /* Action Buttons */
            .highlighter-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.05);
                outline: none;
                color: rgba(255, 255, 255, 0.85);
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 500;
                border-radius: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Highlight Action Button */
            #highlighter-btn-highlight {
                background: linear-gradient(135deg, #ffd60a 0%, #ffc300 100%);
                border: none;
                color: #000000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(255, 195, 0, 0.3);
            }

            #highlighter-btn-highlight:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(255, 195, 0, 0.4);
                color: #000000;
            }

            #highlighter-btn-highlight:active {
                transform: scale(0.98);
            }

            /* Copy Action Button */
            #highlighter-btn-copy:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #ffffff;
                transform: translateY(-1px);
            }

            #highlighter-btn-copy.copied {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border: none;
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            /* Clear Action Button */
            #highlighter-btn-clear:hover {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                transform: translateY(-1px);
            }

            /* Badge count */
            .highlighter-badge {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                font-weight: 500;
                padding: 4px 10px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }

            /* Inputs */
            .highlighter-input {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                color: rgba(255, 255, 255, 0.95);
                padding: 6px 12px;
                font-size: 13px;
                outline: none;
                width: 100px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: text !important;
            }
            .highlighter-input::placeholder {
                color: rgba(255, 255, 255, 0.35);
            }
            .highlighter-input:focus {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.25);
                box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
            }
        `;
        document.head.appendChild(style);
    }

    // Storage utility functions using GM_getValue / GM_setValue
    const DB_KEY = 'webpage_highlights_db';
    const META_DB_KEY = 'webpage_highlights_metadata_db';

    function getSavedPageMeta() {
        try {
            const db = JSON.parse(GM_getValue(META_DB_KEY, '{}'));
            return db[window.location.href] || null;
        } catch (e) {
            console.error('Failed to get page metadata:', e);
            return null;
        }
    }

    function savePageMeta(category) {
        try {
            const db = JSON.parse(GM_getValue(META_DB_KEY, '{}'));
            db[window.location.href] = { category };
            GM_setValue(META_DB_KEY, JSON.stringify(db));
        } catch (e) {
            console.error('Failed to save page metadata:', e);
        }
    }

    function getDomainCategory() {
        const host = window.location.hostname.toLowerCase();
        if (host.includes('economist.com')) return 'Economist';
        if (host.includes('nytimes.com')) return 'NYTimes';
        if (host.includes('wsj.com')) return 'WSJ';
        if (host.includes('ft.com')) return 'FT';
        if (host.includes('bloomberg.com')) return 'Bloomberg';
        
        // General fallback: extract the main domain part and capitalize it
        const parts = window.location.hostname.split('.');
        if (parts.length >= 2) {
            let mainPart = parts[parts.length - 2];
            if (parts.length > 2 && ['co', 'com', 'org', 'net', 'gov', 'edu'].includes(mainPart)) {
                mainPart = parts[parts.length - 3];
            }
            return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
        }
        return 'Webpage';
    }

    async function getDeterministicUUID(str) {
        if (!crypto || !crypto.subtle) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = (hash << 5) - hash + str.charCodeAt(i);
                hash |= 0;
            }
            const hex = Math.abs(hash).toString(16).padEnd(32, 'f');
            return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(12,15)}-8${hex.slice(15,18)}-${hex.slice(18,30)}`;
        }

        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        
        // Format as UUID v5 (RFC 4122)
        hashArray[6] = (hashArray[6] & 0x0f) | 0x50; // version 5
        hashArray[8] = (hashArray[8] & 0x3f) | 0x80; // variant RFC 4122
        
        const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }

    function getAutoMetadata() {
        const category = getDomainCategory();
        return { category };
    }

    function getTodayDateString() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    }

    function getSavedHighlights() {
        try {
            const db = JSON.parse(GM_getValue(DB_KEY, '{}'));
            return db[window.location.href] || [];
        } catch (e) {
            console.error('Failed to get highlights:', e);
            return [];
        }
    }

    function saveHighlightText(text) {
        try {
            const db = JSON.parse(GM_getValue(DB_KEY, '{}'));
            const list = db[window.location.href] || [];
            const cleanText = text.trim();
            // Store if text is of meaningful length and not already saved
            if (cleanText.length >= 3 && !list.includes(cleanText)) {
                list.push(cleanText);
                db[window.location.href] = list;
                GM_setValue(DB_KEY, JSON.stringify(db));
            }
        } catch (e) {
            console.error('Failed to save highlight:', e);
        }
    }

    function clearSavedHighlights() {
        try {
            const db = JSON.parse(GM_getValue(DB_KEY, '{}'));
            delete db[window.location.href];
            GM_setValue(DB_KEY, JSON.stringify(db));
        } catch (e) {
            console.error('Failed to clear highlights database:', e);
        }
    }

    // Helper to extract text nodes within a given selection range
    function getTextNodesInRange(range) {
        const start = range.startContainer;
        const end = range.endContainer;
        const commonAncestor = range.commonAncestorContainer;

        const textNodes = [];
        function traverse(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeRange = document.createRange();
                nodeRange.selectNodeContents(node);

                // Check if ranges overlap
                if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0) {
                    textNodes.push(node);
                }
            } else {
                let child = node.firstChild;
                while (child) {
                    traverse(child);
                    child = child.nextSibling;
                }
            }
        }

        traverse(commonAncestor);
        return textNodes;
    }

    // Highlight text nodes in the selection range
    function highlightRange(range) {
        const textNodes = getTextNodesInRange(range);

        textNodes.forEach(node => {
            let startIdx = 0;
            let endIdx = node.length;

            if (node === range.startContainer) {
                startIdx = range.startOffset;
            }
            if (node === range.endContainer) {
                endIdx = range.endOffset;
            }

            const partText = node.nodeValue.substring(startIdx, endIdx);
            if (partText.trim().length === 0) return;

            const mark = document.createElement('mark');
            mark.className = 'highlighter--highlighted';

            const parent = node.parentNode;
            if (!parent) return;

            // Check splitting conditions
            if (node === range.startContainer && node === range.endContainer) {
                const before = document.createTextNode(node.nodeValue.substring(0, startIdx));
                const after = document.createTextNode(node.nodeValue.substring(endIdx));
                const mid = document.createTextNode(partText);
                mark.appendChild(mid);

                parent.insertBefore(before, node);
                parent.insertBefore(mark, node);
                parent.insertBefore(after, node);
                parent.removeChild(node);
            } else if (node === range.startContainer) {
                const before = document.createTextNode(node.nodeValue.substring(0, startIdx));
                const mid = document.createTextNode(partText);
                mark.appendChild(mid);

                parent.insertBefore(before, node);
                parent.insertBefore(mark, node);
                parent.removeChild(node);
            } else if (node === range.endContainer) {
                const after = document.createTextNode(node.nodeValue.substring(endIdx));
                const mid = document.createTextNode(partText);
                mark.appendChild(mid);

                parent.insertBefore(mark, node);
                parent.insertBefore(after, node);
                parent.removeChild(node);
            } else {
                const mid = document.createTextNode(node.nodeValue);
                mark.appendChild(mid);

                parent.insertBefore(mark, node);
                parent.removeChild(node);
            }
        });
    }

    // Handle high-level user text selection
    function highlightSelection() {
        const selection = window.getSelection();
        const highlightBtn = document.getElementById('highlighter-btn-highlight');

        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
            if (highlightBtn) {
                const originalText = highlightBtn.innerHTML;
                highlightBtn.innerHTML = '⚠️ Select Text First!';
                highlightBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                highlightBtn.style.color = '#ffffff';
                highlightBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                setTimeout(() => {
                    highlightBtn.innerHTML = originalText;
                    highlightBtn.style.background = '';
                    highlightBtn.style.color = '';
                    highlightBtn.style.boxShadow = '';
                }, 1500);
            }
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        highlightRange(range);
        saveHighlightText(selectedText);
        selection.removeAllRanges();
        updateHighlightCount();
    }

    // Recover highlights visually when page reloads or SPA updates
    function restoreHighlights() {
        const saved = getSavedHighlights();
        if (saved.length === 0) return;

        // Sort highlights by length descending, so longer phrases are processed first
        const sortedSaved = [...saved].sort((a, b) => b.length - a.length);

        function walkAndHighlight(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.nodeValue;
                for (const highlightText of sortedSaved) {
                    if (!highlightText || highlightText.trim().length === 0) continue;

                    const index = textContent.toLowerCase().indexOf(highlightText.toLowerCase());
                    if (index !== -1) {
                        const parent = node.parentNode;
                        const forbiddenTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME', 'BUTTON'];

                        if (parent &&
                            !forbiddenTags.includes(parent.tagName) &&
                            !parent.classList.contains('highlighter--highlighted') &&
                            parent.id !== 'highlighter-panel-root' &&
                            !parent.closest('#highlighter-panel-root')) {

                            const beforeText = textContent.substring(0, index);
                            const matchText = textContent.substring(index, index + highlightText.length);
                            const afterText = textContent.substring(index + highlightText.length);

                            const beforeNode = document.createTextNode(beforeText);
                            const afterNode = document.createTextNode(afterText);

                            const mark = document.createElement('mark');
                            mark.className = 'highlighter--highlighted';
                            mark.appendChild(document.createTextNode(matchText));

                            parent.insertBefore(beforeNode, node);
                            parent.insertBefore(mark, node);
                            parent.insertBefore(afterNode, node);
                            parent.removeChild(node);

                            // Process remainder recursively
                            walkAndHighlight(afterNode);
                            return;
                        }
                    }
                }
            } else {
                const forbiddenTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME', 'BUTTON'];
                if (!forbiddenTags.includes(node.tagName) &&
                    !node.classList.contains('highlighter--highlighted') &&
                    node.id !== 'highlighter-panel-root') {

                    let child = node.firstChild;
                    while (child) {
                        const next = child.nextSibling;
                        walkAndHighlight(child);
                        child = next;
                    }
                }
            }
        }

        walkAndHighlight(document.body);
        updateHighlightCount();
    }

    // Remove visual highlights
    function clearVisualHighlights() {
        const highlighted = Array.from(document.querySelectorAll('.highlighter--highlighted'));
        highlighted.forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                while (mark.firstChild) {
                    parent.insertBefore(mark.firstChild, mark);
                }
                parent.removeChild(mark);
            }
        });
        document.body.normalize(); // Merge adjacent text nodes clean
    }

    // Handle full clear request
    function clearPageHighlights() {
        if (confirm('Clear all highlights on this page?')) {
            clearVisualHighlights();
            clearSavedHighlights();
            updateHighlightCount();
        }
    }

    // Copy formatted highlights to clipboard
    async function copyHighlightsToClipboard() {
        const copyBtn = document.getElementById('highlighter-btn-copy');
        const highlighted = Array.from(document.querySelectorAll('.highlighter--highlighted'));

        if (highlighted.length === 0) {
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '⚠️ No highlights';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 1500);
            }
            return;
        }

        // Collate highlights separated by a space
        let stringData = "";
        highlighted.forEach((el, i) => {
            if (i > 0) {
                stringData += " ";
            }
            stringData += el.textContent.trim();
        });

        const categoryInput = document.getElementById('highlighter-input-category');
        const category = categoryInput ? categoryInput.value : getDomainCategory();

        const noteId = await getDeterministicUUID(window.location.href);
        const clipboardText = `    {
        "id": "${noteId}",
        "text": ${JSON.stringify(stringData)},
        "metadata": {
            "source_url": "${window.location.href}",
            "title": ${JSON.stringify(document.title)},
            "clipped_at": "${getTodayDateString()}",
            "category": ${JSON.stringify(category)}
        }
    }`;

        GM_setClipboard(clipboardText);

        if (copyBtn) {
            copyBtn.classList.add('copied');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '📋 Copied!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalText;
            }, 2000);
        }
    }

    // Update highlights counter
    function updateHighlightCount() {
        const highlighted = document.querySelectorAll('.highlighter--highlighted');
        const count = highlighted.length;
        const badge = document.getElementById('highlighter-badge-count');
        if (badge) {
            badge.textContent = `${count} Highlight${count !== 1 ? 's' : ''}`;
        }
    }

    // Create and attach the glassmorphic controls
    function createHighlighterUI() {
        if (document.getElementById('highlighter-panel-root')) return;

        const autoMeta = getAutoMetadata();
        const savedMeta = getSavedPageMeta();
        const defaultCategory = savedMeta ? savedMeta.category : autoMeta.category;

        const root = document.createElement('div');
        root.id = 'highlighter-panel-root';

        const badge = document.createElement('span');
        badge.id = 'highlighter-badge-count';
        badge.className = 'highlighter-badge';
        badge.textContent = '0 Highlights';

        const categoryInput = document.createElement('input');
        categoryInput.id = 'highlighter-input-category';
        categoryInput.className = 'highlighter-input';
        categoryInput.type = 'text';
        categoryInput.placeholder = 'Category';
        categoryInput.value = defaultCategory;
        categoryInput.title = 'Category';
        categoryInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "`") {
                return; // Let Ctrl+` bubble up to highlight
            }
            e.stopPropagation();
        });
        categoryInput.addEventListener('change', () => {
            savePageMeta(categoryInput.value);
        });

        const highlightBtn = document.createElement('button');
        highlightBtn.id = 'highlighter-btn-highlight';
        highlightBtn.className = 'highlighter-btn';
        highlightBtn.innerHTML = '🖋️ Highlight';
        highlightBtn.addEventListener('mousedown', (e) => e.preventDefault());
        highlightBtn.addEventListener('click', highlightSelection);

        const copyBtn = document.createElement('button');
        copyBtn.id = 'highlighter-btn-copy';
        copyBtn.className = 'highlighter-btn';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.addEventListener('mousedown', (e) => e.preventDefault());
        copyBtn.addEventListener('click', copyHighlightsToClipboard);

        const clearBtn = document.createElement('button');
        clearBtn.id = 'highlighter-btn-clear';
        clearBtn.className = 'highlighter-btn';
        clearBtn.innerHTML = '🗑️ Clear';
        clearBtn.addEventListener('mousedown', (e) => e.preventDefault());
        clearBtn.addEventListener('click', clearPageHighlights);

        root.appendChild(badge);
        root.appendChild(categoryInput);
        root.appendChild(highlightBtn);
        root.appendChild(copyBtn);
        root.appendChild(clearBtn);

        document.body.appendChild(root);
        updateHighlightCount();
    }

    // Run MutationObserver to dynamic load restorations (for SPA sites like FT, NYT, WSJ, Bloomberg)
    let observer = null;
    function startObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver((mutations) => {
            let shouldRestore = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    let hasRealAdditions = false;
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (!node.classList.contains('highlighter--highlighted') &&
                                node.id !== 'highlighter-panel-root' &&
                                !node.closest('#highlighter-panel-root')) {
                                hasRealAdditions = true;
                                break;
                            }
                        } else if (node.nodeType === Node.TEXT_NODE) {
                            hasRealAdditions = true;
                            break;
                        }
                    }
                    if (hasRealAdditions) {
                        shouldRestore = true;
                        break;
                    }
                }
            }

            if (shouldRestore) {
                observer.disconnect();
                restoreHighlights();
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initialization
    function init() {
        injectStyles();
        createHighlighterUI();
        restoreHighlights();
        startObserver();
    }

    // Run script on page setup
    init();

    // Register Ctrl + ` Keyboard listener
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "`") {
            e.preventDefault();
            highlightSelection();
        }
    });

    // Register Tampermonkey extension commands
    GM_registerMenuCommand("Highlight Selected Text", highlightSelection, "H");
    GM_registerMenuCommand("Copy Formatted Highlights", copyHighlightsToClipboard, "C");
    GM_registerMenuCommand("Clear All Highlights", clearPageHighlights, "L");

})();
