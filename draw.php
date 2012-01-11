<?php

/**
 * draw.php
 *
 * Handles the server-side maintenance of drawing operations.
 *
 * This file contains the routines necessary to keep the image being drawn
 * in the client-side javascript synchronized with the jpeg image stored on
 * the server.
 *
 * Adam Jensen <acj@linuxguy.org>
 */

 $im            = @imagecreatefromgif("images/canvas.gif");
 $color         = imagecolorallocate($im, 255, 255, 255);
 $shapes_color  = imagecolorallocate($im, 255, 0, 0);
 imagefill($im, 0, 0, $color);

 switch($_GET["c"]){
     case "clearCanvas":
     {
        $im = imagecreatefromgif("images/gridgrey.gif");
        imagefill($im, 0, 0, $color);
        print "OK";
        break;
     }
     case "drawRectangle":
     {
        imagerectangle($im, $_GET["x1"], $_GET["y1"], $_GET["x2"], $_GET["y2"], $shapes_color);
        header("Content-type: text/plain");
        print "OK";
        break;
     }
     case "drawEllipse":
     {
        imageellipse($im, $_GET["cx"], $_GET["cy"], $_GET["w"], $_GET["h"], $shapes_color);
        print "OK";
        break;
     }
     case "drawString":
     {
        imagestring($im, 3, $_GET["x1"], $_GET["y1"], $_GET["text"], $shapes_color);
        print "OK";
        break;
     }
     case "drawLine":
     {
        imageline($im, $_GET["x1"], $_GET["y1"], $_GET["x2"], $_GET["y2"], $shapes_color);
        print "OK";
        break;
     }
     case "loadCanvas":
     {
        $filename = $_GET["canvas"] . ".jso";
        if (!file_exists($filename)) {
            print "[]";
        }

        print file_get_contents($filename);
        break;
     }
     case "saveCanvas":
     {
        $filename = $_GET["canvas"] . ".jso";

        if (!$fp = fopen($filename, "w")) {
            print "ERROR";
        }

        if (fwrite($fp, $_GET["xml"]) === false) {
            print "ERROR";
        } else {
            print "OK";
        }
        fclose($fp);

        break;
     }
     default:
     {
        break;
     }
 }

 # Write the image back to disk.
 imagegif($im, "images/canvas.gif", 100);
 imagedestroy($im);

 exit;
?>