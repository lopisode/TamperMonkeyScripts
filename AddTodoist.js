// ==UserScript==
// @name       Todoist
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Copy Highlighted Data To Clipboard
// @include    /https:\/\/*/
// @copyright  2012+, You
// @grant      unsafeWindow
// @grant      GM_setClipboard
// @grant      GM_registerMenuCommand
// @grant      GM_xmlhttpRequest
// ==/UserScript==

GM_registerMenuCommand ("Add Item To Do Ist Task List", copyData, "T");

function copyData () {
    var stringData = prompt('Add Task');
        GM_xmlhttpRequest ( {
            method:     "POST",
            url:        "http://127.0.0.1:8000",
            data:       JSON.stringify({
                'content': stringData,
                'description': 'Data sent from TamperMonkey Script'
            }),
            headers:    {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            onError: function() {
                console.log("error");
            }
        } );
}


