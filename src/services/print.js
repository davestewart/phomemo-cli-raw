import Fs from 'fs'
import { prepareImage } from './image.js'
import { log } from './utils.js'

// ---------------------------------------------------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------------------------------------------------

// See note in docs for printers other than Phomemo M02
export const BYTES_PER_LINE = 70
export const IMAGE_WIDTH = BYTES_PER_LINE * 8

// ---------------------------------------------------------------------------------------------------------------------
// main functions
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Main print function
 *
 * @param   {object}    characteristic
 * @param   {string}    file
 * @param   {Options}   options
 * @returns {Promise<sharp.Metadata>}
 */
export async function print (characteristic, file, options) {
  return new Promise(async (resolve, reject) => {
    // check file exists
    if (!file) {
      return reject(`Missing file path`)
    }
    if (!Fs.existsSync(file)) {
      return reject(`File "${file}" not found`)
    }

    // options
    const { scale, dither, debug } = options

    // process image
    const image = await prepareImage(file, IMAGE_WIDTH, scale, dither, debug)

    // prepare data
    const { data, metadata } = await prepareData(image)

    // print
    // @see https://github.com/davestewart/phomemo-cli/pull/6
    if (characteristic) {
      log(`Printing image "${file}" ...`)
      characteristic.write(data, true)
    }

    // resolve
    resolve(metadata)
  })
}

/**
 * Convert Sharp image to printer data
 *
 * @param   {sharp.Sharp}   image     The sharp image
 * @returns {Promise<{data:Buffer<ArrayBuffer>, metadata: sharp.Metadata}>}
 */
async function prepareData (image) {
  // helper function to get pixel RGBA values at specific coordinates
  function getPixelAt (x, y) {
    const pos = (y * width + x) * 4 // 4 channels (RGBA)
    return {
      r: raw[pos],
      g: raw[pos + 1],
      b: raw[pos + 2],
      a: raw[pos + 3],
    }
  }

  // image data
  const metadata = await image.metadata()
  const { width, height } = metadata
  const raw = await image
    .ensureAlpha()
    .raw()
    .toBuffer()

  // variables
  let remaining = height
  let data = []
  let index = 0

  // ********
  // FROM https://github.com/vivier/phomemo-tools/tree/master#31-header
  // PRINTING HEADER

  // Initialize printer
  data[index++] = 27
  data[index++] = 64

  // Select justification
  data[index++] = 27
  data[index++] = 97

  // Justify (0=left, 1=center, 2=right)
  data[index++] = 0

  // End of header
  data[index++] = 31
  data[index++] = 17
  data[index++] = 2
  data[index++] = 4
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
    data[index++] = 29
    data[index++] = 118
    data[index++] = 48

    // Mode: 0=normal, 1=double width, 2=double height, 3=quadruple
    data[index++] = 0

    // Bytes per line
    data[index++] = BYTES_PER_LINE
    data[index++] = 0

    // Number of lines to print in this block.
    data[index++] = lines - 1
    data[index++] = 0
    // ********

    remaining -= lines

    while (lines > 0) {
      // PRINT LINE
      for (let x = 0; x < BYTES_PER_LINE; x++) {
        let byte = 0

        for (let bit = 0; bit < 8; bit++) {
          const rgba = getPixelAt(x * 8 + bit, line)
          if (rgba.r === 0 && rgba.a !== 0) {
            byte |= 1 << (7 - bit)
          }
        }

        if (byte === 0x0a) {
          byte = 0x14
        }

        data[index++] = byte
      }

      lines--
      line++
    }
  }

  // ******
  // FROM: https://github.com/vivier/phomemo-tools/tree/master#33-footer
  // PRINT FOOTER

  // command ESC d : print and feed n lines (twice)
  data[index++] = 27
  data[index++] = 100
  data[index++] = 2

  data[index++] = 27
  data[index++] = 100
  data[index++] = 2

  // just footer codes now

  // b'\x1f\x11\x08'
  data[index++] = 31
  data[index++] = 17
  data[index++] = 8
  // \x1f\x11\x0e
  data[index++] = 31
  data[index++] = 17
  data[index++] = 14

  // x1f\x11\x07
  data[index++] = 31
  data[index++] = 17
  data[index++] = 7

  // b'\x1f\x11\x09'
  data[index++] = 31
  data[index++] = 17
  data[index++] = 9

  // return
  return {
    data: Buffer.from(data),
    metadata,
  }
}
