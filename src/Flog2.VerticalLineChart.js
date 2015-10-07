/**
Vertical Line chart
*/
Flog2.VerticalLineChart = (function(base) {
    extend(base, VerticalLineChart);

    /** @constructor */
    function VerticalLineChart (c) {
        this.data = c.data||{};

        this.title = c.title||null;
        this.name = c.name||"undefined";
        this.cls = c.cls||c.name;
        this.parent = c.parent||null;            // Is set later

        this.column = c.column||null;            // data column name

        this.margins(c.margin);                  // NN or {top:NN...}
        this.width = c.width||100;               // Inner width 
        this.height = c.height||null;            // Inner height (without header and footer)

        this.offsetLeft = c.offsetLeft||0;
        this.offsetTop = c.offsetTop||0;

        this.minDepth = c.minDepth||null;
        this.maxDepth = c.maxDepth||null;

        this.minValue = c.minValue||0;           
        this.maxValue = c.maxValue||null;        // If null, maxValue is calculated from given data
        
        this.headerHeight = c.headerHeight||50;
        this.footerHeight = c.footerHeight||0;

        this.axes = c.axes||[];
        this.guides = c.guides||[];

        this.pointType = c.pointType||"circle";  // Which point type it is: "circle" or "rect"
        this.pointSize = c.pointSize||5;

        this.styles={
            "vlc-point": "stroke-width:0.5px;stroke:#000;fill:#FFA500;cursor:pointer;",
            "vlc-line": "stroke-width:1px;stroke:#333;fill:none;",
            "vlc-title": "font-family:arial;font-size:10px",
            "vlc-sliding-label-txt": "font-weight:bold;font-family:arial;font-size:10px;text-anchor:left;"
        };
        this.style(c.styles);

        this.X = c.X||null;
        this.Y = c.Y||null;

        this.dom = {module:null, content:null, path:null, points:null, listener:null,
                   label_g:null, label_rect:null, label_txt:null};

        // 
        this.beyond = {};

        // Variables for sticking labels
        this.labelData = [];
        this.labelLastY = null;
        this.labelPos = null;
        this.labelRenderTimeout = 0;
        this.isMouseDown = false; // to limit label calulation on drag
    }

    /**

    */
    VerticalLineChart.prototype.setLabelPoint = function (d) {
         this.labelData.push([
             this.Y(d[0]), this.X(d[2]), this.Y(d[1]), (+d[2]).toFixed(2) ]);
    }

    /**

    */
    VerticalLineChart.prototype.setLabelPoints = function () {
        this.labelData.length = 0; // empty the array
        if(this.data.length < 1) return;
        this.setLabelPoint([
            this.maxDepth,
            this.data[this.data.length-1].depth,
            this.data[this.data.length-1][this.column]
        ]);
        // Descending depth values array (towards ground) [300,200,100,..]
        for(var i=this.data.length;i--;) {
            if(i < 1) break;
            this.setLabelPoint([
                (+this.data[i].depth + +this.data[i-1].depth) / 2,
                this.data[i-1].depth,
                this.data[i-1][this.column]
            ]);
        }
        this.setLabelPoint([
            this.minDepth,
            null,
            null
        ]);
    }

    VerticalLineChart.prototype.offsetY = function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        return e.clientY - target.getBoundingClientRect().top;
    }

    /**

    */
    VerticalLineChart.prototype.eventLabelShow = function(){
        // Zooming might give give zoom handler 
        // as event target on redraw
        // Also skip calculation when draw event 
        // occurs in the form of holding mousedown
        if(d3.event == null 
        || "function" === typeof d3.event.target 
        || this.isMouseDown
        || this.labelData.length == 0)
            return;
        this.labelLastY = this.offsetY(d3.event);
        this.dom.label_g.attr("display", null);
        // iter from ground to depth
        for(var i=this.labelData.length;i--;) {
            if(this.labelLastY < this.labelData[i][0]) continue;  //labeldata [x_line, x, y, value]
            this.lastPos = i-1;
            break;
        }
    }

    /**

    */
    VerticalLineChart.prototype.eventLabelMove = function () {
        if(this.labelRenderTimeout < 2) {
            this.labelRenderTimeout++; 
            return;
        } else 
            this.labelRenderTimeout = 0;
        
        if(this.labelData.length < 1 || this.isMouseDown) {
           this.eventLabelHide();
           return;
        }

        var offsetY = this.offsetY(d3.event),
            relMovement = offsetY - this.labelLastY,
            j=null;
        if(relMovement < 0) { // direction up
            try {
            for(var i=this.labelData.length - this.lastPos, n=this.labelData.length; i<n; i++) {
                if(offsetY < this.labelData[i][0]) continue; //[300,200,100]
                j = (i - 1 >= 0) ? i - 1 : 0; // Get index
                break;
            } } catch (e) {this.eventLabelShow();return;}
        } else { // direction down
            try {
            for(var i=this.lastPos+1;i--;) {
                if(offsetY > this.labelData[i][0]) continue;
                j=i;
                break;
            } } catch (e){this.eventLabelShow();return;}
        }
        if(j!=null) {
            try{
                this.dom.label_txt.text(this.labelData[j][3]);

                var b = this.dom.label_txt[0][0].getBBox();
                this.dom.label_rect
                    .attr("width", b.width)
                    .attr("height", b.height);
            }catch(e){ // Label was hidden
                //console.log(e)
                this.eventLabelShow();
            }
            this.dom.label_g
                .attr("transform", "translate("+
                (this.labelData[j][1]+this.offsetLeft)+","+
                this.labelData[j][2]+")");
        }
        this.labelPos = j;
        this.labelLastY = offsetY;
    }

    /**

    */
    VerticalLineChart.prototype.eventLabelHide = function () {
        this.labelPos = null;
        this.dom.label_g.attr("display", "none");
    }

    /**

    */
    VerticalLineChart.prototype.labelRender = function () {
        if(!d3.select(".vlc-sliding-label").empty()) {
            this.dom.label_g = d3.select(".vlc-sliding-label");
            this.dom.label_rect = this.dom.label_g.select("rect");
            this.dom.label_txt = this.dom.label_g.select("text");
            return;
        }
        // Labelbox
        this.dom.label_g = d3.select("#"+this.chartId+"-chart-content")
            .append("g")
            .attr("class", "vlc-sliding-label")
            .attr("display", "none")
            .style("pointer-events", "none");

        this.dom.label_rect = this.dom.label_g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0)
            .style("fill", "#eee")
            .style("pointer-events", "none");

        this.dom.label_txt = this.dom.label_g.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .attr("class", "vlc-sliding-label-txt")
            .attr("style", this.styles["vlc-sliding-label-txt"])
            .style("pointer-events", "none")
            .style("text-anchor", "start");
    }


    /**
    Module dataformatter
    */
    VerticalLineChart.prototype.dataFormatter = function() {
        this.beyond = {top:{depth: null, value: null}, 
                      base:{depth: null, value: null}};
        this.minValue = 0; 
        this.maxValue = 0;
        this.data = this.data.filter(function(d){
             // Is string empty? And inside depth limits
            if(!!d[this.column]) { 
                if(+d.depth >= this.minDepth
                && +d.depth <= this.maxDepth) {
                    if(this.maxValue < +d[this.column])
                        this.maxValue = +d[this.column];
                    if(this.minValue > +d[this.column])
                        this.minValue = +d[this.column];
                    return true;
                }
                // Save records outside depth limits for later use
                if(d.depth < this.minDepth 
                && (d.depth > this.beyond.top.depth 
                    || this.beyond.top.depth == null))
                    this.beyond.top = {depth: d.depth, 
                                       value: +d[this.column]};
                if(d.depth > this.maxDepth 
                && (d.depth < this.beyond.base.depth
                    || this.beyond.base.depth == null))
                    this.beyond.base = {depth: d.depth, 
                                        value: +d[this.column]};
            }
            return false;
        }.bind(this));
    }

    /** 
        Calculate anchor points for paths when chart data continues
        to 
    */
    VerticalLineChart.prototype.getEndPoint = function (i, j) {
        return +this.data[j][this.column] - 
            (+this.data[j].depth - 
                (i == "top" ? +this.minDepth : +this.maxDepth)) * 
            (+this.data[j][this.column] - +this.beyond[i].value) / 
            (+this.data[j].depth - +this.beyond[i].depth);
    }

    /**

    */
    VerticalLineChart.prototype.render = function () {
        this.dataFormatter();
        this.X = this.scaler(0, this.width, this.minValue, this.maxValue);

        var t = this,
            row_ = [],
            _row = [];

        // Top continuation point
        if(this.beyond.top.depth != null
        && this.data.length > 0) {
            row_[0] = {depth: this.minDepth};
            row_[0][this.column] = this.getEndPoint("top", 0);

            if(row_[0][this.column] > this.maxValue)
                this.maxValue = row_[0][this.column];
            if(row_[0][this.column] < this.minValue)
                this.minValue = row_[0][this.column];
        }
        // Base continuation point
        if(this.beyond.base.depth != null 
        && this.data.length > 0) {
            _row[0] = {depth: this.maxDepth}; 
            _row[0][this.column] = this.getEndPoint("base", this.data.length-1);

            if(_row[0][this.column] > this.maxValue)
                this.maxValue = _row[0][this.column];
            if(_row[0][this.column] < this.minValue)
                this.minValue = _row[0][this.column];
        }

        this.X = this.scaler(0, this.width, this.minValue, this.maxValue);
        this.setLabelPoints();

        this.path = d3.svg.line()
            .x(function(d){return t.X(+d[t.column])})
            .y(function(d){return t.Y(d.depth)});

        this.dom.path = this.dom.path.data([row_.concat(this.data.concat(_row))]);
        this.dom.path.attr("d", this.path(row_.concat(this.data.concat(_row))))
            .attr("class", "vlc-line")
            .attr("style", this.styles["vlc-line"])
            .style("pointer-events", "none");
        this.dom.path.enter().append("svg:path")
            .attr("d", this.path(row_.concat(this.data.concat(_row))))
            .attr("class", "vlc-line")
            .attr("style", this.styles["vlc-line"])
            .style("pointer-events", "none");

        row_ = null; 
        _row = null;
        
        this.dom.path.exit().remove();

        // When point type is changed then 
        // old points need to be removed
        // before new ones enter
        if(this._def(this.dom.points) 
        && this._def(this.dom.points[0]) 
        && this._def(this.dom.points[0][0])
        && this.dom.points[0][0].tagName != this.pointType) {
            this.dom.points = this.dom.points.data([]);
            this.dom.points.exit().remove();
        }
        this.dom.points = this.dom.points.data(this.data);
        this.dom.points.enter().append(this.pointType);
        
        if(this.pointType == "circle") {
            this.dom.points
                .attr("cx", function(d){return t.X(d[t.column])})
                .attr("cy", function(d){return t.Y(d.depth)})
                .attr("class", "vlc-point")
                .attr("style", this.styles["vlc-point"])
                .attr("r", this.pointSize / 2)
                .style("pointer-events", "none");
        } else {
            this.dom.points
                .attr("x", function(d) {return t.X(d[t.column]) - t.pointSize / 2})
                .attr("y", function(d) {return t.Y(d.depth) - t.pointSize / 2})
                .attr("width", this.pointSize)
                .attr("height", this.pointSize)
                .attr("class", "vlc-point")
                .attr("style", this.styles["vlc-point"])
                .style("pointer-events", "none");
        }
        this.dom.points.exit().remove();
   }

    /**

    */
    VerticalLineChart.prototype.draw = function () {
        this.Y = this.Y||this.scaler(0, this.height, this.minDepth, this.maxDepth);
        
        // Title
        this.dom.module.append("text")
            .text(this.title)
            .attr("x", this.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("class", "vlc-title")
            .attr("style", this.styles["vlc-title"])
            .style("pointer-events", "none");

        // Inner container
        this.dom.content = this.dom.module.append("g")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", "chart-data-container")
            ;

        // Dummy rect to fill g area so there wouldn't be "holes"
        // of empty space in g area where g listeners aren't active
        this.dom.listener = this.dom.content.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill-opacity", 0)
            .attr("class", "vlc-label-listener-rect")
            .attr("id", "module-listener-rect-"+this.id)
            .on("mouseover.vlc", this.eventLabelShow.bind(this))
            .on("mousemove.vlc", this.eventLabelMove.bind(this))
            .on("mouseout.vlc", this.eventLabelHide.bind(this))
            .on("mousedown.vlc", function(){this.isMouseDown = true}.bind(this))
            .on("mouseup.vlc", function(){this.isMouseDown = false}.bind(this));
        
        this.dom.path = this.dom.content.selectAll("path");
        this.dom.points = this.dom.content.selectAll(".vlc-point");

        // Draw chart
        this.render();

        // Draw axis
        this.axes=[new Flog2.Axis({
            direction: "top",
            parent: this.parent+" > .chart-data-container",
            scale: this.X,
            n_ticks: 5,
            tickSize: -this.height,
            minorTickSize: -this.height
        })];
        this.axes[0].dom.module = this.dom.content;
        this.axes[0].draw();

        this.data = null;

        this.labelRender();
    }

    /**

    */
    VerticalLineChart.prototype.redraw = function () {
        this.dom.content
            .attr("width", this.width)
            .attr("height", this.height);
        this.dom.listener
            .attr("width", this.width)
            .attr("height", this.height);
        this.dom.path.style("fill", "none");
        this.render();
        this.axes[0].scale = this.X,
        this.axes[0].tickSize = -this.height,
        this.axes[0].minorTickSize = -this.height,
        this.axes[0].redraw();
        this.data=null;

        // There might be better way dealing with this
        if(this.labelPos!=null && !this.isMouseDown) {
            this.eventLabelHide();
            this.eventLabelShow();
        }
        this.dom.listener[0][0].parentNode.appendChild(this.dom.listener[0][0]);

    }

    /**

    */
    VerticalLineChart.prototype.remove = function() {
        this.axes[0].remove();
        //this.dom.label_g.remove();
        //this.dom.label_rect.remove();
        //this.dom.label_txt.remove();
        this.dom.path.selectAll("path").remove();
        this.dom.path.remove();
        this.dom.points.selectAll(".vlc-point").remove();
        this.dom.listener
            .on(".vlc", null);
        this.dom.listener.remove();
        this.dom.content.remove();
        this.dom.module.remove();
        this.data=null;
    }

    return VerticalLineChart;

})(Flog2);
