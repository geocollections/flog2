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

        // Does given dataset include depth_to column
        var d_= (-1 !== Object.keys(this.data[0]).indexOf("depth_to"));
        // Walk through dataset
        for(var i=this.data.length;i--;) {
            this.data[i]["depth_from"] = this.data[i]["depth"];
            // If data depth is not "", add it as float
            if(this.data[i].depth!="") {
                this.data[i].depth = parseFloat(this.data[i].depth);
            } else {
                continue;
            }
            
            if (!d_ || this.data[i]["depth_to"] == "") {
                this.data[i]["depth_to"] = this.data[i]["depth"];
            }
            
            // Calculate average depth if data contains depth_to column
            this.data[i]["depth"] = (this.data[i]["depth"] + 
                    parseFloat(this.data[i]["depth_to"])) / 2;
        }

        // Set depth limits only on initialization of the chart 
        // or when dataset limits are changed
        var maxDepth = d3.max(this.data, function(d) { return d.depth; }),
            minDepth = d3.min(this.data, function(d) { return d.depth; });
        if(!this._def(this.maxDepth) || maxDepth!=this.oMaxDepth) {
            this.maxDepth = maxDepth;
            this.oMaxDepth = maxDepth;
        }
        if(!this._def(this.minDepth) || minDepth!=this.oMinDepth) {
            this.minDepth = minDepth;
            this.oMinDepth = minDepth;
        }
        this.depth = this.maxDepth - this.minDepth;

        this.data.sort(function(a,b){return d3.ascending(a.depth,b.depth);});
    }

    /**
    Incoming data formatter for chart implementation in chitinozoa.net.
    */
    DataFormatter.prototype.chitinozoa = function () {
        // Does given dataset include depth_to column
        var d_= (-1 !== Object.keys(this.data[0]).indexOf("depth_interval"));
        // Walk through dataset
        for(var i=this.data.length;i--;) {
            this.data[i]["depth_from"] = this.data[i]["depth"];
            // If data depth is not "", add it as float
            if(this.data[i].depth!="") {
                this.data[i].depth = parseFloat(this.data[i].depth);
            } else {
                continue;
            }
            
            if (!d_ || this.data[i]["depth_interval"] == "") {
                this.data[i]["depth_to"] = this.data[i]["depth"];
            } else
                this.data[i]["depth_to"] = this.data[i]["depth_interval"];
            
            // Calculate average depth if data contains depth_to column
            this.data[i]["depth"] = (this.data[i]["depth"] + 
                    parseFloat(this.data[i]["depth_interval"])) / 2;
        }
        
        // Set depth limits only on initialization of the chart 
        // or when dataset limits are changed
        var maxDepth = d3.max(this.data, function(d) {return d.depth}),
            minDepth = d3.min(this.data, function(d) {return d.depth});
        if(!this._def(this.maxDepth) || maxDepth!=this.oMaxDepth) {
            this.maxDepth = maxDepth;
            this.oMaxDepth = maxDepth;
        }
        if(!this._def(this.minDepth) || minDepth!=this.oMinDepth) {
            this.minDepth = minDepth;
            this.oMinDepth = minDepth;
        }

        this.depth = this.maxDepth - this.minDepth;
        this.data.sort(function(a,b){return d3.ascending(a.depth,b.depth)});
    }

    // ... 

    return DataFormatter;
})();
