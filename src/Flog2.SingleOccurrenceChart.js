/**
SingleOccurrence
@description: Fossil occurrence chart.
Uses one column consisting of 0 ... 2.
To create ascending "stair" chart columns can
be ordered using method df_chitinozoa as data formatter
*/

Flog2.SingleOccurrenceChart = (function(base) {
    extend(base, SingleOccurrenceChart);

    /** @constructor */
    function SingleOccurrenceChart (c) {
        this.parent = c.parent;
        this.title = c.title;
        this.cls = c.cls||"f2-occurrence-chart";
        this.column = c.column;
        this.width = c.width||10;
        this.height = c.height;
        this.margins(c.margin);
        this.footerHeight = c.footerHeight;
        this.maxDepth = c.maxDepth;
        this.minDepth = c.minDepth;
        this.data = [];

        this.styles = {
            "chart-occurrence-text":"transform:rotate(-90);text-anchor:end;font-family:arial;font-size:10px",
            "chart-occurrence-line":"stroke:#000;stroke-width:1px;z-index:100;shape-rendering:crispEdges;",
            "chart-occurrence-rect":"stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;",
            "chart-occurrence-rect-filled":"fill:#fff;stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;"
        }
        this.style(c.styles);

        this.dom = {module:null, content:null, text:null, line:null, recrs:null};
    }

    /**
    In order to get actual footer height dynamically,
    text needs to be rendered separately before content creation.
    */
    SingleOccurrenceChart.prototype.preContentRender = function() {
        
        this.dom.content = this.dom.module
            .append("g")
            .attr("class", "chart-data-container");

        // bottom text
        this.dom.text = this.dom.content
                      .selectAll(".chart-occurrence-text")
                      .data([{"text": this.title}]),
        this.dom.text.enter().append("text"),
        this.dom.text
                .attr("class", "chart-occurrence-text")
                .attr("style", this.styles["chart-occurrence-text"])
                //transform: "rotate(-90)",
                //"text-anchor": "end"
                .text(this.title);

        this.footerHeight = this.dom.text.node().getBBox().width;
        this.dom.text.exit().remove();
    }

    /**

    */
    SingleOccurrenceChart.prototype.render = function() {
        var d=this.data, depths=[];
        this.depthTop = false;
        this.depthBase = false;
        for(var i=0,n=this.data.length; i<n; i++) {
            if(this.data[i][this.column] > 0) {
                if(!this.depthTop)
                    this.depthTop = this.data[i].depth < this.minDepth ? this.minDepth : (this.data[i].depth > this.maxDepth ? this.maxDepth : this.data[i].depth);
                this.depthBase = this.data[i].depth < this.minDepth ? this.minDepth : (this.data[i].depth > this.maxDepth ? this.maxDepth : this.data[i].depth);

                if(this.data[i].depth <= this.maxDepth && this.data[i].depth >= this.minDepth)
                    depths.push({depth:this.data[i].depth,n:this.data[i][this.column]});
            }
        }

        var t=this;    

        // lines
        this.dom.line = this.dom.line
                    .data([{"top":this.depthTop, "base":this.depthBase}]);
        this.dom.line.enter().append("line");
        this.dom.line
            .attr("x1", function(d) {return 3})
            .attr("x2", function(d) {return 3})
            .attr("y1", function(d) {return t.Y(+d.top)})
            .attr("y2", function(d) {return t.Y(+d.base)})
            .attr("class", "chart-occurrence-line")
            .attr("style", this.styles["chart-occurrence-line"]);
        this.dom.line.exit().remove();

        // rects
        this.dom.rects = this.dom.rects.data(depths);
        this.dom.rects.enter().append("rect");
        this.dom.rects
            .attr("x", function(d) {return t.offset_left})
            .attr("y", function(d) {return t.Y(+d.depth)})
            .attr("width", 6)
            .attr("height", 6)
            .attr("class", "chart-occurrence-rect")
            .attr("style", function(d){
                 return t.styles["chart-occurrence-rect"+(d.n==2 ? "-filled" : "")]
            });
        this.dom.rects.exit().remove();
        depths.length = 0;
        // bottom text
        this.dom.text
            .attr("transform", "translate(6,"+(this.Y(this.maxDepth)+10)+")rotate(-90)");
    }

    /**

    */
    SingleOccurrenceChart.prototype.draw = function() {
        this.dom.content = this.dom.module.select(".chart-data-container"),
        this.dom.content
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.dom.line = this.dom.content
                    .selectAll(".chart-occurrence-line");
        this.dom.rects = this.dom.content
                    .selectAll(".chart-occurrence-rect");
        this.render();
    }

    /**

    */
    SingleOccurrenceChart.prototype.redraw = function() {
        this.render();
    }

    /**
    
    */
    SingleOccurrenceChart.prototype.remove = function() {
        var e=["occurrence-line","occurrence-rect","occurrence-text"];
        for(var i=0,n=e.length;i<n;i++)
            this.dom.content.selectAll(".chart-"+e[i]).remove();
        this.dom.content.remove();
        this.dom.module.remove();
    }

    return SingleOccurrenceChart;

})(Flog2);
