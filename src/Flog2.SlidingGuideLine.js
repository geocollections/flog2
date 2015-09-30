/**
Follows mouse movement,
draws line over chart area,
displays value for specific subchart
*/
Flog2.SlidingGuideLine = (function(base) {
    extend(base, SlidingGuideLine);

    /** @constructor */
    function SlidingGuideLine (c) {
        this.parent = null; // id of parent dom element
        this.width = c.width||0;
        this.height = c.height||0;
        this.Y = c.Y||null;
        this.offset = c.offset||{left:0, top:0};
        this.styles={
            "sliding-guideline": "stroke:#FF0000;stroke-width:1px;shape-rendering:crispEdges;",
            "sliding-guide-depthtext": "font-family:arial;font-size:10px"
        };
        this.style(c.styles);
        this.dom = {module:null, line:null, label:null};
        this.mp = [0,0];

        // Event hooks
        //this.events = {
        //    container: {
        //        "mousemove.slider": this.eventSlider.bind(this),
        //        "mouseout.slider": this.eventSlider.bind(this)
        //    }
        //}
    }

    SlidingGuideLine.prototype.eventSlider = function() {
        this.mp = d3.mouse(this.dom.module[0][0].parentNode);
        if(this.mp[1] < 0 || this.mp[1] > this.height
        || this.mp[0] < 0 || this.mp[0] > this.width) { 
            this.dom.module.style("display", "none");
            return; 
        } else if(this.dom.module.style("display") == "none") {
            this.dom.module.style("display", null);
        }
        this.dom.module
            .attr("transform", 
                  "translate(0,"+(this.mp[1]+1)+")");
        this.dom.label
            .text(this.Y.invert(this.mp[1]).toFixed(2)+" m")
            .attr("fill", "red"); 
    } 

    /**

    */
    SlidingGuideLine.prototype.draw = function() {
        this.dom.module = d3.select("#"+this.parent).append("g")
            .attr("width", this.width)
            .attr("height", 1)
            .style("overflow","visible")
            .attr("class", "sliding-guideline-container")
            .style("pointer-events", "none")
            .style("display", "none");
        // guideline
        this.dom.line = this.dom.module.append("line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("class", "sliding-guideline")
            .attr("style", this.styles["sliding-guideline"])
            .style("pointer-events", "none");

        this.dom.label = this.dom.module.append("text")
            .attr("class", "sliding-guide-depthtext")
            .attr("x", this.width + 2)
            .attr("y", 0)
            .attr("width", "100px")
            .attr("style", this.styles["sliding-guide-depthtext"])
            .style("pointer-events", "none");
    }

    /**

    */
    SlidingGuideLine.prototype.redraw = function() {
        this.dom.module.select(".sliding-guideline")
            .attr("x2", this.width);
        this.dom.module.select(".sliding-guide-depthtext")
            .attr("x", this.width+2);
        // bring sliding guideline to front
        if(this.dom.module[0][0])
            this.dom.module[0][0].parentNode.appendChild(this.dom.module[0][0]);
    }

    return SlidingGuideLine;

})(Flog2);
