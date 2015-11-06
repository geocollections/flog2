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
        this.data.forEach(function(d){
            d.depth_from = d.depth;
            if(d.depth != "") 
                d.depth = +d.depth;
            else return;
            if(!("depth_to" in d) 
            || d.depth_to == ""
            || d.depth_to == null)
                d.depth_to = d.depth;
            d.depth = (d.depth + (+d.depth_to)) / 2;
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

        //this.data.sort(function(a, b){return d3.ascending(a.depth, b.depth);});

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
        this.DATA_COLUMNS = val_l.map(function(d){return d.key;});
        // /-- sorting --
    }

    /**
    Incoming data formatter for chart implementation in chitinozoa.net.
    */
    DataFormatter.prototype.chitinozoa = function () {
        
        // Walk through dataset
        this.data.forEach(function(d){
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

    return DataFormatter;
})();
