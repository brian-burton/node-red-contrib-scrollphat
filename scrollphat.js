// http://www.issi.com/WW/pdf/31FL3730.pdf for LED driver chip spec
module.exports = function(RED) {
  function ScrPhatSetPixelNode(config) {
    RED.nodes.createNode(this,config);
    // node-specific code goes here
    var i2c = require('i2c');
    //Scroll Phat bus ID is 0x60; I2C sets the default device to /dev/i2c-1
    var wire = new i2c(0x60);
    var context = this.context();
    var buffer = context.get("ledbuffer") || new ArrayBuffer(12);
    var buffer_view = new Uint8Array(buffer);  
    
    this.on('input', function(msg) {
      // Preflight check on msg.payload
      this.warn("Hi!");
      this.warn("X is " + typeof msg.payload.x);
      this.warn("Y is " + typeof msg.payload.y);
      this.warn("Value is " + typeof msg.payload.value);
      if (typeof msg.payload.x === "number" && typeof msg.payload.y === "number" && typeof msg.payload.value === "boolean") {
	this.warn("Got here");
        if ( 0 > msg.payload.x || msg.payload.x > 10) { this.error("Column is out of bounds", msg); }
        if ( 0 > msg.payload.y || msg.payload.y > 31) { this.error("Row is out of bounds", msg); }
        
        //Clear previous by default or add pixels if user specifically sets msg.payload.additive to True
        if (!msg.payload.additive){ buffer_view = [0,0,0,0,0,0,0,0,0,0,0,0]; }
        
        //This is transcribed from set_pixel in https://github.com/pimoroni/scroll-phat/blob/master/library/scrollphat/IS31FL3730.py
        //Lots of bitwise shifting to set the right pixel in column x (0-10) and row y (0-4).
        if (msg.payload.value) { buffer_view[msg.payload.x] |= (1 << msg.payload.y); }
        else { buffer_view[msg.payload.x] &= ~(1 << msg.payload.y); }
      }
      
      //After the 11 columns, we need to send 0xFF to finish the message to the I2C slave
      buffer_view[11] = 0xff;
      this.warn(buffer_view);
      
      //Actually write the entire buffer to the Scroll Phat
      //0x01 specifies the starting address for the matrix 1 data register
      wire.writeBytes(0x01, buffer, function(err) {
          //this.warn(typeof err);
          switch (err) {
              case null:
                  //this.warn("Scroll Phat success!");
                  break;
              default:
                  //Log errors, but I haven't had any so far, so not sure what to log!
                  //this.error("Failed to send to Scroll Phat: " + err, msg);
          }
      });
      
      //Save the buffer for next time because we can't read from the IS31FL3730 LED driver
      context.set("ledbuffer",buffer);
    });
    this.on('close', function() {
      wire.close();
    });
  }

  RED.nodes.registerType("ScrPhatSetPixel",ScrPhatSetPixelNode);
}
