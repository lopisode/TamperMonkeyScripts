// ==UserScript==
// @name         soc-capture
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Post Data to API
// @author       You
// @match        *
// @grant        GM_xmlhttpRequest
// @grant      GM_registerMenuCommand
// @run-at       document-idle
// @connect      *
// ==/UserScript==


GM_registerMenuCommand('Send Saved Data On Page', function() {
    function sendPostRequest() {
        GM_xmlhttpRequest ( {
            method:     "POST",
            url:        "https://ptsv2.com/t/zig8g-1668144939/post",
            data:       "{'test':'valid'}",
            headers:    {
                "Content-Type": "application/json"
            },
            onError: function() {
                console.log("error");
            }
        } );
    }
    sendPostRequest();
},'s');
