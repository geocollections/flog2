/**
AxisSample
*/
Flog2.AxisSample = (function(base){
    extend(base, AxisSample);

    /** @constructor */
    function AxisSample (c) {
        this.data = c.data||{};
        this.cls = "axis_sample";
        this.width = c.width||null;
        
        this.link = c.link||null;

        this.parent = c.parent||null;            // Is set later

        this.margins(c.margin);                    // NN or {top:NN...}
        this.width = c.width||100;                // Inner width 
        this.height = c.height||null;            // Inner height (without header and footer)

        this.minDepth = c.minDepth||null;
        this.maxDepth = c.maxDepth||null;

        this.markerType = ["interval","point"][0]; // interval - boxes, point - average
        this.markerWidth = c.markerWidth||10; 

        this.textAreaWidth = 50;
        this.maxState = 1;

        this.isVisible = c.isVisible||true;

        this.styles = {
            "axis-sample-text": "font-family:arial;font-size:10px;cursor:pointer;"
        }
        this.style(c.styles);

        this.data = [];

        this.dom = {module:null, content:null, rects:null, texts:null};

    }

    /**
    Data formatter. Remove data outside view,
    create hierarchy for sample rectangles.
    */
    AxisSample.prototype.dataFormatter = function() {
        var parent_depths = []; // [[<depth_from>,<depth_to>],..]

        this.data = this.data.filter(function(d) {
            //Remove data outside chart horizon
            if(d.depth_to < this.minDepth 
            || d.depth_from > this.maxDepth)
                return false;
            // Step calculator
            d["depth_from"] = +d["depth_from"];
            d["depth_to"] = +d["depth_to"];

            if(parent_depths.length == 0) {
                parent_depths.push([d["depth_from"], d["depth_to"]]);
                d["_sample_step"] = 0;
            } else {
                var state=NaN;
                for(var j=0,m=parent_depths.length; j<m; j++) {
                    if(parent_depths[j][1] < d["depth_from"]) {    
                        // Add correct level to this record
                        if(isNaN(state)) 
                            state=j;
                        parent_depths.splice(j, 1, [null, null]);
                    }
                }
                if(!isNaN(state)) {
                    parent_depths.splice(state, 1, [d["depth_from"], d["depth_to"]]);
                    d["_sample_step"] = state;
                    if(state > this.maxState)
                        this.maxState = state;
                } else {
                    parent_depths.push([d["depth_from"], d["depth_to"]]);
                    d["_sample_step"] = j;
                    if(j > this.maxState)
                        this.maxState = j;
                }
            }
            return true;
        }.bind(this));
        parent_depths.length = 0;
    }

    /**
    Renderer
    */
    AxisSample.prototype.render = function() {
        var t=this;

        this.dom.rects = this.dom.rects.data(this.data);
        this.dom.rects.enter().append("rect");
        this.dom.rects
            .attr("x", function(d, i){
                    return (isNaN(d["_sample_step"]) ? 1 : d["_sample_step"]) * t.markerWidth})
		    .attr("y", function(d){
		            return t.scale(d["depth_to"] - d["depth_from"] != 0 ? 
		                (d["depth_from"] < t.minDepth ? t.minDepth : d["depth_from"]) : d["depth"]);
		     })
            .attr("width", this.markerWidth)
		    .attr("height", function(d){
		            return d["depth_to"] - d["depth_from"] != 0 ? 
		                Math.abs(t.scale(d["depth_to"] < t.maxDepth ? 
		                    d["depth_to"] : t.maxDepth) - t.scale(d["depth_from"] > 
                            t.minDepth ? d["depth_from"] : t.minDepth)) : 1;
		     })
		     .attr("class", "axis-sample-rect");

        if(this.link != null)
		    this.dom.rects.on("click", this.link);

        this.dom.rects.exit().remove();
        
        // Texts
        this.dom.texts = this.dom.texts.data(this.data);
        this.dom.texts.enter().append("text");
        this.dom.texts
            .attr("x", function(d){return 10 + (t.maxState + 1) * t.markerWidth})
            .attr("y", function(d){
                return t.scale(d.depth >= t.minDepth && d.depth <= t.maxDepth ? d.depth : 
                    (d.depth < t.minDepth ? t.minDepth : t.maxDepth)
                ) + 3*(d.depth < t.maxDepth ? 1 : -1);
            })
            .attr("class", "axis-sample-txt")
            .attr("style", this.styles["axis-sample-text"])
            .text(function(d){return d.sample_number});

        // Create link
        if(this.link != null)
		    this.dom.texts
                    .on("click", this.link)
                    .classed("flog2-chart-link", true);

        this.dom.texts.exit().remove();

        this.data.length = 0;
    }

    /**
    Draw
    */
    AxisSample.prototype.draw = function() {
        // number of maximum overlaps should be calculated
        // here and based on that width should be returned
        // this.data
        this.dataFormatter();

        if(!this.width)
            this.width = this.markerWidth * this.maxState + this.textAreaWidth;

        this.dom.content = this.dom.module
            .append("g")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate("+this.margin.left+","+this.margin.top+")")
            .attr("overflow", "hidden")
            .attr("class", "axissample");

        this.dom.rects = this.dom.content.selectAll(".axis-sample-rect");
        this.dom.texts = this.dom.content.selectAll(".axis-sample-txt");

        this.render();
    }

    /**
    Redraw 
    */
    AxisSample.prototype.redraw = function() {
        this.dom.content
            .attr("height", this.height)
            .attr("width", this.width);
        this.dataFormatter();
        this.render();
    }

    AxisSample.prototype.remove = function() {
        this.dom.rects.on("click", null);
        this.dom.rects.on("click", null);
        for(var k in this.dom)
            this.dom[k].remove();
            this.dom[k] = null;
    }

    return AxisSample;

})(Flog2);
