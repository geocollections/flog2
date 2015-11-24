# flog2

Licensed under The GNU General Public License v3.0, for more information please read the LICENSE.md file in this repository or visit the preceding link to the GNU website.

Flog2 is javascript-based tool for creating svg charts of measured geological sections, complete with stratigraphy columns, core box coverage in case of drill cores, sample depths and identifiers with links to external sources, geochemical (or other numeric) data and fossil occurrences. The source data may come from static tab-delimited files, json database APIs or direct user input (copy-paste from Excel or LibreOffice). 

User has options to set specific scale or chart height, upper and lower depth limits, and select which geochemical parameters and fossil taxa to show. The data can be explored by zooming in and out (changing vertical scale) and dragging up and down using mouse controls. Suitable chart can then be exported as svg file and adjusted and combined for final look in any recent vector drawing software (e.g., Inkscape, Adobe Illustrator and CorelDraw).

Flog2 is based on [D3.js](https://github.com/mbostock/d3) for data manipulation and charting, and [d3export](https://github.com/agordon/d3export_demo) for exporting svg graphs. It was created as part of the [Estonian geocollections portal](http://geocollections.info). The name Flog2 comes from **f**aunal **log** version 2.

Check out a [working demo](http://geokogud.info/flog2).

