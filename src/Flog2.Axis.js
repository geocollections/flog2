/**
Axis
*/
Flog2.Axis = (function(base) {
    extend(base, Axis);

    /** @constructor */
    function Axis(c) {
        this.cls = c.cls||"axis";
        this.parent = c.parent||null;
        this.direction = c.direction||"left"; // "top", "bottom", "left" or "right"
        this.scale = c.scale||null;
        this.n_ticks = c.n_ticks||10;
        this.n_minorTicks = c.n_minorTicks||1;
        this.tickSize = c.tickSize||null;
        this.format = c.tickFormat||false;
        this.minorTickSize = c.minorTickSize||this.tickSize||5;
        this.margins(c.margin);
        this.styles = {
            "text":"font-family:arial;font-size:10px;stroke:none",
            "tick":"stroke:#000;stroke-width:0.5px;",
            "minor-tick":"stroke:rgb(160,160,160);stroke-width:0.2",
            "path":"stroke:#333;stroke-width:1px;fill:none"
        }
        this.style(c.styles);

        this.dom = {module:null, major:null, minor:null, minorLines:null}
    }

    /**
    D3 axis element
    */
    Axis.prototype.getMajor = function() {
        var axis = d3.svg.axis();
        axis.scale(this.scale);
        axis.orient(this.direction);
        axis.ticks(this.n_ticks);
        if(this.format)
            axis.tickFormat(this.format);
        if(this.tickSize) {
            axis.tickSize(this.tickSize);
        }
        return axis;
    }


    Axis.prototype.getMinor = function() { 
        var t=this,
            r=this.scale.ticks(this.dom.major.selectAll(".tick").size()),
            size = (r[1]-r[0]) / (this.n_minorTicks + 1),
            data = [],
            wh = this.direction == "top" || this.direction == "bottom" ? 1 : 0;
        data.length = 0;
        if(r[0] - this.scale.domain()[0] > size) {
            var n_ticks = Math.floor((r[0] - this.scale.domain()[0]) / size);
            for(var i=n_ticks;i--;i) 
                data.push(r[0] - size * (i+1)); 
        }
        for(var i=0,n=r.length-1; i<n; i++)
            for(var j=0,m=this.n_minorTicks + 1;j<m;j++)
                data.push(r[i] + size*j);    

        // Add minor tick after the last major tick if there's space
        if((this.scale.domain()[1]-r[r.length-1]) > size){
            for(var i=0,n=Math.floor((this.scale.domain()[1]-r[r.length-1]) / size);i<n;i++)
                data.push(r[r.length-1] + (i+1)*size);
        }
        // Add minor tick before the first major tick if there's space
        if((this.scale(r[0])) > this.scale(size))
            data.unshift(r[0] - size);

        var cases = {
            "top":{
                x1: this.scale,
                x2: this.scale,
                y1: 0,
                y2: -this.minorTickSize
            },
            "left":{ 
                x1: -this.minorTickSize,
                x2: 0,
                y1: this.scale,
                y2: this.scale
            }
        }

        this.dom.minorLines = this.dom.minorLines.data(data),
        this.dom.minorLines.enter().append("line");

        for(var k in cases[this.direction])
            this.dom.minorLines.attr(k, cases[this.direction][k])
        this.dom.minorLines.attr("style", this.styles["minor-tick"]);
        this.dom.minorLines.exit().remove();
    }

    /**

    */
    Axis.prototype.draw = function() {
        //var major = this.getMajor();

        this.dom.major = this.dom.module.append("g");

        this.attr = {
            overflow: "visible",
            "class": this.cls,
            width: 1,
            height: 1
        }

        var cases = {
            left:{transform: "translate(50,"+this.margin.top+")"},
            top:{transform: "translate(0,"+this.margin.top+")"},
            right:{x:0, y:0}, // Not used
            bottom:{x:0, y:0}  // Not used
        };

        for(var k in cases[this.direction])
            this.attr[k] = cases[this.direction][k];
        
        for(var k in this.attr)
            this.dom.major.attr(k, this.attr[k]);

        this.dom.major.call(this.getMajor());
        this.dom.major
            .selectAll("text")
            .attr("style", this.styles["text"]);
        this.dom.major
            .selectAll(".tick")
            .attr("style", this.styles["tick"]);
        this.dom.major
            .selectAll("path")
            .attr("style", this.styles["path"]);

        // minor
        this.dom.minor = this.dom.module.append("g");
        this.dom.minorLines = this.dom.minor.selectAll("line");

        for(var k in cases[this.direction])
            this.dom.minor.attr(k, cases[this.direction][k]);
        this.dom.minor.attr("class", "minorTick");
        this.redraw();
    }

    /**

    */
    Axis.prototype.redraw = function() {
        var el = this.getMajor();
        this.dom.major.call(el);

        this.getMinor();

        // text-anchor hack - it is inserted by d3.axis
        // and therefore static inclusion of text style
        // breaks it.
		var text=this.dom.module.selectAll("text");
        if(text[0].length > 0) {
            text.attr("style", 
			    this.styles["text"]+";text-anchor:"+text.style("text-anchor"));
        }

        this.dom.major
            .selectAll("path")
            .attr("style", this.styles["path"]);
        this.dom.major
            .selectAll(".tick")
            .attr("style", this.styles["tick"]);
    }

    /**

    */
    Axis.prototype.remove = function() {
        this.dom.major.selectAll(".tick").remove();
        this.dom.major.selectAll("line").remove();
        this.dom.major.selectAll("text").remove();
        this.dom.major.selectAll("path").remove();
        this.dom.major.remove();
        this.dom.minor.selectAll("line").remove();
        this.dom.minor.remove();
    }

    return Axis;

})(Flog2);
