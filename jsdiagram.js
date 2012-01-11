/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/* jsDiagram - A Javascript-based canvas that features basic drawing tools */

/* Template variables for the `jsDiagram' class */
jsDiagram.prototype.active_tool     = "Line";   /* Default tool */
jsDiagram.prototype.canvas_name     = "DefaultCanvas";
jsDiagram.prototype.mouse_is_down   = false;
jsDiagram.prototype.redraw_handlers = [];       /* Functions to invoke when something is drawn */
jsDiagram.prototype.shapes          = [];
jsDiagram.prototype.trace_coords    = [0,0,0,0];
jsDiagram.prototype.trace_id        = -1;       /* Low-level shape ID for the trace rectangle */

function jsDiagram(canvas_name, canvas_id, backgroundimage, autoload) {
    /* Set up a reference to this object for internal use, particularly in
       nested functions whose scope may not allow the use of `this' to refer
       to the jsDiagram instance.  This is a bug in ECMAScript. */
    var self = this;

    /* Set up a canvas on our drawing space */
    this.canvas_name = canvas_name;
    this.jg = new jsGraphics(canvas_id)
        || alert("jsDiagram error: Could not create jsGraphics canvas on specified DIV element");

    /* Set the low-level canvas name to match ours, preventing any name
       collisions (provided that the user hasn't constructed an HTML document
       with two canvases that have identical names. */
    this.jg.canvas_name = canvas_name;

    /* Get handle of drawing container */
    this.dg = document.getElementById(canvas_id);

    /* If we've been given a background image, set it now. */
    if (backgroundimage != "") {
        this.dg.style["backgroundImage"] = "url('" + backgroundimage + "')";
    }

    /* !!!
     * OTHER INITIALIZATION TAKES PLACE AT THE END OF THE `jsDiagram` FUNCTION
     * !!!
     */

    /**
    * Register click events for the drawing container.
    */

    function onMouseDown (e) {
        var dg = self.dg;

        /* Workaround for IE */
        var e = e || event;

        self.log("mousedown start");

        if (navigator.appName == "Microsoft Internet Explorer") {
            self.trace_coords[0] = (e.clientX + document.body.scrollLeft) - parseInt(dg.style.left);
            self.trace_coords[1] = (e.clientY + document.body.scrollTop) - parseInt(dg.style.top);
        } else {
            self.trace_coords[0] = e.pageX - parseInt(dg.style.left);
            self.trace_coords[1] = e.pageY - parseInt(dg.style.top);
        }

        self.mouse_is_down = true;
        self.log(canvas_name + ": mousedown: " + self.trace_coords[0] + "," + self.trace_coords[1]);
    }

    function onMouseMove (e) {
        var dg = self.dg;
        var jg = self.jg;

        if (self.mouse_is_down) {
            /* Workaround for IE */
            var e = e || event;

            /* New mouse coordinates */
            if (navigator.appName == "Microsoft Internet Explorer") {
                self.trace_coords[2] = (e.clientX + document.body.scrollLeft) - parseInt(dg.style.left);
                self.trace_coords[3] = (e.clientY + document.body.scrollTop) - parseInt(dg.style.top);
            } else {
                self.trace_coords[2] = e.pageX - parseInt(dg.style.left);
                self.trace_coords[3] = e.pageY - parseInt(dg.style.top);
            }

            if (self.trace_id != -1) {
                /* Remove the old trace rectangle */
                for (var component in jg.shapes[self.trace_id].components) {
                    var t = document.getElementById(jg.shapes[self.trace_id].components[component]);

                    if (t != null) {
                        t.parentNode.removeChild(t);
                    }
                }

                /* Remove the old trace shape */
                jg.shapes.splice(self.trace_id, 1);
            }

            /* Draw a new trace rectangle */
            var trace_topleft = [self.trace_coords[0], self.trace_coords[1]];
            var trace_width = self.trace_coords[2] - self.trace_coords[0];
            var trace_height = self.trace_coords[3] - self.trace_coords[1];

            /* Handle problematic cases:
             *   - When width or height are zero
             *   - When width or height are negative
             */
            if (trace_width == 0) {
                trace_width = 1;
            }

            if (trace_height == 0) {
                trace_height = 1;
            }

            if (trace_width < 0) {
                trace_width = Math.abs(trace_width);
                trace_topleft[0] -= trace_width;
            }

            if (trace_height < 0) {
                trace_height = Math.abs(trace_height);
                trace_topleft[1] -= trace_height;
            }

            self.trace_id = jg.drawRect(trace_topleft[0],
                        trace_topleft[1],
                        trace_width,
                        trace_height);

            jg.paint();
        }
    }

    function onMouseUp (e) {
        var dg = self.dg;
        var jg = self.jg;

        /* Workaround for IE */
        var e = e || event;

        self.mouse_is_down = false;
        self.log("mouseclick");

        /* Clear the trace rectangle */
        if (self.trace_id != -1) {
            for (var component in jg.shapes[self.trace_id].components) {
                var t = document.getElementById(jg.shapes[self.trace_id].components[component]);

                if (t != null) {
                    t.parentNode.removeChild(t);
                }
            }

            /* Remove the old trace shape */
            jg.shapes.splice(self.trace_id, 1);
            self.trace_id = -1;
        }

        var rect_width = self.trace_coords[2] - self.trace_coords[0];
        var rect_height = self.trace_coords[3] - self.trace_coords[1];

        /* Determine which tool function to call */
        if (self.active_tool == "Rectangle") {
            var shpRect = new Rectangle([self.trace_coords[0],
                                            self.trace_coords[1]],
                                            rect_width,
                                            rect_height);

            /* Register the shape and then paint it on the canvas. */
            shpRect.shape_id = self.shapes.length;
            self.shapes.push(shpRect);
            self.log("Shape ID: " + shpRect.shape_id);
            shpRect.paint();
        } else if (self.active_tool == "Ellipse") {
            var shpEllipse = new Ellipse([self.trace_coords[0],
                                            self.trace_coords[1]],
                                            rect_width,
                                            rect_height);
            /* Register the shape and then paint it on the canvas. */
            shpEllipse.shape_id = self.shapes.length;
            self.shapes.push(shpEllipse);
            self.log("Shape ID: " + shpEllipse.shape_id);
            shpEllipse.paint();
        } else if (self.active_tool == "Text") {
            var strText = prompt("Please enter the text below","");

            if (strText != null) {
                shpText = new Text([self.trace_coords[0],
                                            self.trace_coords[1]],
                                            strText);

                /* Register the shape and then paint it on the canvas. */
                shpText.shape_id = self.shapes.length;
                self.shapes.push(shpText);
                self.log("Shape ID: " + shpText.shape_id);
                shpText.paint();
            }
        } else if (self.active_tool == "Line") {
            var shpLine = new Line([self.trace_coords[0],
                                        self.trace_coords[1]],
                                        [self.trace_coords[2],
                                        self.trace_coords[3]]);

            /* Register the shape and then paint it on the canvas. */
            shpLine.shape_id = self.shapes.length;
            self.shapes.push(shpLine);
            self.log("Shape ID: " + shpLine.shape_id);
            shpLine.paint();
        }

        self.EventRedraw();
    }

    this.dg.onmousedown = onMouseDown;
    this.dg.onmousemove = onMouseMove;
    this.dg.onmouseup = onMouseUp;

    /**
     **
     ** Begin drawable shapes
     **
     **/

    /* Common prototype functions for all shapes */
    this.deleteShape = function () {
        var jg = self.jg;

        /* Delete all of the associated DIV's for this shape */
        for (var component in jg.shapes[this.jg_id].components) {
            var t = document.getElementById(jg.shapes[this.jg_id].components[component]);

            if (t != null) {
                t.parentNode.removeChild(t);
            }
        }

        /* Remove the shape itself (includes components) */
        jg.shapes.splice(this.jg_id, 1);
        self.shapes.splice(this.shape_id, 1);
        self.redrawCanvas();
    };

    this.moveShapeDown = function (pixels) {
        /* Grab the low-level shape */
        var jg_shape = self.jg.shapes[this.jg_id];

        /* Verify that this move will not take the shape off the canvas */
        /* TODO */

        /* Adjust the shape's top-left coordinates */
        this.topleft = [this.topleft[0], this.topleft[1] + pixels];

        /* Adjust the shape's components */
        for (var component in jg_shape.components) {
            var t = document.getElementById(jg_shape.components[component]);

            /* From "40px", we need to extract "40" */
            var currentTop = parseInt(t.style["top"].split('p')[0]);
            t.style["top"] = (currentTop + pixels) + "px";
        }
    };

    this.moveShapeLeft = function (pixels) {
        /* Grab the low-level shape */
        var jg_shape = self.jg.shapes[this.jg_id];

        /* Verify that this move will not take the shape off the canvas */

        if (this.topleft[0] - pixels < 0) {
            return;
        }

        /* Adjust the shape's top-left coordinates */
        this.topleft = [this.topleft[0] - pixels, this.topleft[1]];

        /* Adjust the shape's components */
        for (var component in jg_shape.components) {
            var t = document.getElementById(jg_shape.components[component]);

            /* From "40px", we need to extract "40" */
            var currentLeft = parseInt(t.style["left"].split('p')[0]);
            t.style["left"] = (currentLeft - pixels) + "px";
        }
    };

    this.moveShapeRight = function (pixels) {
        /* Grab the low-level shape */
        var jg_shape = self.jg.shapes[this.jg_id];

        /* Verify that this move will not take the shape off the canvas */
        /* TODO */

        /* Adjust the shape's top-left coordinates */
        this.topleft = [this.topleft[0] + pixels, this.topleft[1]];

        /* Adjust the shape's components */
        for (var component in jg_shape.components) {
            var t = document.getElementById(jg_shape.components[component]);

            /* From "40px", we need to extract "40" */
            var currentLeft = parseInt(t.style["left"].split('p')[0]);
            t.style["left"] = (currentLeft + pixels) + "px";
        }
    };

    this.moveShapeUp = function (pixels) {
        /* Grab the low-level shape */
        var jg_shape = self.jg.shapes[this.jg_id];

        /* Verify that this move will not take the shape off the canvas */
        if (this.topleft[1] - pixels < 0) {
            return;
        }

        /* Adjust the shape's top-left coordinates */
        this.topleft = [this.topleft[0], this.topleft[1] - pixels];

        /* Adjust the shape's components */
        for (var component in jg_shape.components) {
            var t = document.getElementById(jg_shape.components[component]);

            /* From "40px", we need to extract "40" */
            var currentTop = parseInt(t.style["top"].split('p')[0]);
            t.style["top"] = (currentTop - pixels) + "px";
        }
    };

    this.selectShape = function () {
        /* Grab the low-level shape */
        var jg_shape = self.jg.shapes[this.jg_id];

        if (this.selected) {
            for (var component in jg_shape.components) {
                /* Select each component DIV, changing its color to black */
                var t = document.getElementById(jg_shape.components[component]);

                t.style["border"] = "1px solid black";
            }

            jg_shape.selected = false; /* Probably no longer needed */
            this.selected = false;

            self.log("Unselected " + this.shape_id);
        } else {
            for (var component in jg_shape.components) {
                /* Select each component DIV, changing its color to blue */
                var t = document.getElementById(jg_shape.components[component]);

                t.style["border"] = "2px solid blue";
            }

            jg_shape.selected = true; /* Probably no longer needed */
            this.selected = true;
            self.log("Selected " + this.shape_id);
        }
    };

    Ellipse.prototype.shape_id  = -1;   /* jsDiagram ID (high-level) */
    Ellipse.prototype.jg_id     = -1;   /* jsGraphics ID (low-level drawing) */
    Ellipse.prototype.selected  = false;
    Ellipse.prototype.type      = "Ellipse";
    Ellipse.prototype.topleft   = [0,0];
    Ellipse.prototype.width     = 0;
    Ellipse.prototype.height    = 0;

    Ellipse.prototype.Select = this.selectShape;
    Ellipse.prototype.Delete = this.deleteShape;
    Ellipse.prototype.moveShapeDown = this.moveShapeDown;
    Ellipse.prototype.moveShapeLeft = this.moveShapeLeft;
    Ellipse.prototype.moveShapeRight = this.moveShapeRight;
    Ellipse.prototype.moveShapeUp = this.moveShapeUp;

    function Ellipse(topleft, width, height) {
        this.topleft = topleft;
        this.width = width;
        this.height = height;

        /* If the user chooses a second point (bottom-right corner) that is
           actually not the bottom-right corner of the trace, the width and
           height calculations will evaluate to a negative number.  Handle this
           gracefully. */
        if (this.width < 0) {
            this.width = Math.abs(width);
            this.topleft[0] -= this.width;
        }

        if (this.height < 0) {
            this.height = Math.abs(height);
            this.topleft[1] -= this.height;
        }

        /* Produces a list that describes this object */
        this.serialize = function () {
            return {type:"Ellipse",
                    topleft:this.topleft,
                    width:this.width,
                    height:this.height};
        };

        /* Populates this instance with serialized data */
        this.unserialize = function (dictEllipse) {
            this.topleft    = dictEllipse.topleft;
            this.width      = dictEllipse.width;
            this.height     = dictEllipse.height;
        };

        this.paint = function () {
            /* Paint the shape on the canvas */
            this.jg_id = self.jg.shapes.length;
            self.jg.drawEllipse(this.topleft[0],
                        this.topleft[1],
                        this.width,
                        this.height);
            self.jg.paint();

            self.log("Ellipse drawn: top-left at (" + this.topleft[0] + ","
                + this.topleft[1] + "), sides: " + this.width + ", "
                + this.height);

            /* Find the center of the enclosing rectangle.  PHP uses the center
               instead of the upper-left corner. */
            var cx = this.topleft[0] + (this.width / 2);
            var cy = this.topleft[1] + (this.height / 2);

            /* Notify the server */
            //loadXMLDoc(serv_filename + "?c=drawEllipse&cx=" + cx + "&cy=" + cy
            //    + "&w=" + this.width + "&h=" + this.height, self.serverResponse);
        };

        this.toJSON = function () {
            return "{'type':'Ellipse', 'topleft':[" + this.topleft[0] + ","
                + this.topleft[1] + "], 'width':" + this.width + ", 'height':"
                + this.height + "}";
        };
    }

    Line.prototype.shape_id   = -1;   /* jsDiagram ID (high-level) */
    Line.prototype.jg_id      = -1;   /* jsGraphics ID (low-level drawing) */
    Line.prototype.selected   = false;
    Line.prototype.type       = "Line";
    Line.prototype.startpoint = [0,0];
    Line.prototype.endpoint   = [0,0];

    Line.prototype.Delete = this.deleteShape;
    Line.prototype.Select = this.selectShape;
    Line.prototype.moveShapeDown = this.moveShapeDown;
    Line.prototype.moveShapeLeft = this.moveShapeLeft;
    Line.prototype.moveShapeRight = this.moveShapeRight;
    Line.prototype.moveShapeUp = this.moveShapeUp;

    function Line(first_point, second_point) {
        this.startpoint = first_point;
        this.endpoint   = second_point;

        /* Produces a list that describes this object */
        this.serialize = function () {
            return {type:"Line",
                    startpoint:this.startpoint,
                    endpoint:this.endpoint};
        };

        this.unserialize = function (dictLine) {
            this.startpoint = dictLine.startpoint;
            this.endpoint   = dictLine.endpoint;
        };

        this.paint = function () {
            /* Paint the shape on the canvas */
            this.jg_id = self.jg.shapes.length;
            self.jg.drawLine(this.startpoint[0],
                        this.startpoint[1],
                        this.endpoint[0],
                        this.endpoint[1]);
            self.jg.paint();

            self.log("Line drawn: first point at (" + this.startpoint[0] + ","
                + this.startpoint[1] + "), " + "second point at ("
                + this.endpoint[0] + "," + this.endpoint[1] + ")");

            /* Notify the server */
            //loadXMLDoc(serv_filename + "?c=drawLine&x1=" + this.startpoint[0]
            //    + "&y1=" + this.startpoint[1]
            //    + "&x2=" + this.endpoint[0]
            //    + "&y2=" + this.endpoint[1], self.serverResponse);
        };

        this.toJSON = function () {
            return "{'type':'Line', 'startpoint':[" + this.startpoint[0] + ","
                + this.startpoint[1] + "], 'endpoint':[" + this.endpoint[0] + ","
                + this.endpoint[1] + "]}";
        };
    }

    Rectangle.prototype.shape_id  = -1;   /* jsDiagram ID (high-level) */
    Rectangle.prototype.jg_id     = -1;   /* jsGraphics ID (low-level drawing) */
    Rectangle.prototype.selected  = false;
    Rectangle.prototype.type      = "Rectangle";
    Rectangle.prototype.topleft   = [0,0];
    Rectangle.prototype.width     = 0;
    Rectangle.prototype.height    = 0;

    Rectangle.prototype.Delete = this.deleteShape;
    Rectangle.prototype.Select = this.selectShape;
    Rectangle.prototype.moveShapeDown = this.moveShapeDown;
    Rectangle.prototype.moveShapeLeft = this.moveShapeLeft;
    Rectangle.prototype.moveShapeRight = this.moveShapeRight;
    Rectangle.prototype.moveShapeUp = this.moveShapeUp;

    function Rectangle(topleft, width, height) {
        this.topleft = topleft;
        this.width = width;
        this.height = height;

        /* If the user chooses a second point (bottom-right corner) that is
           actually not the bottom-right corner of the trace, the width and
           height calculations will evaluate to a negative number.  Handle this
           gracefully. */
        if (this.width < 0) {
            this.width = Math.abs(width);
            this.topleft[0] -= this.width;
        }

        if (this.height < 0) {
            this.height = Math.abs(height);
            this.topleft[1] -= this.height;
        }

        /* Produces a list that describes this object */
        this.serialize = function () {
            return {type:"Rectangle",
                    topleft:this.topleft,
                    width:this.width,
                    height:this.height};
        };

        this.unserialize = function (dictRect) {
            this.topleft = dictRect.topleft;
            this.width   = dictRect.width;
            this.height  = dictRect.height;
        };

        this.paint = function () {
            var jg = self.jg;

            /* If the
            /* Paint the shape on the canvas */
            this.jg_id = jg.shapes.length;
            self.jg.drawRect(this.topleft[0],
                        this.topleft[1],
                        this.width,
                        this.height);
            self.jg.paint();

            self.log("Rectangle drawn: top-left at (" + this.topleft[0] + ","
                + this.topleft[1] + "), sides: " + this.width + ", "
                + this.height);

            /* Notify the server */
            //loadXMLDoc(serv_filename + "?c=drawRectangle&x1=" + this.topleft[0]
            //    + "&x2=" + (this.topleft[0] + this.width)
            //    + "&y1=" + this.topleft[1]
            //    + "&y2=" + (this.topleft[1] + this.height), self.serverResponse);
        };

        this.toJSON = function () {
            return "{'type':'Rectangle', 'topleft':[" + this.topleft[0] + ","
                + this.topleft[1] + "], 'width':" + this.width + ", 'height':"
                + this.height + "}";
        };
    }

    Text.prototype.shape_id = -1;   /* jsDiagram ID (high-level) */
    Text.prototype.jg_id    = -1;   /* jsGraphics ID (low-level drawing) */
    Text.prototype.selected = false;
    Text.prototype.type     = "Text";
    Text.prototype.topleft  = [0,0];
    Text.prototype.text     = "";

    Text.prototype.Delete = this.deleteShape;
    Text.prototype.Select = this.selectShape;
    Text.prototype.moveShapeDown = this.moveShapeDown;
    Text.prototype.moveShapeLeft = this.moveShapeLeft;
    Text.prototype.moveShapeRight = this.moveShapeRight;
    Text.prototype.moveShapeUp = this.moveShapeUp;

    function Text(topleft, text) {
        this.topleft    = topleft;
        this.text       = text;

        this.serialize = function () {
            return {type:"Text",
                    topleft:this.topleft,
                    text:this.text};
        };

        this.unserialize = function (dictText) {
            this.topleft = dictText.topleft;
            this.text    = dictText.text;
        };

        this.paint = function () {
            var jg = self.jg;

            /* Paint the shape on the canvas */
            this.jg_id = jg.shapes.length;
            self.jg.drawString(this.text, this.topleft[0], this.topleft[1]);
            self.jg.paint();

            self.log("Text drawn: top-left at (" + this.topleft[0] + ","
                + this.topleft[1] + "), \"" + this.text + "\"");

            /* Notify the server */
            //loadXMLDoc(serv_filename + "?c=drawString&x1=" + this.topleft[0]
            //    + "&y1=" + this.topleft[1] + "&text=" + this.text, self.serverResponse);
        };

        this.toJSON = function () {
            return "{'type':'Text', 'topleft':[" + this.topleft[0] + ","
                + this.topleft[1] + "], 'text':'" + this.text + "'}";
        };
    }

    /* End of drawable objects */

    this.changeTool = function (new_tool) {
        this.active_tool = new_tool;
    };

    this.clearCanvas = function () {
        /* Reset lists of shapes */
        this.jg.clear();
        this.jg.shapes = [];
        this.shapes = []

        /* Notify the server that we're clearing the slate */
        //loadXMLDoc(serv_filename + "?c=clearCanvas", self.serverResponse);

        /* Notify everyone of the redraw event */
        self.EventRedraw();
    };

    this.deleteSelected = function () {
        /* Because we're deleting array elements in this loop, we have to iterate
           through it backwards to ensure that the array's indices don't get messed
           up. */
        for (var i = self.shapes.length - 1 ; i >= 0; i -= 1) {
            if (self.shapes[i].selected) {
                /* Remove the shape */
                self.shapes[i].Delete();
            }
        }

        /* Run the list one more time, updating the shape_id property of each
           remaining shape.  This ensures that the indices are consistent. */
        for (var i = self.shapes.length - 1 ; i >= 0; i-= 1) {
            self.shapes[i].shape_id = i;
        }

        /* Refresh the canvas */
        self.EventRedraw();
    };

    this.loadCanvas = function (canvas) {
        /* If we weren't given a canvas name, use the one that was passed
           to the constructor when this jsDiagram instance was created. */
        if (canvas == "" || canvas == null) {
            canvas = self.canvas_name;
        }

        loadXMLDoc(serv_filename + "?c=loadCanvas&canvas=" + canvas,
            this.unserialize);

        self.log("Loading canvas " + canvas);
    };

    this.moveShapesDown = function (pixels) {
        for (var i = 0; i < self.shapes.length; ++i) {
            if (self.shapes[i].selected) {
                self.shapes[i].moveShapeDown(pixels);
            }
        }
    };

    this.moveShapesLeft = function (pixels) {
        for (var i = 0; i < self.shapes.length; ++i) {
            if (self.shapes[i].selected) {
                self.shapes[i].moveShapeLeft(pixels);
            }
        }
    };

    this.moveShapesRight = function (pixels) {
        for (var i = 0; i < self.shapes.length; ++i) {
            if (self.shapes[i].selected) {
                self.shapes[i].moveShapeRight(pixels);
            }
        }
    };

    this.moveShapesUp = function (pixels) {
        for (var i = 0; i < self.shapes.length; ++i) {
            if (self.shapes[i].selected) {
                self.shapes[i].moveShapeUp(pixels);
            }
        }
    };

    this.log = function (str) {
        t = document.getElementById("debuglog");

        if (t == null) {
            return;
        }

        t.innerHTML = str + "<br />" + t.innerHTML;
    };

    /* Redraws the canvas using the shapes currently in memory */
    this.redrawCanvas = function () {
        self.jg.clear();
        self.jg.shapes = Array();

        for (var shape in self.shapes) {
            self.shapes[shape].paint();
        }

        /* One redraw event for the whole thing */
        self.EventRedraw();
    };

    this.saveCanvas = function (canvas) {
        /* If we weren't given a canvas name, use the one that was passed
           to the constructor when this jsDiagram instance was created. */
        if (canvas == "" || canvas == null) {
            canvas = self.canvas_name;
        }

        self.log("Saving canvas...");

        /* Notify the server */
        loadXMLDoc(serv_filename + "?c=saveCanvas"
            + "&canvas=" + canvas + "&xml=" + self.toJSON(),
            self.serverResponse);
    };

    this.selectShape = function (shape_id) {
        if (self.shapes[shape_id] != null) {
            self.log("Toggling " + shape_id);
            self.shapes[shape_id].Select();
        }
    };

    this.serverResponse = function (str) {
        self.log("Server response: " + str);
    };

    this.setBackground = function (str) {
        dg.style["backgroundImage"] = "url('" + str + "')";
    };

    this.toJSON = function () {
        var json = "[";

        for (shape in this.shapes) {
            json += this.shapes[shape].toJSON() + ",";
        }

        json += "]";

        return json;
    };

    /**
    * Toggles the background image on and off.
    */
    this.toggleBackground = function () {
        var dg = self.dg;

        if (dg.style["backgroundImage"] == "") {
            dg.style["backgroundImage"] = "url('" + backgroundimage + "')";
        } else {
            dg.style["backgroundImage"] = "";
        }
    };

    /**
    * Parses a serialized list into usable shapes.
    */
    this.unserialize = function (strJSON) {
        var imported_shapes = eval(strJSON);

        self.clearCanvas();

        for (var shape in imported_shapes) {
            var shape_type = imported_shapes[shape].type;

            /* Now that we know the type of shape, create an instance of that
               shape. */
            var func = "new " + shape_type + "()";
            var new_shape = eval(func);

            /* Now, populate the shape with its details */
            new_shape.unserialize(imported_shapes[shape]);
            new_shape.shape_id = self.shapes.length;

            /* Finally, push the shape onto the stack and paint it on the
               canvas. */
            self.shapes.push(new_shape);
            new_shape.paint();
        }

        /* All the shapes are now drawn - trigger one redraw event for the
           whole set of new shapes. */
        self.EventRedraw();
    };

    /**
    * Events and Event Registration
    */

    /* Fires when something is drawn on the canvas */
    this.EventRedraw = function () {
        for (func in this.redraw_handlers)
        {
            if (func != null) {
                this.redraw_handlers[func]();
            }
        }
    };

    this.registerRedrawHandler = function (func) {
        this.redraw_handlers.push(func);
    };

    /* If we've been asked to automatically load the contents of the canvas
       (via the parameter `autoload'), do this now. */
    if (autoload == true) {
        self.loadCanvas(this.canvas_name);
    }

    /* Notify the log that we're ready to proceed - it's showtime! */
    self.log("Initialized canvas with name " + this.canvas_name);
}