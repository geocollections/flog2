
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

var Flog2 = Flog2||{};

/** 
Base module. Shared resources.
*/
Flog2 = (function(){

    /**
    @constructor
    */
    function Flog2 (c, d) {
        this.VERSION = "0.1";

        if(c && d) 
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
    Gets mm etalon height
    */
    Flog2.prototype.getEtalon = function() {
        var el = document.getElementById("mm_etalon");
        if(!this._def(el)) {
            console.log("no etalon dom element included in page");
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
        return mm * 2.834646;
    }

    /**
    Pixel to mm calculator
    @param {integer} - pixel count
    */
    Flog2.prototype.px2mm = function(px) {
        //return px * 0.2822;
        return px * 0.3527777;
    }

    /**
    Calculates chart scale.
    */
    Flog2.prototype.getChartScale = function () {
        var h = this.chartHeight,
            depth_irl = this.maxDepth - this.minDepth,
            chHeight_mm = this.px2mm(h);//h / this.etalon;
        return Math.abs(Math.round((depth_irl*1000)/chHeight_mm));
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
            this.dataStr = data;
        else
            return data;
    }

    /**
    @param {string} - hook name representing its location in the code
    */
    Flog2.prototype.doHooks = function (location) {
        if("undefined" === typeof this.hooks[location] 
        || this.hooks[location].length < 1)
            return;
        for(var i=0,n=this.hooks[location].length;i<n;i++) {
            var h=this.hooks[location];
            if(this._def( document[h] ))
                document[h].bind(this)();
            else if(this._def(window[h])) {
                window[h].bind(this)();
            } else {
                var n_l=this.hooks[location][i].split("."), 
                    obj=window;
                for(var j=0,m=n_l.length;j<m;j++)
                    obj = obj[n_l[j]];
                
                obj.bind(this)();
            }
        }
    }

    return Flog2;

})();
