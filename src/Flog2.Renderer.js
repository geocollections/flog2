/**
Flog2 renderer module. Manages rendering process.
*/
Flog2.Renderer = (function(base, dataformatter) {
    extend(base, Renderer);
    extend(dataformatter, Renderer, "df");
    
    /** @constructor  */
    function Renderer (c, data) {

        if(!c || !data) {
            alert("Flog 2 chart missing: "+(c?"":" *config")+(data?"":" *data"));
            return;
        }
        this.c = c||{};                                    // Config object
        this.data = data;                                  // Input data array
        this.dataStr = "";                                 // dataToStr() fills this array
        this.dataDelimiter = c.dataDelimiter||",";         // Data-as-string data delimiter: tab, semicolon, comma
        this.METADATA_COLUMNS = ["ID","sample_id","sample_number","depth","depth_to","depth_from","_F2AxisSampleStep"];
        this.COLUMNS = d3.keys(data[0]);                   // All column headers array
        this.DATA_COLUMNS = [];                            // Data column names array
        this.setDataColumnsList();                         // Fills DATA_COLUMNS array with data column names

        this.title = c.title||"Untitled";                  // Chart title
        this.name = c.name||"undefined";                   // Chart name - use [a-z0-9]
        this.cls = c.cls||this.name;                       // Class name if defined otherwise name property is used (optional)
        this.id = this.cls;

        this.parent = c.parent||null;                      // Parent container chart svg is attached to. Name str or obj reference.

        this.dataFormatter = c.dataFormatter||"default";   // DataFormatter method (used to format input data) name (optional)

        this.margins((c.margin||10));                      // Chart outer margins. NN or {top:NN,bottom:NN,left:NN,right:NN} (optional)

        this.outerWidth = c.width||null;                   // Chart outer width. Not used if innerHeight is set. (optional)
        this.outerHeight = c.height||null;                 // Chart outer height. (optional)
        this.chartHeight = c.chartHeight||null;            // Chart content area height in px (optional)
        this.chartHeightmm = c.chartHeightmm||null;        // Chart content area height in mm (optional)

        this.chartScale = c.chartScale||null;              // Chart scale (optional)
        this.roundScale = c.roundScale||true;              // (1:1000) rather than (1:1000.34) ?

        this.headerHeight = c.headerHeight||0;             // Chart header height (optional)
        this.footerHeight = c.footerHeight||0;             // Chart footer height (optional)

        this.axes = c.axes||[];
        this.axesDefault = [                               // If rulers are not specified, use default set of rulers
            {type:"AxisDefault"},
            {type:"AxisSectionBox"},
            {type:"AxisSample"}
        ];

        this.guides = c.guides||[];                        // Depth Guidelines 
        
        this.charts = c.charts||[];                        // If subchart config is given, use it
        this.numCharts = c.numCharts||5;                   // Used when chart array is left empty meaning no config is given for charts.

        this.contentPadding = c.contentPadding||20;        // Space between subcharts in px
        
        this.svg = c.svg||{};                              // If there"s d3 set of svg elements given, include them otherwise empty object

        this.hooks = c.hooks||{};

        this.contentOffsetTop = c.contentOffsetTop || 0;                         // Height from where the subchart area begins

        // --- --- --- --- --- --- --- ---

        this.maxHeaderHeight = 0;                          // Greatest header height of subcharts and rulers included - see getProportions() method
        this.maxFooterHeight = 0;                          // Greatest footer height of subcharts and rulers included - see getProportions() method

        this.heightOverhead = null;

        this.styles={};
        this.style(c.styles);

        this.dom = {svg:null, content:null, title:null};

        this.drag = {};

        this.draw();
    }

    /** 
    Get data columns list
    */
    Renderer.prototype.setDataColumnsList = function () {
        for(var i=0,n=this.COLUMNS.length;i<n;i++)
            if(this.METADATA_COLUMNS.indexOf(this.COLUMNS[i])==-1)
                this.DATA_COLUMNS.push(this.COLUMNS[i]);
    }

    /** 
    Chart drawing function
    */
    Renderer.prototype.draw = function () {
        // Get etalon value
        this.getEtalon();

        // Create data string representation
        this.dataToString();

        // Choose input data formatter method
        if(!this._def( this["df_"+this.dataFormatter] ))
            this.dataFormatter = "default";
        
        // Call data formatter method
        this["df_"+this.dataFormatter]();

        // If no axes specified, add default axes
        if(this.axes.length < 1)
            this.axes = this.axesDefault;    
        // Set isVisible parameter to all axis config
        for(var i=this.axes.length;i--;) {
            this.axes[i].isVisible = this.axes[i].isVisible||true;
        }
        // Set default charts if not configured
        if(this.charts.length < 1) {
            var i=0,j=0,
                n=this.COLUMNS.length;
            while(i<this.numCharts && j<n) {
                j++;
                if(this.METADATA_COLUMNS.indexOf(this.COLUMNS[j-1])!=-1)
                    continue;
                this.charts.push({
                    type: "VerticalLineChart",
                    title: this.COLUMNS[j-1],
                    column: this.COLUMNS[j-1],
                    name: "chart-"+i
                });
                i++;
            }  
        }

        // main elements        
        this.dom.svg = d3.select(this.parent).append("svg")
            .attr("id", this.id+"-chart-container")
            .attr("overflow", "visible");

        this.dom.content = this.dom.svg.append("g")
           .attr("overflow", "visible")
           .attr("id", this.id+"-chart-content");
        
        this.dom.content.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "content-listener-filler")
            .style("fill-opacity", 0);

        // Create content objects so their default
        // config parameters such as
        // dimensions (header, footer) could be read.
        // TODO: Also hooks could be included in content
        // object constructor.
        this.initObjects("axes");
        this.initObjects("charts");
        
      

        // Calculate widths and lengths
        this.getProportions();

        // Set content vertical offset
        this.dom.content.attr("transform", "translate(0,"+this.contentOffsetTop+")");
        
        this.setObjects("axes");
        this.setObjects("charts");

        // Get Guides
        if(this.guides.length > 0) {
            this.initObjects("guides");
            this.setGuides();
        }
        
        // Add chart title
        this.dom.title = this.dom.svg.append("text")
            .text(this.title+" (1:"+this.getChartScale()+")")
            .attr("x", this.outerWidth / 2)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("class", "flog2-title")

        // Main events
        this.zoom = this.eventZoomListener();
        this.dom.content
            //.on("dblclick", this.eventZoom.bind(this))
            .call(this.zoom)
            .on("mousedown.zoom", null)
            //.on("touchstart.zoom", null)
            //.on("touchmove.zoom", null)
            //.on("touchend.zoom", null);
            .on("mousedown.drag", this.eventDragStart.bind(this))
            .on("mousemove.drag", this.eventDrag.bind(this))
            .on("mouseup.drag", function(){this.drag.depth = null}.bind(this))

            .on("mouseout.slider", this.guides[0].eventSlider.bind(this.guides[0]))
            .on("mousemove.slider", this.guides[0].eventSlider.bind(this.guides[0]));
            
        window.addEventListener("beforeunload", this.remove.bind(this), false);
    }

    /**
    Redraw Flog2 chart
    */
    Renderer.prototype.redraw = function () {
        this.doHooks("before_redraw");

        if(isNaN(this.chartHeightmm))
            this.chartHeightmm = null;
        if(isNaN(this.chartHeight))
            this.chartHeight = null;
        if(isNaN(this.outerHeight))
            this.outerHeight = null;

        // Set zoom limits
        if(this.minDepth < this.oMinDepth)
            this.minDepth = this.oMinDepth;
        if(this.maxDepth > this.oMaxDepth) 
            this.maxDepth = this.oMaxDepth;

        // Reset header and footer properties
        this.maxHeaderHeight = 0;
        this.maxFooterHeight = 0;

        this.getProportions();

        this.Y
            .range([0, this.chartHeight])
            .domain([this.minDepth, this.maxDepth]);

        this.setObjects("axes");
        this.setObjects("charts");

        this.setProportions();

        this.chartScale = this.getChartScale();
        this.dom.title
            .attr("x", this.width / 2)
            .text(this.title + " (1:" +this.chartScale+")");

        this.setGuides();

        this.doHooks("after_redraw");
    }

    Renderer.prototype.getHeights = function () {
        // this.contentOffsetTop represents content offset from top
        this.contentOffsetTop = this.headerHeight + this.maxHeaderHeight;

        this.heightOverhead = (this.margin.top||0) +
		                (this.headerHeight||0) + 
		                (this.maxHeaderHeight||0) + 
		                (this.maxFooterHeight||0) +
		                (this.footerHeight||0) +
		                (this.margin.bottom||0);

        // chartScale is above the others
        if(this.chartScale) {
            if(this.roundScale) this.chartScale = Math.round(this.chartScale);
            this.chartHeightmm = (this.maxDepth - this.minDepth) * 1000 / this.chartScale;
            if(this.outerHeight) {
                this.chartHeight = this.outerHeight - this.heightOverhead;
            // Height based on scale only. Use coefficents to calculate
            } else { 
                this.chartHeight = this.mm2px(this.chartHeightmm);
                this.outerHeight = this.chartHeight + this.heightOverhead;
            }
        // Height in mm is given and no scale
        } else if(this.chartHeightmm) {
            this.chartScale = (this.maxDepth - this.minDepth) * 1000 / this.chartHeightmm;
            if(this.roundScale) this.chartScale = Math.round(this.chartScale);
            this.chartHeight = this.mm2px(this.chartHeightmm);
            this.outerHeight = this.chartHeight + this.heightOverhead;
        // If only chart content height is given, calculate
        } else if(this.outerHeight) {
            this.chartHeight = this.outerHeight - this.heightOverhead;
            this.chartHeightmm = this.px2mm(this.chartHeight);
            this.chartScale = (this.maxDepth - this.minDepth) * 1000 / this.chartHeightmm;
        } else if(this.chartHeight) {
            this.outerHeight = this.chartHeight + this.heightOverhead;
            this.chartHeightmm = this.px2mm(this.chartHeight);
            this.chartScale = (this.maxDepth - this.minDepth) * 1000 / this.chartHeightmm; 
        // No height params specified. Use window height as chart outer height
        } else {
            this.outerHeight = window.innerHeight;
            this.chartHeight = this.outerHeight - this.heightOverhead;
            this.chartHeightmm = this.px2mm(this.chartHeight);
            this.chartScale = (this.maxDepth - this.minDepth) * 1000 / this.chartHeightmm; 
        }

        this.height = this.outerHeight - 
            this.margin.top - 
            this.margin.bottom;

        this.contentHeight = this.height - this.contentOffsetTop;

        // If scale is not round, round it
        if(this.roundScale 
        && this.chartScale % 1 !== 0) {
            this.chartScale = Math.round(this.chartScale);
            this.getHeights();
        }
    }

    /** 
    Chart height and width calculations.
    */
    Renderer.prototype.getProportions = function () {

        // WIDTH

        this.width = 0;

        // Content overall width excludes inner padding
        // as axes don"t have it
        for(var i=this.axes.length;i--;) {
            var a=this.axes[i];
            this.width += (a.width||0) + 
                (!this._def(a.margin) ? 0 : 
                    (a.margin.left||0) + (a.margin.right||0));
        }

        this.axesAreaWidth = this.width;

        // Get maximum header and footer heights
        var flag = false;
        for(var i = this.charts.length;i--;) {
            var c = this.charts[i],
                hh = (c.headerHeight||0),
                fh = (c.footerHeight||0);

            if(!this._def(c.margin))
                c.margin={left:0, right:0, top:0, bottom:0};

            if(hh > this.maxHeaderHeight)
                this.maxHeaderHeight = hh;
            if(fh > this.maxFooterHeight)
                this.maxFooterHeight = fh;

            this.width += (c.width||0) + 
                (c.margin.left||0) + 
                (c.margin.right||0);

            var isSOC = c.constructor.name == "SingleOccurrenceChart";
            // Use padding only before block of SOC charts
            if(!isSOC || (isSOC && !flag)) 
                this.width += this.contentPadding;
            if(isSOC && !flag) flag = true;
        }

        this.outerWidth = (this.margin.left||0) + 
                           this.width + 
                          (this.margin.right||0);

        // HEIGHT

        this.getHeights();

        // Depth axis scale
        this.Y = this.scaler(0, 
            this.chartHeight, 
            this.minDepth, 
            this.maxDepth);
    }

    /** 
    Re-position content modules after re-configuring the chart area
    */
    Renderer.prototype.setProportions = function () {
        // Set outmost containers' dimensions
        this.dom.svg
            .attr("width", this.outerWidth)
            .attr("height", this.outerHeight);
        this.dom.content
            .attr("width", this.width)
            .attr("height", this.height);
        d3.select(".content-listener-filler")
            .attr("width", this.width)
            .attr("height", this.height-this.contentOffsetTop);
        // Re-position axis modules
        var offset_left = 0;
        for(var i=0,n=this.axes.length;i<n;i++) {
            this.axes[i].dom.module
                .attr("transform",
                "translate("+offset_left+",0)" 
            );
            offset_left += +this.axes[i].width;
        }
        // Re-position chart modules
        this.axesAreaWidth=offset_left;
        for(var i=0, n = this.charts.length; i<n; i++) {
            if(this.charts[i].constructor.name != "SingleOccurrenceChart" 
            || (i!=0 && this.charts[i-1].constructor.name != "SingleOccurrenceChart"))
                offset_left += this.contentPadding;
            this.charts[i].dom.module
                .attr("transform",
                "translate("+offset_left+",0)"
            );
            this.charts[i].offsetLeft = offset_left;
            offset_left+=this.charts[i].width;
        }
    }

    /**
    Iniate instance of class.
    @param {string} - class type
    @param {integer} - position of class prototype in a type list
    */
    Renderer.prototype.initObject = function (type, i) {
        var c = this[type][i];
        // Initiate object
        if(!this._def(c.type))
            c.type = c.constructor.name;
        if(this._def(window.Flog2[c.type])) {
            if(!(c instanceof window.Flog2[c.type])) {
                this[type][i] = new window.Flog2[c.type](c);
            }
        } else {
            console.log(type+" with type "+
                c.type+" not found");
        }
        // object id
        this[type][i].id = type+"-"+i;
        this[type][i].dom = {};

        // Add parent node
        if(type != "guides") {
            this[type][i].dom.module = this.dom.content
                .append("g")
                .attr("overflow", "visible")
                .attr("class", "module-container module-"+type+"-"+i);
        }

        // Activities before content rendering 
        // For example rendering footer and-or header areas
        // to get dynamic height properties
        if("function" == typeof this[type][i].preContentRender)
            this[type][i].preContentRender();
        this.doHooks("after_initobject");
    }

    /** 
    Initiate all objects of given type
    */
    Renderer.prototype.initObjects = function(type) {
        if(!this._def(this[type])) return;
        for(var i=0, n=this[type].length; i<n; i++)
            this.initObject(type, i);
    }

    /**
    Hide / show object that has isVisible attribute
    */
    Renderer.prototype.toggleObjectVisibility = function (obj) {
        // If object is visible but has width = 0, get it from 
        obj.dom.module.attr("display", obj.isVisible ? null : "none");
        if(obj.isVisible 
        && obj.width == 0 
        && obj.oWidth != null) {
            obj.width = obj.oWidth;
            obj.oWidth = null;
        }
        if(!obj.isVisible 
        && obj.width != 0 
        && obj.oWidth == null) {
            obj.oWidth = obj.width;
            obj.width = 0;    
        }
    }

    /** 
    Content object rendering.
    @param {type} - in plural: charts, axes
    @param {object} - content object
    @param {integer} - offset from left side of chart area in px
    */
    Renderer.prototype.setObject = function (type, obj, offset_left) {
        obj.up = this;
        obj.offsetLeft = offset_left;
        obj.offsetTop = this.contentOffsetTop;
        obj.minDepth = this.minDepth;
        obj.maxDepth = this.maxDepth;
        obj.height = this.contentHeight - this.maxFooterHeight;
        obj.margin = obj.margin||{};
        obj[type=="charts"?"Y":"scale"] = this.Y;
        if("data" in obj && !("src" in obj))
            obj.data = this.data;
        
        var attr = {
            transform: "translate("+offset_left+",0)",
            width: obj.width
        }
        if(type == "axes") 
            attr.overflow = "visible";
        for(var k in attr)
            obj.dom.module.attr(k, attr[k]);

        // If chart.parent dom object doesn't have id
        // then it means that it hasn't been drawn yet
        if(!this._def(obj.dom.module) 
        || !obj.dom.module.attr("id")) {
            obj.dom.module.attr("id", "module-"+obj.id);
            obj.chartId = this.id;
            obj.draw();
            if("isVisible" in obj)
                this.toggleObjectVisibility(obj);
        } else {
            if("isVisible" in obj) {
                this.toggleObjectVisibility(obj);
                if(!obj.isVisible) return;
            }
            obj.redraw();
        }
    }

    /**
    Content object list rendering
    */
    Renderer.prototype.setObjects = function (type) {
        if(!(type in this)) {
            console.error("Renderer.setObjects: "+type+" is not correct object type");
            return;
        }
        var offset_left = this.axesAreaWidth + 
            this.contentPadding;
        var flag = false;
        for(var i=0, n=this[type].length; i < n; i++) {
            var obj = this[type][i];
            obj.name = type+"-"+i;
            this.setObject(type, obj, offset_left);
            offset_left += obj.width;

            var isSoc = obj.constructor.name == "SingleOccurrenceChart";
            if(!isSoc || (isSoc && !flag)) 
                offset_left += this.contentPadding;
            if(isSoc && !flag) flag = true;
            delete obj; // delete reference to the object
        }
    }

    /**
    Render guide
    @param {object} - guide object
    */
    Renderer.prototype.setGuide = function (guide) {
        guide.width = this.width; 
        guide.height = this.chartHeight;
        if(!this._def(guide.parent)
        || guide.parent == null) {
            guide.parent = this.id+"-chart-content";
            guide.Y = this.Y;
            guide.draw();
        } else {
            guide.Y.range([0, this.chartHeight])
                .domain([this.minDepth, this.maxDepth]);
            guide.redraw();
        }
    }

    /**
    Render guide array
    */
    Renderer.prototype.setGuides = function () {
        for(var i=0, n=this.guides.length; i<n; i++) {
             this.setGuide(this.guides[i]);
        }
    }

    /** 
    Zoom event listener
    */
    Renderer.prototype.eventZoomListener = function () {
        var t=this;
        return d3.behavior.zoom()
            .y(t.Y)
            .scaleExtent([0.1, 10])
            .on("zoom", function() {
                return this.eventZoomHandler();
            }.bind(this));
    }

    /**
    Zoom handler
    */
    Renderer.prototype.eventZoomHandler = function () {
        // Avoid going below 1:1 with scaling 
        if(Math.floor(this.chartScale) <= 1 
        && this.zoom.scale() >= 1) {
            return;
        }
        this.minDepth = this.Y.domain()[0];
        this.maxDepth = this.Y.domain()[1];
         
        this.redraw();
        this.zoom.y(this.Y);
    }

    Renderer.prototype.eventDragStart = function() {
        d3.event.preventDefault();
        this.drag.depth = this.Y.invert(
            d3.mouse(this.dom.content[0][0])[1]);
    }

    Renderer.prototype.eventDrag = function() {
        if(this.drag.depth==null) return;
        if(this.skip<2) {
            this.skip++;
            return;
        } else 
            this.skip=0;

        this.extent = this.Y.domain()[1] - this.Y.domain()[0];
        this.minDepth -= (this.Y.invert(d3.mouse(this.dom.content[0][0])[1]) - this.drag.depth);
        this.maxDepth = this.minDepth + this.extent;

        if(this.minDepth < this.oMinDepth) {
            this.minDepth = this.oMinDepth;
            this.maxDepth = this.minDepth + this.extent;
        }
        else if(this.maxDepth > this.oMaxDepth) {
            this.maxDepth = this.oMaxDepth;
            this.minDepth = this.maxDepth - this.extent;
        }

        this.redraw();
    }

    Renderer.prototype.remove = function (event) {
        event.preventDefault();
        if(this._def(this.dom))
		    this.dom.content
		        .on(".slider", null)
		        .on(".drag", null)
		        .on(".zoom", null);
        for(var i=this.charts;i--;)
            this.charts[i].remove();
        for(var i=this.axes;i--;)
            this.axes[i].remove();
        for(var k in this.dom)
            this.dom[k] = null;
        for(var i=this.guides;i--;)
            this.guides[i].remove();
        this.data = null;
        this.dataStr = null;
        this.zoom = null
    }

    return Renderer;

})(Flog2, Flog2.DataFormatter);
