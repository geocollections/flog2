/**
Flog2

@description: Chart library for displaying geologic data
Institute of Geology at Tallinn University of Technology
http://www.gi.ee

Build: R 04 dets 2015 14:21:53 EET

Licensed under The GNU General Public License v3.0, 
for more information please read the LICENSE.md file in 
this repository or visit the preceding link to the GNU website.
*/

/**
d3.js jsonp plugin.
*/
d3.jsonp = function (url, callback) {
  function rand() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      c = '', i = -1;
    while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
    return c;
  }

  function create(url) {
    var e = url.match(/callback=(\w+)/),//d3.jsonp.(\w+)/),
      c = e ? e[1] : rand();

     //d3.jsonp[c] = function(data) {
    this[c] = function(data) {
        callback(data);
        //delete d3.jsonp[c];
        delete c;
        script.remove();
    };
    //return 'd3.jsonp.' + c;
    return c;
  }

  var cb = create(url),
    script = d3.select('head')
    .append('script')
    .attr('type', 'text/javascript')
    .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
};

/** 
Helper function to facilitate inheritance
*/
function extend(base, sub, prefix) {
    if(prefix) { // rename prototype properties
        for(var k in base.prototype) {
            Object.defineProperty(
                base.prototype,
                prefix+"_"+k,
                Object.getOwnPropertyDescriptor(base.prototype, k));
            delete base.prototype[k];
        }
    }
    var origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (var key in origProto) { sub.prototype[key] = origProto[key]; }
    sub.prototype.constructor = sub;
    Object.defineProperty(sub.prototype, "constructor", { 
        enumerable: false, value: sub });
}

function deepCopy(oldObj) {
    var newObj = oldObj;
    if (oldObj && typeof oldObj === 'object') {
        newObj = Object.prototype.toString.call(oldObj) === "[object Array]" ? [] : {};
        for (var i in oldObj) {
            newObj[i] = deepCopy(oldObj[i]);
        }
    }
    return newObj;
}
/**
Flog2 
*/

var Flog2 = Flog2||{};

/** 
Base module. Shared resources.
*/
Flog2 = (function(){

    /**
    @constructor
    */
    function Flog2 (c, d) {
        this.VERSION = "2.0";

        if(c) 
            return new Flog2.Renderer(c, d);
    }

    /**
    Sugar that dermines if property is undefined
    @param {object} - Property tested
    */
    Flog2.prototype._def = function (v) {
        return "undefined" !== typeof v;
    }

    /**
    Scales units to pixels.
    @param {integer} - Minimum limit value in px 
    @param {integer} - Maximum limit value in px
    @param {integer} - Minimum limit value in irl units
    @param {integer} - Maximum limit value in irl units
    */
    Flog2.prototype.scaler = function (minPx, maxPx, minValue, maxValue) { 
        return d3.scale.linear()
            .range([minPx||0, maxPx])
            .domain([minValue, maxValue]);
    }
    
    /** 
    Sets margin property object for Flog2 object.
    @param {object} - If integer then all margins are set
    to this value. Else if object then object members replace
    default margin members.
    */
    Flog2.prototype.margins = function (c_margin) {
        this.margin = {top:0,bottom:0,left:0,right:0};
        if(c_margin) {
            if(!isNaN(c_margin)) {
                this.margin={top:c_margin,bottom:c_margin,
                    left:c_margin,right:c_margin};
            } else {
                for(var k in c_margin)
                    this.margin[k] = c_margin[k];
            }
        }
    }

    /**

    */
    Flog2.prototype.style = function(c_styles) {
        if(!this._def(this.styles)) {
            this.styles = c_styles||{};
        } else if(this._def(c_styles))
            for(var k in this.styles) {
                if(this._def(c_styles[k]))
                    this.styles[k] = c_styles[k];
            }
    }

    /**
    Rename data keys
    */
    Flog2.prototype.colRenamer = function() {
        if(!"cols" in this || !"data" in this)
            return;
        var t=this, data = [];
        this.data.forEach(function(d){
            for(var k in t.cols) {
                if(t.cols[k] in d)
                    d[k] = d[t.cols[k]];
                delete d[t.cols[k]];                
            }
        });
    }

    /**
    Reorder data column list array
    based on real chart order
    
    Flog2.prototype.colReorderer = function() {
        this.charts.forEach(function(d, i){
            if(this.DATA_COLUMNS.indexOf(d.column) != -1)
                this.DATA_COLUMNS.splice(
                    this.DATA_COLUMNS.indexOf(d.column), 1);
            this.DATA_COLUMNS.splice(i, 0, d.column);
        }.bind(this));
    }
    */

    /**
    Gets mm etalon height
    */
    Flog2.prototype.getEtalon = function() {
        var el = document.getElementById("mm_etalon");
        if(!this._def(el)) {
            console.error("no etalon dom element included in page");
            this.etalon = undefined;
        } else
            this.etalon = el.clientHeight;
    }

    /**
    mm to pixel calculator
    @param {float} - mm
    */
    Flog2.prototype.mm2px = function(mm) {
        //return mm * 3.5433;
        return mm ? mm * 2.834646 : false;
    }

    /**
    Pixel to mm calculator
    @param {integer} - pixel count
    */
    Flog2.prototype.px2mm = function(px) {
        //return px * 0.2822;
        return px ? px * 0.3527777 : false;
    }

    /**
    Calculates chart scale.
    */
    Flog2.prototype.getChartScale = function () {
        var scale = Math.abs(/*Math.round(*/(
                (this.maxDepth - this.minDepth)*1000) / 
                this.px2mm(this.chartHeight)/*)*/).toFixed(2);
        return scale == 0 ? 1 : scale;
    }

    /** 
    Gets value of css transform property string
    @param {string} - css transform instruction as string
    */
    Flog2.prototype.transformParser = function (a) {
        var b={};
        for (var i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g))
        {
            var c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }
        return b;
    }

    /** Generate string representation
    Uses child properties this.data and this.COLUMNS
    @param {string} - data delimiter
    */
    Flog2.prototype.dataToString = function(delimiter) {
        if(!this.COLUMNS||!this.data)
            return [];
        var delimiter=delimiter||this.dataDelimiter||",",
            data=[this.COLUMNS.join(delimiter)], 
            m=this.COLUMNS.length;
        for(var i=0,n=this.data.length;i<n;i++) {
            var d=[];
            for(var j=0;j<m;j++)
                d.push(this.data[i][this.COLUMNS[j]]);
            data.push(d.join(delimiter));
        }
        data = data.join("\n");

        if("undefined" !== typeof this.dataStr)
            this.dataStr = JSON.stringify(data);
        else
            return data;
    }

    /**
    @param {string} - hook name representing its location in the code
    */
    Flog2.prototype.doHooks = function (location) {
        if(!("hooks" in this)||this.hooks == null) return null;
        if(!this._def(this.hooks[location])) return null;
        if(this.hooks[location].length < 1) return null;

        var output = [];
        for(var i=0,n=this.hooks[location].length;i<n;i++) {
            var h=this.hooks[location];
            if(this._def(document[h]))
                output.push({h: document[h].bind(this)(arguments)});
            else if(this._def(window[h])) {
                output.push({h: window[h].bind(this)(arguments)});
            } else {
                var n_l=this.hooks[location][i].split("."), 
                    obj=window;
                for(var j=0,m=n_l.length;j<m;j++)
                    obj = obj[n_l[j]];
                
                output.push({h: obj.bind(this)(arguments)});
            }
        }
        return output;
    }

    return Flog2;

})();

/**
Flog2.DataFormatter
-------------------
Function that re-formats input data
Used in the first phases of rendering pipeline
as well as when input dataset is changed and chart is redrawn.
Formatter used is specified in config object 
Flog2 constructor argument: key "dataFormatter".
If dataFormatter name is not specified in config
object, default dataformatter function named "default" 
is used.
*/
Flog2.DataFormatter = (function() {
    /** @constructor */
    function DataFormatter() {}

    /** Default formatter */
    DataFormatter.prototype.default = function () {
        var hasNeg = this.data.some(function(d){ return d.depth < 0; });
        this.data.forEach(function(d){
            if("depth_to" in d 
            && d.depth_to != null 
            && d.depth_to < d.depth) {
                var x = d.depth;
                d.depth = d.depth_to;
                d.depth_to = x;
            }

            d.depth_from = d.depth;
            if(d.depth != "") 
                d.depth = +d.depth;
            else return;
            if(!("depth_to" in d) 
            || d.depth_to == ""
            || d.depth_to == null)
                d.depth_to = d.depth;
            d.depth = (d.depth + (+d.depth_to)) / 2;
            if(hasNeg) {
                d.depth = -d.depth;
                var d_from = d.depth_from;
                d.depth_from = -d.depth_to;
                d.depth_to = -d_from;
            }
        });

        // Set depth limits only on initialization of the chart 
        // or when dataset limits are changed
        var maxDepth = Math.ceil(d3.max(this.data, function(d) {
                return +d.depth_to > d.depth ? +d.depth_to : d.depth; 
            })),
            minDepth = Math.floor(d3.min(this.data, function(d) { 
                return +d.depth_from < d.depth ? +d.depth_from : d.depth; 
            }));
        if(!this._def(this.maxDepth) 
        || maxDepth != this.oMaxDepth) {
            this.maxDepth = maxDepth;
            this.oMaxDepth = maxDepth;
        }
        if(!this._def(this.minDepth) 
        || minDepth != this.oMinDepth) {
            this.minDepth = minDepth;
            this.oMinDepth = minDepth;
        }
        this.depth = this.maxDepth - this.minDepth;

        this.data.sort(function(a, b){return d3.ascending(a.depth, b.depth);});

        // -- sorting for SOC --
        var val_d = {}, 
            val_l = [],
            meta_l = ["ID","sample_id","sample_number","depth","depth_to","depth_from"];
        this.data.forEach(function(d){
            for(var k in d) {
                if(meta_l.indexOf(k) != -1)
                    continue;
                if(d[k] != 0)
                    val_d[k] = !(k in val_d) ? 
                        {key:k, start:d.depth, end:d.depth} : 
                        {key:k, start:val_d[k].start, end:d.depth};
            }
        });
        for(var k in val_d)
            val_l.push(val_d[k]);    
        val_l.sort(function(a, b){
            return d3.descending(a.end, b.end)||d3.descending(a.start, b.start);
        });
        
        this.COLUMNS = meta_l.concat(val_l.map(function(d){return d.key;}));
        // /-- sorting --
    }

    /**
    Incoming data formatter for chart implementation in chitinozoa.net.
    */
    DataFormatter.prototype.chitinozoa = function () {
        
        // Walk through dataset
        this.data.forEach(function(d){
            if("depth_to" in d 
            && d.depth_to < d.depth) {
                var x = d.depth;
                d.depth = d.depth_to;
                d.depth_to = x;
            }

            d.depth_from = d.depth;
            if(d.depth != "") 
                d.depth = +d.depth;
            else 
                return;
            if(!("depth_interval" in d)
            || d.depth_interval == "")
                d.depth_to = d.depth;
            else {
                d.depth_to = d.depth_interval;
            }
            d.depth = (d.depth + (+d.depth_interval)) / 2;
            if("depth_interval" in d) {
                d.depth_interval = null;
                delete d.depth_interval;
            }
        });
   
        // Set depth limits only on initialization of the chart 
        // or when dataset limits are changed
        var maxDepth = d3.max(this.data, function(d) {return d.depth}),
            minDepth = d3.min(this.data, function(d) {return d.depth});
        if(!this._def(this.maxDepth) 
        || maxDepth!=this.oMaxDepth) {
            this.maxDepth = maxDepth;
            this.oMaxDepth = maxDepth;
        }
        if(!this._def(this.minDepth) 
        || minDepth!=this.oMinDepth) {
            this.minDepth = minDepth;
            this.oMinDepth = minDepth;
        }

        this.depth = this.maxDepth - this.minDepth;
        this.data.sort(function(a,b){return d3.ascending(a.depth,b.depth)});
    }
    // ... 

	DataFormatter.prototype.ermas = function () {
		var hasNeg = this.data.some(function(d){ return d.depth < 0; });

		// Walk through dataset
        this.data = this.data.filter(function(d){
            if(d.depth == "") 
                return false;
            d.depth = +d.depth;
            if(hasNeg) { // specific to ermas
                d.depth = -d.depth;
                d.depth_from = -d.depth_to;
                d.depth_to = d.depth;
            } 
            else {
                if(!("depth_from" in d) 
                || isNaN(+d.depth_from) 
                || d.depth_from == null)
                    d.depth_from = d.depth;
                if(!("depth_to" in d) 
                || d.depth_to == "" 
                || isNaN(+d.depth_to) 
                || d.depth_to == null)
                    d.depth_to = d.depth;
            }
      
            d.depth = (d.depth_from + d.depth_to) / 2;
            return true;
        });

		// Set depth limits only on initialization of the chart 
        // or when dataset limits are changed

        var maxDepth = d3.max(this.data, function(d) { return d.depth; }),
            minDepth = d3.min(this.data, function(d) { return d.depth; });
        if(!this._def(this.maxDepth) || maxDepth!=this.oMaxDepth) {
            this.maxDepth = maxDepth;
            this.oMaxDepth = maxDepth;
        }
        if(!this._def(this.minDepth) || minDepth != this.oMinDepth) {
            this.minDepth = minDepth;
            this.oMinDepth = minDepth;
        }

		this.depth = this.maxDepth - this.minDepth;
		this.data.sort(function(a,b){return d3.ascending(a.depth,b.depth);});
	}

    return DataFormatter;
})();
/**
Flog2 renderer module. Manages rendering process.
*/
Flog2.Renderer = (function(base, dataformatter) {
    extend(base, Renderer);
    extend(dataformatter, Renderer, "df");
    
    /** @constructor  */
    function Renderer (c, data) {

        if(!c){// || !data) {
            alert("Flog 2 chart missing: "+(c?"":" *config"));//+(data?"":" *data"));
            return;
        }

        this.data = data||[];                              // Input data array
        this.dataStr = "";                                 // dataToStr() fills this array
        this.dataDelimiter = c.dataDelimiter||",";         // Data-as-string data delimiter: tab, semicolon, comma
        this.METADATA_COLUMNS = ["ID","sample_id","sample_number","depth","depth_to","depth_from","_F2AxisSampleStep","oDepth"];
        this.COLUMNS = data ? d3.keys(data[0]) : [];                   // All column headers array
        this.DATA_COLUMNS = [];                            // Data column names array

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

        this.maxDepth = c.maxDepth||0;
        this.minDepth = c.minDepth||0;

        this.axes = c.axes||[];
        this.axesDefault = [                               
            {type:"AxisDefault"},
            {type:"AxisSectionBox"},
            {type:"AxisSample"}
        ];
        if(this.axes.length > 0) {
            this.axesDefault.length = 0;
            for(var i = 0,n = this.axes.length;i<n;i++)
                this.axesDefault.push(this.axes[i]);
        }

        this.guides = c.guides||[];                        // Depth Guidelines 
        
        this.charts = c.charts||[];                        // If subchart config is given, use it
        this.chartsConf = c.chartsConf||{};                // Conf object for chart types
        this.chartsDefaultNum = c.chartsDefaultNum||5;     // Used when chart array is left empty meaning no config is given for charts.
        this.chartsDefaultType = c.chartsDefaultType||"VerticalLineChart";  //

        this.spacing = c.spacing||20;                      // Space between subchart blocks in px
        
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

        if(data)
            this.setDataColumnsList();                         // Fills DATA_COLUMNS array with data column names
        
        this.c = deepCopy(this);     // Config object
        this.oguides=[];
        for(var i=0,n=this.guides.length;i<n;i++)
            this.oguides.push(this.guides[i]);      

        if(data) {
            this.dataToString();
        }
        this.draw();        
    }

    /** 
    Get data columns list.
    If config chart column order differs from 
    that of input data, reorder input data.
    */
    Renderer.prototype.setDataColumnsList = function () {
        this.DATA_COLUMNS = [];
        for(var i=0,n=this.COLUMNS.length;i<n;i++)
            if(this.METADATA_COLUMNS.indexOf(this.COLUMNS[i])==-1)
                this.DATA_COLUMNS.push(this.COLUMNS[i]);
        // Re-order columns if needed
        //this.colReorderer();
    }
    

    /** 
    Chart drawing function
    */
    Renderer.prototype.draw = function () {
        // Get etalon value
        //this.getEtalon();

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

        // Breakpoint if chart is loaded without data
        if(this.data.length < 1)
            return;

        // Create data string representation
        //this.dataToString();

        // Choose input data formatter method
        if(!this._def( this["df_"+this.dataFormatter] ))
            this.dataFormatter = "default";
        
        // Call data formatter method
        this["df_"+this.dataFormatter]();

        this.setDataColumnsList();                         // Fills DATA_COLUMNS array with data column names

        // If no axes specified, add default axes
        if(!("axes" in this.c)
        ||this.c.axes.length < 1) {
            for(var i=0,n=this.axesDefault.length;i<n;i++)
                this.axes.push(this.axesDefault[i]);
        }

        // Set isVisible parameter to all axis config
        for(var i=this.axes.length;i--;) {
            this.axes[i].isVisible = this.axes[i].isVisible||true;
        }
        // Set default charts if not configured
        if(this.charts.length < 1) {
            var i=0,j=0,
                n=this.COLUMNS.length;
            while(i < this.chartsDefaultNum && j < n) {
                j++;
                if(this.METADATA_COLUMNS.indexOf(this.COLUMNS[j-1]) != -1)
                    continue;
                this.charts.push({
                    type: this.chartsDefaultType,
                    title: this.COLUMNS[j-1],
                    column: this.COLUMNS[j-1],
                    name: "chart-"+i
                });
                i++;
            }  
        }

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
        this.dom.content.attr(
            "transform", 
            "translate(0,"+this.contentOffsetTop+")"
        );
     
        this.setObjects("axes");
        this.setObjects("charts");

        this.reposition();

        // Get Guides
        if(this.oguides.length > 0) {
            this.guides.length = 0;
            for(var i=0,n=this.oguides.length;i<n;i++)
                this.guides.push(this.oguides[i]);
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
            .on("touchmove.zoom", 
                function(e){e.preventDefault();})
            //.on("touchend.zoom", null);
            .on("mousedown.drag", 
                this.eventDragStart.bind(this))
            .on("mousemove.drag", 
                this.eventDrag.bind(this))
            .on("mouseup.drag", 
                function(){this.drag.depth = null}.bind(this))
        if(this.guides.length > 0)
            this.dom.content
                .on("mouseout.slider", 
                    this.guides[0].eventSlider.bind(this.guides[0]))
                .on("mousemove.slider", 
                    this.guides[0].eventSlider.bind(this.guides[0]));

        window.addEventListener("beforeunload", 
            this.remove.bind(this), false);
    }

    /**
    Redraw Flog2 chart
    */
    Renderer.prototype.redraw = function () {
        // If there's no data provided, 
        // remove chart elements
        if(this.data.length < 1) {
            this.remove();
            return;
        }

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
        this.dom.content.attr(
            "transform", 
            "translate(0,"+this.contentOffsetTop+")"
        );

        this.setObjects("axes");
        this.setObjects("charts");

        this.reposition();

        //this.chartScale = this.getChartScale();
        this.dom.title
            .attr("x", this.width / 2)
            .text(this.title + " (1:"+this.chartScale+")");

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
        if(this.roundScale && !isNaN(this.chartScale)
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
                this.width += this.spacing;
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
    Renderer.prototype.reposition = function () {
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
            // Don't use padding inside SOC block
            if(this.charts[i].constructor.name 
            != "SingleOccurrenceChart" 
            || (i != 0 && this.charts[i-1].constructor.name 
            != "SingleOccurrenceChart"))
                offset_left += this.spacing;
            this.charts[i].dom.module
                .attr("transform",
                "translate("+(this.charts[i].margin.left+offset_left)+",0)"
            );
            this.charts[i].offsetLeft = this.charts[i].margin.left+offset_left;
            offset_left += +this.charts[i].width + this.charts[i].margin.right;
        }

        this.width = offset_left;
        this.outerWidth = (this.margin.left||0) + 
                           this.width + 
                          (this.margin.right||0);

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

        // Take type config if exists
        // If user has specified particular chart object conf
        // it overrides type config
        if(type+"Conf" in this 
        && c.type in this[type+"Conf"]) {
            if("pointSizeVaries" in this[type+"Conf"][c.type])
                this["setChart"+
                    (this[type+"Conf"][c.type].pointSizeVaries?
                    "Proportional":"Fixed")
                ](c.type);
            for(var k in this[type+"Conf"][c.type]) {
                c[k] = c[k] || this[type+"Conf"][c.type][k];
            }
        }
        if(this._def(window.Flog2[c.type])) {
            if(!(c instanceof window.Flog2[c.type])) {
                this[type][i] = new window.Flog2[c.type](c);
            }
        } else {
            console.error(type+" with type "+
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
    Renderer.prototype.setObject = function (type, obj) {
        // Insert 
        if(type+"Conf" in this 
        && obj.constructor.name in this[type+"Conf"])
            for(var k in this[type+"Conf"][obj.constructor.name])
                 obj[k] = this[type+"Conf"][obj.constructor.name][k];

        obj.up = this;
        obj.offsetTop = this.contentOffsetTop;
        obj.minDepth = this.minDepth;
        obj.maxDepth = this.maxDepth;
        obj.height = this.contentHeight - this.maxFooterHeight;
        obj.margin = obj.margin||{};
        obj[type=="charts"?"Y":"scale"] = this.Y;
        if("data" in obj && !("src" in obj))
            obj.data = this.data;
        
        obj.dom.module
           .attr("width", obj.width)
           .attr("overflow", "visible");

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
            console.error("Renderer.setObjects: "+
                type+" is not correct object type");
            return;
        }
        var offset_left = this.axesAreaWidth + 
            this.spacing;
        var flag = false;
        for(var i=0, n=this[type].length; i < n; i++) {
            var obj = this[type][i];
            if(obj.constructor.name == "Object") {
                continue;
            }
            obj.name = type+"-"+i;
            this.setObject(type, obj, offset_left);
            offset_left += obj.width;

            var isSoc = obj.constructor.name == "SingleOccurrenceChart";
            if(!isSoc || (isSoc && !flag)) 
                offset_left += this.spacing;
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

    /**

    */
    Renderer.prototype.eventDragStart = function() {
        d3.event.preventDefault();
        this.drag.depth = this.Y.invert(
            d3.mouse(this.dom.content[0][0])[1]);
    }

    /**

    */
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

    /**
    Re-calculate singleOccurrenceChart block maxvalue and
    get all column widths for these charts
    */
    Renderer.prototype.setChartProportional = function (type) {
        if(!(type in this.chartsConf))
            this.chartsConf[type] = {};

        var conf = this.chartsConf[type];

        conf.maxWidth = this.mm2px(conf.maxWidthmm);
        conf.pointWidth = this.mm2px(conf.pointWidthmm);

        conf._maxValue = null;
        conf._minValue = null;

        if(conf.pointWidth && conf.pointWidth > conf.maxWidth)
            conf.maxWidth = conf.pointWidth;

        if(!conf.pointHeightmm 
        || ""+conf.pointHeightmm == "" 
        || conf.pointHeightmm == conf.pointWidthmm) {
            conf.pointHeight = conf.pointWidth;
            conf.pointHeightmm = conf.pointWidthmm;
        } else {
            conf.pointHeight = this.mm2px(conf.pointHeightmm);
        }

        this.charts.forEach(function(c){
            if((!("type" in c) && c.constructor.name != type) 
            || ("type" in c && c.type != type)) 
                return;
            c.maxValue = +d3.max(this.data, 
                function(d){return Math.abs(+d[c.column])}
            );
            c.minValue = +d3.min(this.data, 
                function(d){return Math.abs(+d[c.column])}
            );
            if(c.maxValue > conf._maxValue 
            || conf._maxValue == null)
                conf._maxValue = c.maxValue;
            if(c.minValue < conf._minValue 
            || conf._minValue == null)
                conf._minValue = c.minValue;

        }.bind(this));
    }

    /**

    */
    Renderer.prototype.setChartFixed = function (type) {
        if(!(type in this.chartsConf)) 
            this.chartsConf[type] = {};

        var conf = this.chartsConf[type],
            c = {};
        c.width = +this.mm2px(conf.pointWidthmm).toFixed(2);
        c.pointWidth = c.width;

        if(!conf.pointHeightmm 
        || ""+conf.pointHeightmm == ""
        || conf.pointHeightmm == conf.pointWidthmm) {
            conf.pointHeight = conf.pointWidth;
            conf.pointHeightmm = conf.pointWidthmm;
        } 

        c.pointHeight = +(this.mm2px(conf.pointHeightmm)||c.pointWidth).toFixed(2);
        for(var k in c)
            conf[k] = c[k];
    }

    /**
    Cleanup of objects and events when chart is removed
    */
    Renderer.prototype.remove = function (event) {
        var event = event || false;
        if(event)
            event.preventDefault();
        if(this.preventUnload) {
            this.preventUnload = false;
            return;
        }

        if(this._def(this.dom) 
        && this.dom.content != null)
		    this.dom.content
		        .on(".slider", null)
		        .on(".drag", null)
		        .on(".zoom", null);

        for(var i=this.charts.length;i--;) {
            if("function" === typeof this.charts[i].remove) 
                this.charts[i].remove();
            this.charts[i] = null;
        }
        this.charts.length = 0;
        for(var i=this.axes.length;i--;) {
            if("function" === typeof this.axes[i].remove) 
                this.axes[i].remove();
            this.axes[i] = null;
        }

        this.axes.length = 0;
        for(var i=this.guides.length;i--;) {
            if("function" === typeof this.guides[i].remove)
                this.guides[i].remove();
            this.guides[i] = null;
        }
        this.guides.length = 0;

        if("content" in this.dom 
        && this.dom.content != null) {
            this.dom.content.select("rect").remove();
            this.dom.content.remove();
        }
        d3.select("#"+this.id+"-chart-container").remove();
        for(var k in this.dom)
            this.dom[k] = null;

        this.DATA_COLUMNS.length = 0;
        this.data.length = 0;
        this.dataStr = "";
        this.zoom = null;
    }

    return Renderer;

})(Flog2, Flog2.DataFormatter);

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
/** 
AxisDefault 
*/
Flog2.AxisDefault = (function(Axis){
    extend(Axis, AxisDefault);

    function AxisDefault(c) {
        Axis.call(this, {});
        this.cls = "axis_default";
        this.width = 50; // Only used by chart proportion calculator
        this.isVisible = c.isVisible||true;
        this.n_minorTicks = c.n_minorTicks||1;
        this.format = c.tickFormat||false;
    }

    return AxisDefault;

})(Flog2.Axis);
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

            if(d.depth_to < d.depth_from) {
                var x = d.depth_from;
                d.depth_from = d.depth_to;
                d.depth_to = x;                
            }

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
                       //parent_depths.splice(j, 1, [null, null]);
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

        this.isVisible = c.isVisible||true;

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
/**
AxisStratigraphy
*/
Flog2.AxisStratigraphy = (function(base) {
    extend(base, AxisStratigraphy);

    /** @constructor */
    function AxisStratigraphy (c) {
        this.cls = c.cls||"f2-axis-stratigraphy";
        this.height = c.height;
        this.width = c.width||10;
        this.cellWidth = c.cellWidth||30;
        this.minDepth = c.minDepth||null;
        this.maxDepth = c.maxDepth||null;
        this.hooks = c.hooks||null;
        this.src = c.src||null;
        this.dataType = c.dataType||"tsv";            // Data type if 
        this.data = !c.src && c.data ? c.data : null; // If no external source is given, data array from config object is expected
        this.cols = c.cols||null;                     // {depth_top:"my_depth_top",depth_base:"my_depth_base",level:"my_level"};

        this.isVisible = this.isVisible||true;

        this.styles = {
            "axis-stratigraphy-rect": "stroke-width:1;stroke:rgb(0,0,0);",
            "axis-stratigraphy-text": "font-family:arial;font-size:10px",
            "axis-stratigraphy-depthtext": "font-family:arial;font-size:10px"
        }
        this.style(c.styles);

        this.dom = {module:null, 
                    content:null,
                    rects:null,
                    texts:null,
                    depths:null};
    }

    /**
    After an ajax call it might be necessary to 
    change data returned. Hook "after_data_request" could
    be used to inject custom dataformatter method.
    Below is presented an example method how data formatter
    might look like. In this example request return custom
    json object consisting of "count" and "results" parameters.
    When "count":0, then false is returned triggering cancellation
    of rendering of stratigraphy axis and removing stratigraphy
    axis from chart axis array. Data returned in "results"
    parameter is injected to this.data.
    */
    AxisStratigraphy.demoHook_DataFormatter = function() {
        var data = arguments[1];
        if("count" in data 
        && data.count < 1) {
            this.remove();
            for(var i=this.up.axes.length;i--;) {
                if(this.up.axes[i].constructor.name 
                == "AxisStratigraphy")
                    this.up.axes.splice(i, 1);
                this.doHooks("after_draw");
                return false;
            }
        }
        this.data = "results" in data ? data.results : data;
        return true;
    }

    /**
    
    */
    AxisStratigraphy.prototype.render = function() {
        var t = this, 
            maxLevel = 0;

        if(this.data == null) return;
            
        // Box
        this.dom.rects = this.dom.rects.data(this.data.filter(
            function(d){return 0 <= (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) - 
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top)); }));      

        this.dom.rects.enter().append("rect")
            
        this.dom.rects
            .attr("x", function(d){
                if(+d.level > maxLevel) 
                    maxLevel = +d.level;
                return (+d.level-1) * t.cellWidth;
            })
            .attr("y", function(d){
                return t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top);
            })
            .attr("width", function(d){return t.cellWidth})
            .attr("height", function(d){
                //var top = (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top)),
                //    bottom = (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base));
                
                return (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) - 
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top));
            })
            .attr("style", function(d){ 
                return t.styles["axis-stratigraphy-rect"]+
                    "fill:"+(d.color ? d.color.indexOf(",") !== -1 ? "rgb("+d.color+")" : d.color : "#fff")
            })
            .attr("class", "axis-stratigraphy-rect")

        this.dom.rects.exit().remove();

        this.width = maxLevel * this.cellWidth;

        // Text
        this.dom.texts = this.dom.texts.data(t.data.filter(
            function(d){return 0 <= (t.scale(+d.depth_base) > t.scale(t.maxDepth) ? t.scale(t.maxDepth) : t.scale(+d.depth_base)) - 
                    (t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top)); }));
        this.dom.texts.enter().append("text");
        this.dom.texts
            .attr("transform", function(d){ 
                return "translate("+
                            ((+d.level-1) * t.cellWidth+(t.cellWidth/2))+","+
                            (t.scale(+d.depth_base < t.maxDepth ? +d.depth_base : t.maxDepth)-2)+")"+
                        "rotate(-90)"; 
            })
            .attr("class", "axis-stratigraphy-text")
            .attr("style", this.styles["axis-stratigraphy-text"])
            .text(function(d) {return d.stratigraphy})
            .text(function(d, i){
                var top = t.scale(+d.depth_top) < 0 ? 0 : t.scale(+d.depth_top),
                    base = t.scale(+d.depth_base) > t.height ? t.height : t.scale(+d.depth_base);
            
                return (base-top) > this.getBBox().width ? d.stratigraphy : 
                    (base-top > 40) ? d.index_main : "";
            });
        this.dom.texts.exit().remove();
         
        // Depth mark
        var nest = d3.nest()
                     .key(function(d) {return d.depth_top})
                     .entries(t.data.filter(function(d){
                         return d.depth_top > t.minDepth && d.depth_top < t.maxDepth;
                     })),
            cellWidth = 0;
        this.dom.depths = this.dom.depths.data(nest);
        this.dom.depths.enter().append("text");
        this.dom.depths
            .attr("transform", function(d){
                return "translate("+(t.width+3)+","+(t.scale(+d.key)+3)+")"})
            .attr("class", "axis-stratigraphy-depthtext")
            .attr("style", this.styles["axis-stratigraphy-depthtext"])
            .text(function(d) {return d.key})
            .text(function(d){
                if(this.getBBox().width > cellWidth)
                    cellWidth = this.getBBox().width;
                return d.key;
            });
        this.dom.depths.exit().remove();

        this.width+=cellWidth;
    }

    /**
    
    */
    AxisStratigraphy.prototype.draw = function() {
        this.doHooks("before_draw");

        var mimeType=["csv","tsv","json","jsonp","text","xml"],
            cbfn = function(data) {
                var h = this.doHooks("after_data_request", data)||[];
                for(var i=h.length;i--;) if(!h[i]) return;
                
                if(data)
                    this.data = "results" in data ? data.results : data;               
                if(this.cols) 
                    this.colRenamer();
                this.dom.rects = this.dom.module
                    .selectAll(".axis-stratigraphy-rect");
                this.dom.texts = this.dom.module
                    .selectAll(".axis-stratigraphy-text");
                this.dom.depths = this.dom.module
                    .selectAll(".axis-stratigraphy-depthtext");
                this.render();

                this.doHooks("after_draw");
                this.up.redraw();
            };

        if(mimeType.indexOf(this.dataType) == -1) {
            console.error("Invalid data delimiter code given."+ 
                "Possible values: csv,tsv,json,jsonp,txt,xml");
            return;
        }

        this.doHooks("before_data_request");
        this.src ? d3[this.dataType](this.src, cbfn.bind(this)) : cbfn.bind(this);
    }

    /**

    */
    AxisStratigraphy.prototype.redraw = function() {
        this.render();
    }

    AxisStratigraphy.prototype.remove = function() { 
        this.dom.module
            .selectAll(".axis-stratigraphy-rect").remove();
        this.dom.module
            .selectAll(".axis-stratigraphy-text").remove();
        this.dom.module
            .selectAll(".axis-stratigraphy-depthtext").remove();
        for(var k in this.dom) {
            this.dom[k].remove();
            this.dom[k] = null;
        }
    }

    return AxisStratigraphy;
})(Flog2);
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
        try {
        this.dom.line.attr("x2", this.width);
        this.dom.label.attr("x", this.width+2);
        } catch (e) {
            console.error(e);
        }
        // bring sliding guideline to front
        if(this.dom.module[0][0])
            this.dom.module[0][0].parentNode.appendChild(this.dom.module[0][0]);
    }

    SlidingGuideLine.prototype.remove = function() {
        for(var k in this.dom)
            this.dom[k].remove();
    }

    return SlidingGuideLine;

})(Flog2);
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
        this.labelLastY = this.offsetY(d3.event) - (this.up.dataFormatter == "ermas" ? 100 : 0);
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
        
        var offsetY = this.offsetY(d3.event) - (this.up.dataFormatter == "ermas" ? 100 : 0),
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
        if(this.labelPos != null 
        && !this.isMouseDown) {
            this.eventLabelHide();
            this.eventLabelShow();
        }
        this.dom.listener[0][0]
            .parentNode.appendChild(
                this.dom.listener[0][0]);

    }

    /**

    */
    VerticalLineChart.prototype.remove = function() {
        if(this.axes.length > 0)
            this.axes[0].remove();
        this.dom.path.selectAll("path").remove();
        this.dom.points.selectAll(".vlc-point").remove();
        this.dom.listener
            .on(".vlc", null);
        for(k in this.dom)
             this.dom[k].remove();
        this.data=null;
    }

    return VerticalLineChart;

})(Flog2);
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

        this.pointType = c.pointType||"rect";
        this.pointWidth = c.pointWidth||this.mm2px(c.pointWidthmm)||6;
        this.pointHeight = c.pointHeight||this.mm2px(c.pointHeightmm)||6;
        this.pointSizeVaries = c.pointSizeVaries||false;

        this.width = c.width||this.pointWidth;
        this.maxWidth = this.width;              // <- maxWidth is original width value and common width value for every SOC while width itself might vary
        this.height = c.height;
        this.margins(c.margin);
        this.footerHeight = c.footerHeight;
        this.maxDepth = c.maxDepth;
        this.minDepth = c.minDepth;

        this.widthmm = c.widthmm||Math.floor(this.px2mm(this.width))||null;
        this.maxWidthmm = c.maxWidthmm||Math.floor(this.px2mm(this.maxWidth))||null;
        this.pointWidthmm = c.pointWidthmm||Math.floor(this.px2mm(this.pointWidth))||null;
        this.pointHeightmm = c.pointHeight||Math.floor(this.px2mm(this.pointHeight))||null;

        this.styles = {
            "chart-occurrence-text":"transform:rotate(-90);text-anchor:end;font-family:arial;font-size:10px",
            "chart-occurrence-line":"stroke:#000;stroke-width:1px;z-index:100;shape-rendering:crispEdges;",
            "chart-occurrence-point":"stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;",
            "chart-occurrence-point-filled":"fill:#fff;stroke-width:1;stroke:rgb(0,0,0);shape-rendering: crispEdges;"
        }
        this.style(c.styles);

        this.data = [];

        this.dom = {module:null, content:null, text:null, lines:null, points:null};

        this.maxValue = null;
        this.spacingmm = c.spacingmm||this.margin.left;
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
                .text(this.title);

        this.footerHeight = this.dom.text.node().getBBox().width;
        this.dom.text.exit().remove();
    }

    /**

    */
    SingleOccurrenceChart.prototype.dataFormatter = function() {
        this.depthTop = null;
        this.depthBase = null;
        if(!(this.column in this.data[0])) 
            console.error("Flog2: Column '"+this.column+"' not present in dataset");

        this.data = this.data.filter(function(d) {
            if(!(this.column in d) 
            || +d[this.column] == 0) 
                return false;
            if(this.depthTop == null)
                this.depthTop = d.depth < this.minDepth ? this.minDepth : (d.depth > this.maxDepth ? this.maxDepth : d.depth);
            this.depthBase = d.depth < this.minDepth ? this.minDepth : (d.depth > this.maxDepth ? this.maxDepth : d.depth);

            return d.depth <= this.maxDepth && d.depth >= this.minDepth;
        }.bind(this));
    }

    /**

    */
    SingleOccurrenceChart.prototype.setProportions = function () {

        if(this.spacingmm != null) {
            this.margin.left = this.mm2px(this.spacingmm)||0;
            this.margin.right = this.mm2px(this.spacingmm)||0;
        }

        if(this.pointSizeVaries)
            this.X = this.scaler(
                 this.pointWidth, 
                 this.maxWidth, 
                 this._minValue, 
                 this._maxValue
            );

        this.width = this.pointSizeVaries ? 
            this.X(this.maxValue) : 
            +this.mm2px(this.pointWidthmm).toFixed(2);
    }

    /**

    */
    SingleOccurrenceChart.prototype.render = function() {
        this.dataFormatter();
        this.setProportions();

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

        // rects
        this.dom.points = this.dom.points.data(this.data);
        this.dom.points.enter().append(this.pointType);
        if(this.pointType == "rect") {
            this.dom.points
                .attr("x", function(d) {
                    return (t.width - (t.pointSizeVaries ? t.X(Math.abs(d[t.column])) : t.pointWidth))/2
                })
                .attr("y", function(d) {
                    return t.Y(+d.depth) - (t.pointSizeVaries && t.pointHeight == t.pointWidth ? 
                        t.X(Math.abs(d[t.column])) : t.pointHeight ) / 2
                })
                .attr("width", function(d) {
                    return !t.pointSizeVaries ? t.pointWidth : t.X(Math.abs(d[t.column]))
                })
                .attr("height", function(d){
                    return t.pointSizeVaries && t.pointHeight == t.pointWidth ? 
                        t.X(Math.abs(d[t.column])) : t.pointHeight;
                });
        } else if(this.pointType == "ellipse") {
            this.dom.points
                .attr("cx", this.width / 2)
                .attr("cy", function(d) {return t.Y(+d.depth)})
                .attr("rx", function(d) {
                    return ( !t.pointSizeVaries ? t.pointWidth : t.X(Math.abs(d[t.column])) ) / 2;
                })
                .attr("ry", function(d) {
                    return ( t.pointSizeVaries && t.pointHeight == t.pointWidth ? 
                        t.X(Math.abs(d[t.column])) :  t.pointHeight ) / 2;
                });
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
        this.data.length = 0;
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
