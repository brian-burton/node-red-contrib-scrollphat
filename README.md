# node-red-contrib-scrollphat

This project was borne of a desire to help the Raspberry Pi Foundation create node.js (and therefore Node Red) native code to use as part of their curriculum.
To do that, I first had to write some code that would prove the viability (and my ability) to work natively in Javascript, rather than just wrapping the existing Python libraries in exec calls.

## What is this, then?

A set of nodes for NodeRed, using native Javascript with the help of the [i2c-bus](https://www.npmjs.com/package/i2c-bus) node.js library.

### Set Pixels

![](images/setPixel.PNG?raw=true)

This node sets individual pixels given x, y, desired state and additionally can be instructed to make additive changes to the existing display or reset the display back to blank before adding the new pixel.

### Clear

![](images/Clear.PNG?raw=true)

This node clears the whole Scroll pHAT back to off or on, given a boolean, string, or numeric instruction.

### Brightness

![](images/Brightness.PNG?raw=true)

This node sets the brightness of the Scroll pHAT as a numberic percentage.

### Column

![](images/Column.PNG?raw=true)

This node sets a column to a percentage value, or defaults to fully lit if no percentage given. Useful for graphs and patterns.

### Row

![](images/Row.PNG?raw=true)

This node sets a row to a percentage value, or defaults to fully lit if no percentage given. Useful for graphs and patterns.

## Installation

You can't "npm install" this yet because it narks me that npmjs.com [want to give my email address to everybody](https://github.com/npm/www/issues/16). You can "git clone" and then "npm install" in a directory. It may or may not work, so you pays your money and you takes your choice until this README says otherwise...
