// ==UserScript==
// @name       Add To SOCCapture
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Run only on click
// @include    /https?:\/\/*/
// @copyright  2012+, You
// @grant      unsafeWindow
// @grant      GM_registerMenuCommand
// ==/UserScript==



GM_registerMenuCommand('Archive Data On Page', function() {
    function download(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    const outlinedNotes = document.getElementsByClassName("highlighter--highlighted");
    var stringData = "";
    var i = 0

    for(i=0; i < outlinedNotes.length ; i++){
        stringData += outlinedNotes[i].innerHTML.valueOf() + " ";
    }

    const dateValue = new Date();

    var docData = {
        "documentTitle": document.title,
        "documentURL": document.URL,
        "documentData": stringData,
        "documentReviewDate": dateValue.toUTCString()
    }
    console.log(docData);
    download(JSON.stringify(docData), "SOCCapture_" + document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),'application/json')

}, 'r');