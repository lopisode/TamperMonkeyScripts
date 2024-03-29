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
    var todoist_content = prompt('Add Task Name');
    var todoist_description = prompt('Add Task Description');
    const outlinedNotes = document.getElementsByClassName("highlighter--highlighted");
    var stringData = "";
    var i = 0

    for(i=0; i < outlinedNotes.length ; i++){
        if(i > 0){
            stringData += "\n";
        }
        if(outlinedNotes[i].innerHTML.valueOf().length){
            stringData += outlinedNotes[i].innerHTML.valueOf();
        }
    }
        GM_xmlhttpRequest ( {
            method:     "POST",
            url:        "https://api.todoist.com/rest/v2/tasks",
            data:       JSON.stringify({
                'content': todoist_content,
                'description': todoist_description + "\n\n " + window.location.href + "\n\n" + stringData
            }),
            headers:    {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer <APIKEY>'
            },
            onError: function() {
                console.log("error");
            }
        } );
}


