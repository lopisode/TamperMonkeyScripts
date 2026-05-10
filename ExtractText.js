// ==UserScript==
// @name         Article Data Extractor
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Extracts article data to clipboard as JSON matching Python Article dataclass
// @author       You
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    // Create a floating button on the page
    const btn = document.createElement('button');
    btn.innerText = 'Copy Article Data';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '9999999';
    btn.style.padding = '12px 16px';
    btn.style.backgroundColor = '#2ecc71';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    btn.style.fontFamily = 'sans-serif';

    document.body.appendChild(btn);

    function extractData() {
        // Helper to get meta tags securely
        const getMeta = (names) => {
            if (!Array.isArray(names)) names = [names];
            for (const name of names) {
                const tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                if (tag && tag.content) return tag.content;
            }
            return '';
        };

        // Extract standard article details
        const title = getMeta(['og:title', 'twitter:title']) || document.title;

        let datetime_str = getMeta(['article:published_time', 'date']);
        if (!datetime_str) {
            const timeTag = document.querySelector('time[datetime]');
            if (timeTag) datetime_str = timeTag.getAttribute('datetime');
            else datetime_str = new Date().toISOString(); // Fallback to current time
        }

        const link = window.location.href;
        const tags = getMeta(['keywords', 'article:tag', 'news_keywords']) || '';
        const source = getMeta(['og:site_name', 'application-name']) || window.location.hostname;
        const author = getMeta(['author', 'article:author', 'byl']) || null;

        // Try to get article text robustly while avoiding clutter
        let text = '';
        const articleElements = [
            document.querySelector('.article-body'),
            document.querySelector('.story-content'),
            document.querySelector('.post-content'),
            document.querySelector('article'),
            document.querySelector('[role="main"]'),
            document.querySelector('main')
        ];

        const mainElement = articleElements.find(el => el !== null);

        if (mainElement) {
            // The cleanest way to get just the story on news sites is to extract only the <p> and header tags.
            // This naturally ignores UI elements, share buttons, menus, and sidebars which use <div>, <a>, <ul>, etc.
            const paragraphs = Array.from(mainElement.querySelectorAll('p, h2, h3'));

            if (paragraphs.length > 0) {
                text = paragraphs
                    .map(el => el.innerText.trim())
                    // Filter out short fragments that are often UI artifacts (e.g. "Print this page", "Share")
                    // Real paragraphs usually have punctuation or are decent length
                    .filter(t => t.length > 30 || /[.!?]/.test(t))
                    .join('\n\n');
            } else {
                // Fallback to innerText if no paragraphs are found
                text = mainElement.innerText.trim();
            }
        } else {
            text = document.body.innerText.trim();
        }

        // Clean up any weird spacing that might still exist
        text = text.replace(/ {2,}/g, ' ');     // collapse multiple spaces
        text = text.replace(/\n\s*\n/g, '\n\n');// collapse multiple newlines
        text = text.trim();

        // Format according to the Python dataclass
        const data = {
            title: title,
            datetime_str: datetime_str,
            link: link,
            tags: tags,
            text: text,
            source: source,
            to_be_processed: true,
            summary: null,
            auto_gen_tags: null,
            author: author
        };

        // Output as JSON
        const jsonStr = JSON.stringify(data, null, 4);

        GM_setClipboard(jsonStr);

        // Provide visual feedback
        const originalText = btn.innerText;
        btn.innerText = 'Copied as JSON!';
        btn.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '#2ecc71';
        }, 2000);
    }

    // Trigger on button click
    btn.addEventListener('click', extractData);

    // Trigger via Tampermonkey extension menu
    GM_registerMenuCommand("Extract Article Text", extractData, "D");

})();
