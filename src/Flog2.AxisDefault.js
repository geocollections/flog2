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
