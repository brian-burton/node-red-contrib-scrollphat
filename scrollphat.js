// http://www.issi.com/WW/pdf/31FL3730.pdf for LED driver chip spec

module.exports = function (RED) {

  var i2c = require("i2c-bus");
  //Bus address of the I2C bus
  var BUS_ADDRESS = 1;
  // I2C Address of the ScrollPhat
  var SP_ADDRESS = 0x60;
  // Starting address for the matrix 1 data register
  var SP_COMMAND = 0x01;
  // Address for configuration register
  var SP_MODE_COMMAND = 0x00;
  // Address for brightness register
  var SP_BRIGHTNESS_COMMAND = 0x19;
  // Configuration register set to 5x11 LED matrix
  var SP_MODE_5X11 = new Uint8Array(1).fill(0x03);
  //buffer for pixel data which will be written the matrix 1 data register
  var buffer = new Uint8Array(12).fill(0x00);
  //After the 11 columns, we need to send 0xFF to finish the message to the I2C slave
  buffer[11] = 0xff;
  // Buffer for brightness level
  var brightness = new Uint8Array(1);
  
  var initok = (function() {
    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_MODE_COMMAND, 1, SP_MODE_5X11);
      scrollphat.closeSync();
      console.log("Init OK");
    } catch (e) {
      throw ("Failed to initialise scrollphat: " + e);
      return false;
    }
  })();

  function spSetPixelNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      if (scrollphat.hasOwnProperty("_forceAccess")) {
        node.status({fill: "green", shape: "dot", text: "connected"});
      } else
      {
        node.status({fill: "red", shape: "ring", text: "error"});
        throw "I2C connection error";
      }
    } catch (e) {
      node.error("There was a problem: " + e);
    }

    node.on("input", function(msg) {
      // Preflight check on msg.payload - must have a row, a column and a value (true/false for on/off)
      if (typeof msg.payload.x === "number" && typeof msg.payload.y === "number" && typeof msg.payload.value === "boolean") {
        if ( 0 > msg.payload.x || msg.payload.x > 10) { node.error("Column is out of bounds", msg); }
        if ( 0 > msg.payload.y || msg.payload.y > 31) { node.error("Row is out of bounds", msg); }
        
        node.xPos = msg.payload.x || 0;
        node.yPos = msg.payload.y || 0;
        node.ledValue = msg.payload.value || false;
        node.additive = msg.payload.additive && true;

        //Add LEDs to existing pattern by default or reset to just new pixel if user specifically sets msg.payload.additive to false
        if (node.additive === false){ buffer.fill(0x00,0,11); }

        //This is transcribed from set_pixel in https://github.com/pimoroni/scroll-phat/blob/master/library/scrollphat/IS31FL3730.py
        //Lots of bitwise shifting to set the right pixel in column x ( buffer elements 0-10) and row y (bits 0-4).
        if (node.ledValue) { buffer[node.xPos] |= (1 << node.yPos); } else { buffer[node.xPos] &= ~(1 << node.yPos); }
      }

      //Write the entire buffer to the Scroll Phat
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_COMMAND, 12, buffer);
    });
    node.on("close", function() {
      try {
        scrollphat.closeSync();
        if (scrollphat._peripherals.length === 0) {
          //node.warn("Scroll Phat i2c connection closed.");
        } else {throw "Failed to close scrollphat connection";}
      } catch (e) {
        node.error("Error: " + e);
      }
    });
  }

  function spClearNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      if (scrollphat.hasOwnProperty("_forceAccess")) {
        node.status({fill: "green", shape: "dot", text: "connected"});
      } else {
        node.status({fill: "red", shape: "ring", text: "error"});
        throw "I2C connection error";
      }
    } catch (e) {
      node.error("There was a problem: " + e);
    }

    node.on("input", function(msg) {
      // Preflight check on msg.payload
      if (msg.payload === true || msg.payload.toString().toLowerCase() === "on" || msg.payload === 1) {
        buffer.fill(0x1F,0,11);
      } else if (msg.payload === false || msg.payload.toString().toLowerCase() === "off" || msg.payload === 0) {
        buffer.fill(0x00,0,11);
      } else {
        node.warn("Invalid Scroll pHAT clear msg.payload");
      }

      //Write the entire buffer to the Scroll Phat
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_COMMAND, 12, buffer);
    });
    node.on("close", function() {
      try {
        scrollphat.closeSync();
        if (scrollphat._peripherals.length === 0) {
          // node.warn("Scroll Phat i2c connection closed.");
        } else {throw "Failed to close scrollphat connection";}
      } catch (e) {
        node.error("Error: " + e);
      }
    });
  }

  function spBrightnessNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      if (scrollphat.hasOwnProperty("_forceAccess")) {
        node.status({fill: "green", shape: "dot", text: "connected"});
      } else {
        node.status({fill: "red", shape: "ring", text: "error"});
        throw "I2C connection error";
      }
    } catch (e) {
      node.error("There was a problem: " + e);
    }

    node.on("input", function(msg) {
      // Preflight check on msg.payload
      if (msg.payload >= 0 && msg.payload <= 100) {
        //Need an integer that's definitely between 0 and 128
        brightness[0] = Math.max(0,(Math.min(128,(Math.round((128*msg.payload) / 100)))));
      } else {
        node.warn("Invalid Scroll pHAT brightness level");
      }

      //Write the entire buffer to the Scroll Phat
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_BRIGHTNESS_COMMAND, 1, brightness);
    });
    node.on("close", function() {
      try {
        scrollphat.closeSync();
        if (scrollphat._peripherals.length === 0) {
          // node.warn("Scroll Phat i2c connection closed.");
        } else {throw "Failed to close scrollphat connection";}
      } catch (e) {
        node.error("Error: " + e);
      }
    });
  }

  function spColumnNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      if (scrollphat.hasOwnProperty("_forceAccess")) {
        node.status({fill: "green", shape: "dot", text: "connected"});
      } else {
        node.status({fill: "red", shape: "ring", text: "error"});
        throw "I2C connection error";
      }
    } catch (e) {
      node.error("There was a problem: " + e);
    }

    node.on("input", function(msg) {
      // Preflight check on msg.payload
      if (msg.payload.x >= 0 && msg.payload.x <= 10) {
        //set percent if not set; correct invalid percentage
        var spPercent = Math.max(0,Math.min(100,msg.payload.percent)) || 100;
        buffer[msg.payload.x] = 0x00;
        switch (true) {
          case spPercent == 100:
            buffer[msg.payload.x] |= (1 << 0);
          case spPercent >= 80:
            buffer[msg.payload.x] |= (1 << 1);
          case spPercent >= 60:
            buffer[msg.payload.x] |= (1 << 2);
          case spPercent >= 40:
            buffer[msg.payload.x] |= (1 << 3);
          case spPercent >= 20:
            buffer[msg.payload.x] |= (1 << 4);
            break;
          default:
        }
      } else {
        node.warn("Invalid column specified");
      }
      
      //Write the entire buffer to the Scroll Phat
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_COMMAND, 12, buffer);
    });
    node.on("close", function() {
      try {
        scrollphat.closeSync();
        if (scrollphat._peripherals.length === 0) {
          // node.warn("Scroll Phat i2c connection closed.");
        } else {throw "Failed to close scrollphat connection";}
      } catch (e) {
        node.error("Error: " + e);
      }
    });
  }

  function spRowNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    try {
      var scrollphat = i2c.openSync(BUS_ADDRESS);
      if (scrollphat.hasOwnProperty("_forceAccess")) {
        node.status({fill: "green", shape: "dot", text: "connected"});
      } else {
        node.status({fill: "red", shape: "ring", text: "error"});
        throw "I2C connection error";
      }
    } catch (e) {
      node.error("There was a problem: " + e);
    }

    node.on("input", function(msg) {
      // Preflight check on msg.payload
      if (msg.payload.y >= 0 && msg.payload.y <= 4) {
        //set percent if not set; correct invalid percentage
        var spPercent = Math.max(0,Math.min(100,msg.payload.percent)) || 100;
        for (var ix = 0; ix < 11; ix++){
          if (spPercent >= 100*((ix+1)/11) ) {
            buffer[ix] |= (1 << msg.payload.y);
          } else {
            buffer[ix] &= ~(1 << msg.payload.y);
          }
        }
      } else {
        node.warn("Invalid row specified");
      }
      
      //Write the entire buffer to the Scroll Phat
      scrollphat.writeI2cBlockSync(SP_ADDRESS, SP_COMMAND, 12, buffer);
    });
    node.on("close", function() {
      try {
        scrollphat.closeSync();
        if (scrollphat._peripherals.length === 0) {
          // node.warn("Scroll Phat i2c connection closed.");
        } else {throw "Failed to close scrollphat connection";}
      } catch (e) {
        node.error("Error: " + e);
      }
    });
  }
  RED.nodes.registerType("spSetPixel", spSetPixelNode);
  RED.nodes.registerType("spClear", spClearNode);
  RED.nodes.registerType("spBrightness", spBrightnessNode);
  RED.nodes.registerType("spColumn", spColumnNode);
  RED.nodes.registerType("spRow", spRowNode);
};
