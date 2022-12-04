// ==UserScript==
// @name       Todoist
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Copy Highlighted Data To Clipboard
// @include    /https?:\/\/*/
// @copyright  2012+, You
// @grant      unsafeWindow
// @grant      GM_setClipboard
// @grant      GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand ("Add Item To Do Ist Task List", copyData, "T");

function copyData () {
    var stringData = prompt('Add Task');
        GM_xmlhttpRequest ( {
            method:     "POST",
            url:        "http://127.0.0.1:5000/save_data/",
            data:       JSON.stringify(stringData),
            headers:    {
                "Content-Type": "application/json"
            },
            onError: function() {
                console.log("error");
            }
        } );
}


