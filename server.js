/**
 * server.js
 *
 * Basic AJAX-related routines for jsDiagram
 *
 * Adam Jensen <acj@linuxguy.org>
 */

var serv_callback; /* Callback function for when the server returns data */
var serv_filename = "draw.php"; /* File that handles server-side work */

function processReqChange()
{
    if (req.readyState == 4 && req.status == 200)
    {
        if (serv_callback != null) {
            serv_callback(req.responseText);
        }

    }
}

function loadXMLDoc(url, fcallback) {
  serv_callback = fcallback;
  req = false;
  if(window.XMLHttpRequest) {
    try {
        req = new XMLHttpRequest();
    } catch(e) {
        req = false;
    }
  }
  else if(window.ActiveXObject) {
    try {
      req = new ActiveXObject("Msxml2.XMLHTTP");
    } catch(e) {
        try {
          req = new ActiveXObject("Microsoft.XMLHTTP");
        } catch(e) {
          req = false;
        }
    }
  }
  if(req) {
    req.onreadystatechange = processReqChange;
    req.open("GET", url, true);
    req.send("");
  }
}