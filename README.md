# flog2

Flog2 is javascript-based tool for creating svg charts of measured geological sections, complete with stratigraphic subdivisions, sampling depths, geochemical (or other numeric) data and fossil occurrences (the name comes from Faunal LOG version 2). The source data may come from static tab-delimited files, json database APIs or direct user input (copy-paste from Excel or LibreOffice). 

User has options to set specific scale or chart height, upper and lower depth limits, and select which geochemical parameters and fossil taxa to show. The chart can be explored by zooming in and out (changing veritical scale) and dragging up and down using by mouse controls. Suitable chart can then be exported as svg file and adjusted and combined for final look in any recent vector drawing (e.g., Inkscape, Adobe Illustrator and CorelDraw).

Flog2 is based on [D3.js](https://github.com/mbostock/d3) for data manipulation and charting, and [d3export](https://github.com/agordon/d3export_demo) for exporting svg graphs. It was created as part of the [Estonian geocollections portal](http://geocollections.info).

Check out a [working demo](http://geokogud.info/flog2).
