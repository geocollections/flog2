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

