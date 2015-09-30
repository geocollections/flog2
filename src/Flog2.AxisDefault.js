/** 
AxisDefault 
*/
Flog2.AxisDefault = (function(Axis){
    extend(Axis, AxisDefault);

    function AxisDefault() {
        Axis.call(this, {});
        this.cls = "axis_default";
        this.width = 50; // Only used by chart proportion calculator
    }

    return AxisDefault;

})(Flog2.Axis);
