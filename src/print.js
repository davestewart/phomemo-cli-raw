import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import { PNG } from 'pngjs'
import floydSteinberg from 'floyd-steinberg'

// ---------------------------------------------------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------------------------------------------------

/*
 * NOTE: You need to change BYTES_PER_LINE to match the size of your printer's output.
 *
 * Tbh I'm not sure what's the right way to calculate this properly; I just guessed & checked until
 * I got an image that printed full-width!
 */
export const BYTES_PER_LINE = 70
export const IMAGE_WIDTH = BYTES_PER_LINE * 8

export const CACHE_DIR = 'res/cache/'
export const TEMP_DIR = 'res/temp/'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

// create folders
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR);
}
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR);
}

// ---------------------------------------------------------------------------------------------------------------------
//  functions
// ---------------------------------------------------------------------------------------------------------------------

export async function print (characteristic, file, scale = 1, dither = false) {
  const path = await makeTempImage(file, scale, dither)
  const data = await getPrintDataFromPort(path)
  console.log('printing:', file, path, data.length)
  characteristic.write(Buffer.from(data), true)
}

export async function getPrintDataFromPort (printableImgPath) {
  const pic = await Jimp.read(printableImgPath)
  let remaining = pic.bitmap.height
  let printData = []
  let index = 0

  // ********
  // FROM https://github.com/vivier/phomemo-tools/tree/master#31-header
  // PRINTING HEADER

  // Initialize printer
  printData[index++] = 27
  printData[index++] = 64

  // Select justification
  printData[index++] = 27
  printData[index++] = 97

  // Justify (0=left, 1=center, 2=right)
  printData[index++] = 0

  // End of header
  printData[index++] = 31
  printData[index++] = 17
  printData[index++] = 2
  printData[index++] = 4
  // ********

  let line = 0

  while (remaining > 0) {
    let lines = remaining
    if (lines > 256) {
      lines = 256
    }

    // ********
    // FROM https://github.com/vivier/phomemo-tools/tree/master#32-block-marker
    // PRINTING MARKER

    // Print raster bit image
    printData[index++] = 29
    printData[index++] = 118
    printData[index++] = 48

    // Mode: 0=normal, 1=double width, 2=double height, 3=quadruple
    printData[index++] = 0

    // Bytes per line
    printData[index++] = BYTES_PER_LINE
    printData[index++] = 0

    // Number of lines to print in this block.
    printData[index++] = lines - 1
    printData[index++] = 0
    // ********

    remaining -= lines

    while (lines > 0) {
      // ******
      // PRINT LINE
      for (let x = 0; x < BYTES_PER_LINE; x++) {
        let byte = 0

        for (let bit = 0; bit < 8; bit++) {
          const rgba = Jimp.intToRGBA(pic.getPixelColor(x * 8 + bit, line))
          if (rgba.r === 0 && rgba.a !== 0) {
            byte |= 1 << (7 - bit)
          }
        }
        if (byte === 0x0a) {
          byte = 0x14
        }
        printData[index++] = byte
      }
      // ******
      lines--
      line++
    }
  }

  // ******
  // FROM: https://github.com/vivier/phomemo-tools/tree/master#33-footer
  // PRINT FOOTER

  // command ESC d : print and feed n lines (twice)
  printData[index++] = 27
  printData[index++] = 100
  printData[index++] = 2

  printData[index++] = 27
  printData[index++] = 100
  printData[index++] = 2

  // just footer codes now

  // b'\x1f\x11\x08'
  printData[index++] = 31
  printData[index++] = 17
  printData[index++] = 8
  // \x1f\x11\x0e
  printData[index++] = 31
  printData[index++] = 17
  printData[index++] = 14

  // x1f\x11\x07
  printData[index++] = 31
  printData[index++] = 17
  printData[index++] = 7

  // b'\x1f\x11\x09'
  printData[index++] = 31
  printData[index++] = 17
  printData[index++] = 9

  return printData
}

export async function makeTempImage (imgPath, scale, dither = false) {
  let originalFileName = Path.basename('path')
  if (!originalFileName) {
    throw new Error()
  }
  let pic = await Jimp.read(imgPath)
  const scalePercentage = Math.max(scale / 100.0, 0.01)
  const scaledWidth = Math.floor(scalePercentage * IMAGE_WIDTH)

  // Scale the given image to the desired size.
  const tempPath = imgPath.replace(CACHE_DIR, TEMP_DIR)
  pic = pic.resize(scaledWidth, Jimp.AUTO)

  // Scale a transparent background to the width expected by the printer, and the height of the scaled image.
  let transparentBackground = await Jimp.read('./res/transparent-square.png')
  transparentBackground = transparentBackground.resize(IMAGE_WIDTH, pic.bitmap.height)
  const x = IMAGE_WIDTH - pic.bitmap.width
  const composedPic = transparentBackground.composite(pic, x, 0)

  await composedPic.writeAsync(tempPath)

  // TODO: Swap out dithering library for something that works better with B&W images.
  return dither
    ? convertToDithered(tempPath)
    : tempPath
}

export async function convertToDithered (path) {
  return new Promise((resolve) => {
    createReadStream(path).pipe(new PNG()).on('parsed', function () {
      floydSteinberg(this).pack().pipe(createWriteStream(path))
      resolve(path)
    })
  })
}
