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
    SingleOccurrenceChart.prototype.dataFormatter = function() {
        this.depthTop = false;
        this.depthBase = false;

        this.data = this.data.filter(function(d) {
            if(d[this.column] == 0) 
                return false;
            if(!this.depthTop)
                this.depthTop = d.depth < this.minDepth ? this.minDepth : (d.depth > this.maxDepth ? this.maxDepth : d.depth);
            this.depthBase = d.depth < this.minDepth ? this.minDepth : (d.depth > this.maxDepth ? this.maxDepth : d.depth);

            return d.depth <= this.maxDepth && d.depth >= this.minDepth;
        }.bind(this));
    }

    /**

    */
    SingleOccurrenceChart.prototype.render = function() {
        this.dataFormatter();
        var t=this;

        // lines
        this.dom.line = this.dom.line
                    .data([{"top": this.depthTop, 
                           "base": this.depthBase}]);
        this.dom.line.enter().append("line");
        this.dom.line
            .attr("x1", 3)
            .attr("x2", 3)
            .attr("y1", function(d) {return t.Y(+d.top)})
            .attr("y2", function(d) {return t.Y(+d.base)})
            .attr("class", "chart-occurrence-line")
            .attr("style", this.styles["chart-occurrence-line"]);
        this.dom.line.exit().remove();

        // rects
        this.dom.rects = this.dom.rects.data(this.data);
        this.dom.rects.enter().append("rect");
        this.dom.rects
            .attr("x", this.offset_left)
            .attr("y", function(d) {return t.Y(+d.depth) - 2})
            .attr("width", 6)
            .attr("height", 6)
            .attr("class", "chart-occurrence-rect")
            .attr("style", function(d){
                 return t.styles["chart-occurrence-rect"+(d[t.column] < 0 ? "-filled" : "")]
            });
        this.dom.rects.exit().remove();
        
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
