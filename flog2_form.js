/* 
* FLOG2 middle layer between charting library and html ui form.
* -Binds html form data to Flog2 object. 
* -Controls the behavior of Flog2 chart object.
*/
"use strict";!function(){

var flog2_form = flog2_form || {
    f2obj: {},
    forms: [],
    fieldsets: {},
    conf: {},
    changed: [],
    _gcls: function(v) {
        return document.getElementsByClassName(v);
    },
    _gid: function(v) {
        return document.getElementById(v);
    },
    _d: function(v) {
        return "undefined" !== typeof v;
    },

    init: function() {
        // Refresh button click
        var btn_refresh = document.getElementsByName('refresh')[0];
        btn_refresh.addEventListener('click', 
            this.redraw.bind(this), false);

        // Download button click
        var btn_dl = document.getElementsByName('download')[0];
        btn_dl.addEventListener('click', 
            this.download, false);

        // If window dimensions are changed, resize chart
        window.addEventListener('resize', 
            this.getChartHeight.bind(this), false);

        // Autoscale event handler
        // Listen to .autoscale input field events to update
        // height parameters .
        var as = document.getElementsByClassName('autoscale');
        for(var i=as.length;i--;) {
            as[i].addEventListener("blur", 
                this.autoscale, false);
        }

        // Draggable pane
        var dt = document.getElementById("drag-tab");
        dt.addEventListener("mousedown", 
            this.startDragHandler.bind(this), false);

        // Collapsible left pane
        var ct = document.getElementsByClassName("flog2_form_collapser_btn");
        for(var i=ct.length;i--;)
            ct[i].addEventListener("click", 
                this.toggleFormArea, false);

        // Inject dropdown column selectors to placeholder div(s)
        // with classname ".data-column-selecto" 
        this.addDataColumnSelectorsHTML();

        // Add axis selector
        this.addAxisSelectorHTML();
    
        // Load F2 chart
        this.run();
    },

    getInputs: function() {
        var form = this._gcls("flog2_form")[0],
            fs_l = form.getElementsByTagName("fieldset");
        for(var i=0,nf=fs_l.length;i<nf;i++) {
            this.conf[fs_l[i].name] = {};
            var f_l = fs_l[i].elements;
            for(var j=0,m=f_l.length;j<m;j++) {
                if(!f_l[j].hasAttribute("data-value") 
                || ""+f_l[j].value != f_l[j].getAttribute("data-value")) {
                    this.changed.push(fs_l[i].name+"."+f_l[j].name);
                }
                if(f_l[j].type == "radio" 
                && !f_l[j].checked)
                    continue;
                if(f_l[j].type == "checkbox" 
                && fs_l[i].name == "axes") {
                    this.conf[fs_l[i].name][f_l[j].name] = f_l[j].checked;
                    continue;
                }
                this.conf[fs_l[i].name][f_l[j].name] =
                    f_l[j].type === "number" ? +f_l[j].value : f_l[j].value;
            }
        }
        // dataStr
        var ds=this._gid("Flog2DataStr").value;
        this.conf["Flog2"].dataStr=ds;
    },
        
    attachToObject: function() {
        var t = this,
            cols_o = this.getChartColumns(), 
            pointer = {b:null, e:0};
        for(var fs in this.conf) {
            var c = this.conf[fs];
            if(fs == 'Flog2') {                
                // General settings
                for(var ck in c) {
                    if(this.changed.indexOf(fs+"."+ck) === -1 
                    || ck == "dataStr")
                        continue;

                    this.f2obj[ck] = c[ck];
                }
                if("dataStr" in c
                && c["dataStr"]
                    .replace(/(\r\n|\n|\r)/gm,"")
                    .replace(" ","").length > 0) 
                { 
                    this.attachDataStrToObject(fs, c); 
                }

                // If chart proportions are changed
                // then the whole chart should be redrawn
                // First assess which width elements were changed
                this.f2obj.outerWidth = null;
                this.f2obj.chartScale = null;
                this.f2obj.chartHeightmm = null;
                this.f2obj.outerHeight = null;
                this.f2obj.chartHeight = null;
                // If user changed minDepth or maxDepth then
                // allow not round scale and calculate scale
                // based on chartHeightmm. Otherwise scale
                // is used 
                if(this.changed.indexOf(fs+".minDepth") != -1
                || this.changed.indexOf(fs+".maxDepth") != -1) {
                    this.f2obj.roundScale = false;
                    this.f2obj.chartHeightmm = c.chartHeightmm;
                } else {
                    this.f2obj.roundScale = true;
                    this.f2obj.chartScale = c.chartScale;
                }
            } else if (fs == "axes") {
                this.getAxesVisible(fs);
            } else {
                this.attachChartsToObject(cols_o, pointer, fs);
                for(var ck in c) {
                    if(this.changed.indexOf(fs+"."+ck) === -1)
                        continue;
                    for(var l=this.f2obj.charts.length;l--;)
                        if(fs == this.f2obj.charts[l].constructor.name)
                            this.f2obj.charts[l][ck] = c[ck];
                }
            }           
        }
        this.changed.length = 0;
    },

    attachDataStrToObject: function(fs, c) {
        c.dataDelimiter = this._d(c.dataDelimiter) ? 
            c.dataDelimiter : this.f2obj.dataDelimiter;
        
        this.f2obj.data = (function(dl, str) {
            switch(dl) {
                 case "\\t", "\t": return d3.tsv.parse(str);
                 case ",": return d3.csv.parse(str);
                 case ";": return d3.dsv(";", "text/plain")
                                    .parse(";", str);
            }
        })(c["dataDelimiter"], c["dataStr"]);
        
        this.f2obj.dataStr = c["dataStr"];
        try {
            this.f2obj['df_'+this.f2obj.dataFormatter]();
        } catch (e) {console.log(e)}
    },

    attachChartsToObject: function(cols_o, pointer, fs) {
        var flag = false;
        
        // Remove unused object
        for(var i=this.f2obj.charts.length;i--;) {
            var c=this.f2obj.charts[i];
            
            if(c.constructor.name == fs) {
                if(!flag) pointer.e = i+1; flag = true;
                if(!this._d(cols_o[fs]) || cols_o[fs].indexOf(c.column) == -1) {
                    // remove
                    this.f2obj.charts[i].remove();
                    this.f2obj.charts.splice(i, 1);
                    pointer.e--;
                }
                if(flag) pointer.b = i;                
            }
        }

        if(!flag) pointer.b = pointer.e;

        if(fs in cols_o)
            for(var i=0,n=this.f2obj.DATA_COLUMNS.length;i<n;i++) {
                var k = this.f2obj.DATA_COLUMNS[i],
                    jump = false;
                // If chart already exists, dont create a new one
                for(var j=pointer.b,m=this.f2obj.charts.length;j<m;j++) {
                     if(cols_o[fs].indexOf(k)!=-1 
                     && this.f2obj.charts[j].column == k) {
                          jump = true;
                          pointer.b++;
                     }
                }
                if(jump) continue;
                if(cols_o[fs].indexOf(k)!=-1) {
                    // Create new chart object
                    var newObj={
                            title: k,
                            column: k,
                            name: "chart-"+fs+"-"+pointer.b,
                            type: fs
                    };
                    for(var js in this.conf[fs])
                        newObj[js] = this.conf[fs][js];
                    this.f2obj.charts.splice(pointer.b, 0, newObj);
                    this.f2obj.initObject("charts", pointer.b);
                    pointer.b++;
                }
            }
        pointer.b = pointer.e;
    },

    // Update form data
    attachToForm: function() {
        // Update data-as-string textarea
        var ds=this._gid("Flog2DataStr");
        if("undefined" !== typeof ds) {
            ds.innerHTML=this.f2obj.dataStr;
            ds.setAttribute("data-value", this.f2obj.dataStr);
        }
        // Iterate over form fieldsets
        var form=this._gcls("flog2_form")[0],
            fs_l = form.getElementsByTagName("fieldset");
        
        for(var i=fs_l.length;i--;) {
            var fs = fs_l[i].name,
                inp_l = [], 
                k_l=["input","select"];
            for(var j=k_l.length;j--;) {
                var e=fs_l[i].getElementsByTagName(k_l[j]);
                for(var j_=e.length;j_--;)
                    inp_l.push(e[j_]);
            }
            // General chart area data
            if(fs == "Flog2") {
                // Set datadelimiter radio
                for(var j=inp_l.length;j--;) {
                    if(inp_l[j].name == "dataDelimiter") {
                        inp_l[j].checked = (inp_l[j].value == this.f2obj.dataDelimiter.replace("\t","\\t"));
                        continue;
                    }
                    
                    inp_l[j].value = this.f2obj[inp_l[j].name];
                    inp_l[j].setAttribute("data-value", this.f2obj[inp_l[j].name]);
                }
            } else if(fs == "axes") {
                this.setAxesVisible(inp_l.reverse());
            } else {
                // Set data charts that are visible
                var visibleCharts = {}, chartConf={};
                for(var i_=this.f2obj.charts.length;i_--;){
                    var c=this.f2obj.charts[i_];
                    if(!this._d(visibleCharts[c.column]))
                        visibleCharts[c.column]=[];
                    visibleCharts[c.column]
                        .push(c.constructor.name);
                    // General config for type of chart
                    if(c.constructor.name == fs)
                        chartConf[fs]=i_;
                }
                this.setChartColumns(visibleCharts);

                // Set general data
                // If chart is not visible in the chart area, take the value from
                // class constructor
                var o = !(fs in chartConf) ? 
                    new window.Flog2[fs]({}) : 
                    this.f2obj.charts[chartConf[fs]];
                for(var j=inp_l.length;j--;) {
                    var v = (inp_l[j].name in o) ? o[inp_l[j].name] : null;
                    inp_l[j].value = v;
                    inp_l[j].setAttribute("data-value", v);
                }
                if(!(fs in chartConf)) {
                    try { o.remove() } catch(e) { 
                        //console.log(e) 
                    }
                    o = null;
                }
            }
        }
    },

    // Form dropdown selectors

    addDataColumnSelectorsHTML: function() {
        var placeholders = this._gcls("data-column-selector");

        if(placeholders.length > 0) {
            if(!this._gid("modal-content")) {
                var div_bg=document.createElement("div"),
                    div_container=document.createElement("div"),
                    div_content=document.createElement("div");
                div_bg.id="modal-background";
                div_container.id="modal-container";
                div_content.id="modal-content";
                document.body.appendChild(div_container);
                div_container.appendChild(div_bg);
                div_container.appendChild(div_content);
                div_bg.addEventListener("click", function(){
                    div_container.style.display="none";
                }, false);
                
            }

            var ul=document.createElement("ul");
            for(var j=0,n=this.f2obj.DATA_COLUMNS.length;j<n;j++) {
                var li=document.createElement("li"), 
                    k=this.f2obj.DATA_COLUMNS[j];
                li.innerHTML=k;
                li.addEventListener("click", 
                    this.columnToggler, false);
                ul.appendChild(li);
            }
            div_content.appendChild(ul);
        }

        for(var i=placeholders.length;i--;) {
            placeholders[i].dataset.type=placeholders[i].parentNode.name;
            placeholders[i].addEventListener("click", 
                this.columnSelector, false);
        }
    },

    columnToggler: function(){
        var type = this.parentNode.dataset.type;
        if(this.classList.contains("_bold")) {
            this.classList.remove("_bold");
            if("undefined" !== typeof this.dataset.type) {
                this.dataset.type = this.dataset.type.replace(type, "");
            }
        } else {
            this.classList.add("_bold");
            this.dataset.type=("undefined"!==typeof this.dataset.type ? 
                this.dataset.type+",":"")+type;
        }
        this.dataset.type = this.dataset.type.replace(",,",",");
    },

    columnSelector: function() {
        var type = this.dataset.type;
        document.getElementById("modal-container").style.display="block";
        
        var ul=document.getElementById("modal-content").children[0],
            li_l = ul.children;
        ul.dataset.type=this.dataset.type;
        for(var i=li_l.length;i--;) {
            li_l[i].classList.remove("_bold");
            if("undefined" !== typeof li_l[i].dataset.type 
            && li_l[i].dataset.type.indexOf(type)!=-1) {
                 li_l[i].classList.add("_bold");
            }
        }
    },

    getChartColumns: function() {
        var li_l = this._gid("modal-content").children[0].children,
            c_l = {};
        for(var i=0, n=li_l.length; i<n; i++) {
            var t_l = li_l[i].dataset.type;
            if(this._d(t_l)) {
                t_l = t_l.split(",");
                if(t_l[0]=="") t_l.shift();
                for(var j=t_l.length;j--;) {
                    if(!this._d(c_l[t_l[j]]))
                        c_l[t_l[j]]=[];
                    c_l[t_l[j]].push(li_l[i].innerHTML);
                }
            }
        }
        return c_l;
    },

    setChartColumns: function(visibleCharts) {
        var li_l = this._gid("modal-content").children[0].children,
            c_l = {};
        for(var i=li_l.length;i--;) {
             li_l[i].dataset.type = li_l[i].innerHTML in visibleCharts ? 
                 visibleCharts[li_l[i].innerHTML].join(",") : "";
        }
    },

    addAxisSelectorHTML: function() {
        var pl_l = this._gcls("axes-selector");
        if(pl_l.length > 0) {
            // <br /><input /> Label
            for(var i=0, n = this.f2obj.axes.length; i < n; i++) {
                var input=document.createElement("input");
                input.type = "checkbox";
                input.name = "visible-axis-"+i;
                
                input.checked = this.f2obj.axes[i].isVisible;
                pl_l[0].appendChild(input);
                pl_l[0].appendChild(document.createTextNode(this.f2obj.axes[i].constructor.name));  
                pl_l[0].appendChild(document.createElement("br"));
            }
        }
    },

    setAxesVisible: function(inp_l) {
        for(var i=0,n=inp_l.length;i<n;i++)
            inp_l[i].checked = this.f2obj.axes[i].isVisible;
    },

    getAxesVisible: function(fs) {
        for(var k in this.conf[fs]) {
            this.f2obj.axes[+(k.replace("visible-axis-",""))].isVisible = this.conf[fs][k];
        }
    },

    run: function() {
        this.getInputs();
        this.attachToForm();
    },


// 8< -- 8< -- 8<

    resize_hook: function() {
        var d_=document.getElementsByName("Flog2")[0],
            f_l=["minDepth","maxDepth","chartScale"];
        if("undefined" !== typeof d_) {
            var d=d_.getElementsByTagName("input");
            for(var i=d.length;i--;) {
                var x=f_l.indexOf(d[i].name);
                if(x!=-1)
                    d[i].value = (+this[f_l[x]]).toFixed(
                        f_l[x] == "chartScale" && this.roundScale ? 0 : 2
                    );
            }
        }
    },

    redraw: function () {
        this.getInputs();
        this.attachToObject();
        this.f2obj.redraw();
        this.attachToForm();
        return false;
    },

    // .svg file download 
    // http://d3export.housegordon.org
    download: function () {
        var name=this.parentNode.id.replace("flog2_form_","");

        // set css to svg
        var css_str="";
        var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;    
        for (var x = 0; x < classes.length; x++) {
            css_str += (classes[x].cssText) ? classes[x].cssText : classes[x].style.cssText;
        }
        var svg_style = d3.select("#"+name+"-chart-container")
                            .append("defs")
                            .append("style")
                            .attr("type", "text/css")
                            .text(css_str);
        // /set css to svg

        var svg = document.getElementById(name+"-chart-container");

        // Get the d3js SVG element
        //var tmp = document.getElementsByClassName("chart")[0];
        //var svg = tmp.getElementsByTagName("svg")[0];
        var svg_xml = (new XMLSerializer).serializeToString(svg);
        var form = document.getElementById("svgform");
        form['output_format'].value = 'svg';
        form['data'].value = svg_xml ;
        form.submit();
    },

    getChartHeight: function () {
        this.f2obj.outerWidth = null;

        this.f2obj.chartScale = null;
        this.f2obj.chartHeightmm = null;
        this.f2obj.outerHeight = null;
        this.f2obj.chartHeight = null;

        this.f2obj.redraw();
        this.attachToForm();
    },


    autoscale: function () {
        var maxDepth = null,
            minDepth = null;
        var els=this.parentNode.children;
        for(var i=els.length;i--;){
            if(els[i].name == "maxDepth")
                maxDepth = els[i].value;
            if(els[i].name == "minDepth")
                minDepth = els[i].value;
        };
        if(!minDepth||!maxDepth||this.value==""
            ||isNaN(this.value)||!this.value) {
            return;
        }
        var as=document.getElementsByClassName('autoscale');
        for(var i=as.length;i--;) {
            if(this.name == "chartScale" && as[i].name == "chartHeightmm") {
                as[i].value = (maxDepth - minDepth) * 1000 / this.value;
            }
            if(this.name == "chartHeightmm" && as[i].name == "chartScale") {
                as[i].value = Math.abs(Math.round(((maxDepth - minDepth)*1000) / this.value));
                this.value = (maxDepth - minDepth) * 1000 / as[i].value; // Because scale value is rounded
            }
        }
    },

    // Draggable textarea pane events
    startDragHandler: function (e) {
        e.preventDefault();
        window.addEventListener("mouseup", this.endDragHandler.bind(this), false);
        window.addEventListener('mousemove', this.dragHandler, false);
    },

    dragHandler: function (e) {
        var t = document.getElementById("drag-tab-parent"),
            p = document.getElementById("Flog2DataStr");
        if(e.clientY < 0)
            return;    
        t.style.top = (e.clientY)+"px";
        p.style.height = (e.clientY)+"px";
    },

    endDragHandler: function (e) {
        e.preventDefault();
        window.removeEventListener('mousemove',
            this.dragHandler, false);
    },

    toggleFormArea: function () {
        var getPreviousSibling = function(n) {
                var x = n.previousSibling;
                while (x.nodeType != 1) 
                    x = x.previousSibling;
                return x;
            },
            pane = getPreviousSibling(this.parentNode),
            v = pane.style.display!="none";
        pane.style.display = v ? "none" : "block";
        this.parentNode.style.left = pane.offsetWidth+"px";
        this.innerHTML = "&nbsp;" + (v ? ">" : "<");
        // reposition chart
        var chart = document.getElementsByClassName("chart");
        if(chart.length > 0)
            chart[0].style.marginLeft = (+pane.offsetWidth+30)+"px";
    }

// >8 -- >8 -- >8

};

    window.flog2_form=flog2_form;
}();
