/**
AxisDrillcoreBox
*/
Flog2.AxisDrillcoreBox = (function(base) {
    extend(base, AxisDrillcoreBox);

    /** @constructor */
    function AxisDrillcoreBox (c) {
        this.cls = c.cls||"f2-axis-drillcorebox";
        this.height = c.height;
        this.width = c.width||20;
        this.minDepth = c.minDepth||null;
        this.maxDepth = c.maxDepth||null;
        this.src = c.src||null;
        this.dataType = c.dataType||"tsv";            // Data type if 
        this.data = !c.src && c.data ? c.data : null; // If no external source is given, data array from config object is expected
        this.cols = c.cols||null;                     // {depth_top:"my_depth_top",depth_base:"my_depth_base",level:"my_level"};

        this.link = c.link||null;

        this.isVisible = c.isVisible||true;

        this.styles = {
            "axis-drillcorebox-rect": "stroke-width:1;stroke:rgb(0,0,0);",
            "axis-drillcorebox-text": "font-family:arial;font-size:10px",
        }
        this.style(c.styles);
        this.dom = {module:null, rects:null, texts:null};
    }

    /**
    
    */
    AxisDrillcoreBox.prototype.render = function() {
        var t=this;            
        // Box
        if(this.data == null) return; // Because of asyncronous load data might be null raising error

        this.dom.rects = this.dom.rects.data(t.data.filter(function(d){
            return 0 < (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) -
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top));
        }));        
        this.dom.rects.enter().append("rect");
        this.dom.rects
            .attr("x", 0)
            .attr("y", function(d){
                return t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top)
            })
            .attr("width", function(d){return t.width;})
            .attr("height", function(d){
                //var top = t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top);
                //var bottom = t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base);
                //return bottom - top;
                return (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) -
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top));
            })
            .attr("style", function(d){ 
                return t.styles["axis-drillcorebox-rect"]+
                    "fill:"+(d.color ? d.color.indexOf(",") !== -1 ? "rgb("+d.color+")" : d.color : "#fff")
            })
            .attr("class", "axis-drillcorebox-rect");
        this.dom.rects.exit().remove();

        // Text
        this.dom.texts = this.dom.texts.data(t.data.filter(function(d){
            return 0 < (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) -
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top))}));
        this.dom.texts.enter().append("text");
        this.dom.texts
            .attr("transform", function(d){ 
                return "translate("+
                            (t.width/2+3)+","+
                            (t.scale(+d.depth_base < t.maxDepth ? +d.depth_base : t.maxDepth)-2)+")"+
                        "rotate(-90)"; 
            })
            .attr("class", "axis-drillcorebox-text")
            .attr("style", this.styles["axis-drillcorebox-text"])
            .text(function(d) {return d.number})
            .text(function(d,i){
                var top = t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top),
                    base = t.scale(+d.depth_base) > t.height ? t.height : t.scale(+d.depth_base);
                return (base-top) > this.getBBox().width ? d.number : "";
            });

        if(this.link!=null)
            this.dom.texts
                    .on("click", t.link)
                    .classed("flog2-chart-link", true);
        this.dom.texts.exit().remove();
    }

    /**
    
    */
    AxisDrillcoreBox.prototype.draw = function() {
        var mimeType=["csv","tsv","json","jsonp","text","xml"],
            cbfn = function(data) {
                if(data) this.data=data;
                if(this.cols) this.colRenamer();
                
                this.dom.rects = this.dom.module.selectAll(".axis-drillcorebox-rect");
                this.dom.texts = this.dom.module.selectAll(".axis-drillcorebox-text");

                this.render();
                this.up.redraw();
            }.bind(this);

        if(mimeType.indexOf(this.dataType) == -1) {
            console.error("Invalid data delimiter code given. Possible values: csv,tsv,json,jsonp,txt,xml");
            return;
        }
        this.src ? d3[this.dataType](this.src, cbfn) : cbfn();
    }

    /**

    */
    AxisDrillcoreBox.prototype.redraw = function() {
        this.render();
    }

    /**

    */
    AxisDrillcoreBox.prototype.remove = function() {
        this.dom.texts.on("click", null);
        this.data.length = 0;
        for(var k in this.dom) {
            this.dom[k].remove();
            this.dom[k] = null;
        }
    }

    return AxisDrillcoreBox;

})(Flog2);
