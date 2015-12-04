#!/bin/bash

let $# || { echo "Version number must be given as first argument";exit 1;}

cd src
cat helpers.js Flog2.js Flog2.DataFormatter.js Flog2.Renderer.js Flog2.Axis.js Flog2.AxisDefault.js Flog2.AxisSample.js Flog2.AxisSectionBox.js Flog2.AxisStratigraphy.js Flog2.AxisDrillcoreBox.js Flog2.SlidingGuideLine.js Flog2.VerticalLineChart.js Flog2.SingleOccurrenceChart.js > ../build/$1/flog2.js #$(date +%F).js
echo "/**
Flog2

@description: Chart library for displaying geologic data
Institute of Geology at Tallinn University of Technology
http://www.gi.ee

Build: "$(date +%c)"

Licensed under The GNU General Public License v3.0, 
for more information please read the LICENSE.md file in 
this repository or visit the preceding link to the GNU website.
*/
"|cat - ../build/$1/flog2.js > /tmp/out && mv /tmp/out ../build/$1/flog2.js
