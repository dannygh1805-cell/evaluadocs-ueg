const Jimp = require('jimp');
const fs = require('fs');

async function processImage() {
  try {
    const image = await Jimp.read('C:/Users/danny/Downloads/SELLO UEG OK.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is very close to white, make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // set alpha to 0
      }
    });
    
    const base64 = await image.getBase64Async(Jimp.MIME_PNG);
    fs.writeFileSync('c:/UEG_REVISON_ESTUDIO_DE_CASO/src/assets/selloBase64.js', 'export const selloBase64 = "' + base64 + '";');
    console.log('Background removed and saved to base64 module.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

processImage();
