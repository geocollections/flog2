#!/bin/sh

cd src
cat Flog2.js Flog2.DataFormatter.js Flog2.Renderer.js Flog2.Axis.js Flog2.AxisDefault.js Flog2.AxisSample.js Flog2.AxisSectionBox.js Flog2.AxisStratigraphy.js Flog2.AxisDrillcoreBox.js Flog2.SlidingGuideLine.js Flog2.VerticalLineChart.js Flog2.SingleOccurrenceChart.js > ../build/flog2.js #$(date +%F).js
echo "/**
Flog2

@description: Chart library for displaying geologic data
Institute of Geology at Tallinn University of Technology
http://www.gi.ee

Build: "$(date +%c)"
*/
"|cat - ../build/flog2.js > /tmp/out && mv /tmp/out ../build/flog2.js
