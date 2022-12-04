// ==UserScript==
// @name       URLd
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Copy URL to Archive
// @include    /https?:\/\/*/
// @copyright  2012+, You
// @grant      unsafeWindow
// @grant      GM_setClipboard
// @grant      GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand ("Save URL for Future Date", saveURL, "U");

function saveURL () {
    GM_xmlhttpRequest ( {
        method:     "POST",
        url:        "http://127.0.0.1:5000/save_data/",
        data:       JSON.stringify(window.location.href),
        headers:    {
            "Content-Type": "application/json"
        },
        onError: function() {
            console.log("error");
        }
    } );
}


