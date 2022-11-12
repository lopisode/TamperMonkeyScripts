// ==UserScript==
// @name         soc-capture
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Post Data to API
// @author       You
// @match        *
// @include    /https?:\/\/*/
// @grant        GM_xmlhttpRequest
// @grant      GM_registerMenuCommand
// @run-at       document-idle
// @connect      *
// ==/UserScript==


GM_registerMenuCommand('Send Saved Data On Page', function() {
    function sendPostRequest() {
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

        const dateValue = new Date();

        var docData = {
            "document_request_key_phrase": "13e586776bed92770b9cfdafbb6b2d8d6faeb3642b758bcd1b4c6c5ed38a72bf",
            "document_title": document.title,
            "document_url": document.URL,
            "document_data": stringData,
            "document_source": "tamper_monkey",
            "document_review_date": dateValue.toUTCString()
        }
        console.log(docData);

        GM_xmlhttpRequest ( {
            method:     "POST",
            url:        "http://127.0.0.1:5000/save_data/",
            data:       JSON.stringify(docData),
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
