Summary
=======
A simple vector graphics drawing tool, implemented in JavaScript. At last check (early 2011), it works in Firefox and Safari but only supports line segments in Chrome.

Server-side
===========
There is a script (`draw.php`) that can save diagrams to disk in both image (default: GIF) and JSON format, thus making it possible to restore them later. PHP must be compiled with support for the GD image library for the script to generate an image.

Installation and Usage
======================
1. Drop the files into a web-accessible directory (or a local one, if you don't care about the server side of things) and load `index.html` in a browser.
2. Start drawing!