/**
AxisSectionBox
*/
Flog2.AxisSectionBox = (function(base){
    extend(base, AxisSectionBox);

    /** @constructor */
    function AxisSectionBox(c) {
        this.width = c.width||20;
        this.height = c.height||0;
        this.maxDepth = c.maxDepth||0;
        this.Y = c.Y;
        this.cls = c.cls||"axis_sectionbox";
        this.margins(c.margin||{});

        this.styles = {
            "axis-sectionbox-rect": "fill:rgb(200,200,200);stroke-width:1;stroke:rgb(0,0,0)"
        }
        this.style(c.styles);

        this.dom = {module: null};
    }

    /**

    */
    AxisSectionBox.prototype.render = function() {
        var t = this;
        this.dom.rects = this.dom.rects.data([this.height]);
        this.dom.rects.enter().append("rect");
        this.dom.rects
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", function(d){return t.scale(t.maxDepth)})
            .attr("class", "axis-sectionbox-rect")
            .attr("style", this.styles["axis-sectionbox-rect"]);
        this.dom.rects.exit().remove();
    }

    /**

    */
    AxisSectionBox.prototype.draw = function() {
        this.dom.rects = this.dom.module.selectAll("rect");
        this.render();
    }

    /**

    */
    AxisSectionBox.prototype.redraw = function() {
        this.render();
    }

    AxisSectionBox.prototype.remove = function() {
        this.dom.module.selectAll("rect").remove();
        this.dom.module.remove();
    }

    return AxisSectionBox;

})(Flog2);
