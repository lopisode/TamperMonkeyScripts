// ==UserScript==
// @name       Copy Highlighted Data To Clipboard
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Copy Highlighted Data To Clipboard
// @include    /https?:\/\/*/
// @copyright  2012+, You
// @grant      unsafeWindow
// @grant      GM_setClipboard
// @grant      GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand ("Copy Highlighted Data To Clipboard", copyData, "C");

function copyData () {
    const outlinedNotes = document.getElementsByClassName("highlighter--highlighted");
    var stringData = "";
    var i = 0

    for(i=0; i < outlinedNotes.length ; i++){
        if(i > 0){
            stringData += "||";
        }
        if(outlinedNotes[i].innerHTML.valueOf().length){
            stringData += outlinedNotes[i].innerHTML.valueOf();
        }
    }

    GM_setClipboard (stringData);
}

