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

        this.point = c.point||{type:"rect", size:6};

        this.styles = {
            "chart-occurrence-text":"transform:rotate(-90);text-anchor:end;font-family:arial;font-size:10px",
            "chart-occurrence-line":"stroke:#000;stroke-width:1px;z-index:100;shape-rendering:crispEdges;",
            "chart-occurrence-point":"stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;",
            "chart-occurrence-point-filled":"fill:#fff;stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;"
        }
        this.style(c.styles);

        this.data = [];

        this.dom = {module:null, content:null, text:null, lines:null, points:null};
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
        this.depthTop = null;
        this.depthBase = null;

        this.data = this.data.filter(function(d) {
            if(d[this.column] == 0) 
                return false;
            if(this.depthTop == null)
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
        this.dom.lines = this.dom.lines
            .data([{"top": this.depthTop, 
                    "base": this.depthBase}]);
        this.dom.lines.enter().append("line");
        this.dom.lines
            .attr("x1", (this.width) / 2)
            .attr("x2", (this.width) / 2)
            .attr("y1", function(d) {return t.Y(+d.top)})
            .attr("y2", function(d) {return t.Y(+d.base)})
            .attr("class", "chart-occurrence-line")
            .attr("style", this.styles["chart-occurrence-line"]);
        this.dom.lines.exit().remove();

        // rects
        this.dom.points = this.dom.points.data(this.data);
        this.dom.points.enter().append(this.point.type);
        if(this.point.type == "rect") {
            this.dom.points
                .attr("x", (this.width - this.point.size)/2)
                .attr("y", function(d) {return t.Y(+d.depth) - (t.point.size / 2)})
                .attr("width", this.point.size)
                .attr("height", this.point.size);
        } else if(this.point.type == "circle") {
            this.dom.points
                .attr("cx", this.width / 2)
                .attr("cy", function(d) {return t.Y(+d.depth)})
                .attr("r", this.point.size / 2)
        }

        this.dom.points
            .attr("class", "chart-occurrence-point")
            .attr("style", function(d){
                 return t.styles["chart-occurrence-point"+(d[t.column] < 0 ? "-filled" : "")]
            });

        this.dom.points.exit().remove();
        
        // bottom text
        this.dom.text
            .attr("transform", "translate("+
                (this.width/2+2)+
                ","+(this.Y(this.maxDepth)+10)+")rotate(-90)");
    }

    /**

    */
    SingleOccurrenceChart.prototype.draw = function() {
        this.dom.content = this.dom.module.select(".chart-data-container"),
        this.dom.content
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.dom.lines = this.dom.content
            .selectAll(".chart-occurrence-line");
        this.dom.points = this.dom.content
            .selectAll(".chart-occurrence-point");
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
        var e=["occurrence-line","occurrence-point","occurrence-text"];
        for(var i=0,n=e.length;i<n;i++)
            this.dom.content.selectAll(".chart-"+e[i]).remove();
        this.dom.content.remove();
        this.dom.module.remove();
    }

    return SingleOccurrenceChart;

})(Flog2);
