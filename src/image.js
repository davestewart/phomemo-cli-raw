import Sharp from 'sharp'
import floydSteinberg from 'floyd-steinberg'
import { PNG } from 'pngjs'

/**
 * Prepare the image for printing
 *
 * @param   {string}    file      The path to the image to process
 * @param   {number}    width     The target width of the image (should match printer width)
 * @param   {number}    [scale]   An optional scale factor to print narrower labels
 * @param   {boolean}   [dither]  An optional flag to dither color images
 * @param   {boolean}   [debug]   An optional flag to output debug info and save interim images
 * @returns {Promise<sharp.Sharp>}
 */
export async function prepareImage (file, width, scale = 100, dither = false, debug = false) {
  // load the file
  let image = Sharp(file)

  // debug
  debugImage(image, '1_original', debug)

  // fit or scale image
  image = scale === 100
    ? await fitImage(image, width)
    : await scaleImage(image, width, scale)

  // debug
  debugImage(image, '2_resized', debug)

  // optionally dither
  if (dither) {
    image = await ditherImage(image)
    debugImage(image, '3_dithered', debug)
  }

  // debug
  const metadata = await image.metadata()
  if (debug) {
    console.log('debug:', { file, scale, dither, metadata })
  }

  // return
  return image
}

/**
 * Fit image to the default printer label width
 *
 * @param   {sharp.Sharp}   image     The sharp image
 * @param   {number}        width     The printer target width
 * @returns {sharp.Sharp}
 */
function fitImage (image, width) {
  return image.resize(width, null)
}

/**
 * Scale and center image for smaller printer label widths
 *
 * @param   {sharp.Sharp}   image     The sharp image
 * @param   {number}        width     The printer target width
 * @param   {number}        scale     An additional scale
 * @returns {sharp.Sharp}
 */
export async function scaleImage (image, width, scale = 100) {
  try {
    // get metadata
    const metadata = await image.metadata()
    const originalWidth = metadata.width
    const originalHeight = metadata.height

    // calculate new dimensions
    const s = scale / 100
    const newWidth = Math.round(originalWidth * s)
    const newHeight = Math.round(originalHeight * s)

    // create resized image
    const resized = await image.resize(newWidth, null)

    // create transparent background with original width
    const background = await Sharp({
      create: {
        width: originalWidth,
        height: newHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })

    // composite the images
    return background
      .composite([{
        input: await resized.toBuffer(),
        gravity: 'center',
      }])
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`)
  }
}

/**
 * Dither the image
 *
 * @param   {sharp.Sharp}     image
 * @returns {Promise<sharp.Sharp>}
 */
async function ditherImage (image) {
  try {
    // create PNG to dither
    const metadata = await image.metadata()
    const png = new PNG({
      width: metadata.width,
      height: metadata.height,
    })

    // extract raw image data
    const rawBuffer = await image
      .raw()
      .ensureAlpha()
      .toBuffer()

    // prepare PNG and dither
    rawBuffer.copy(png.data)
    const ditheredPng = floydSteinberg(png)

    // read the results of the dithered image and return a new sharp image
    return new Promise((resolve, reject) => {
      const chunks = []
      ditheredPng
        .pack()
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => {
          const buffer = Buffer.concat(chunks)
          resolve(Sharp(buffer))
        })
        .on('error', reject)
    })
  } catch (error) {
    throw new Error(`Buffer processing failed: ${error.message}`)
  }
}


/**
 * Optionally save a copy of the image during processing
 *
 * @param   {sharp.Sharp}   image     The sharp image
 * @param   {string}        name      The name of the saved image (no extension)
 * @param   {boolean}       debug     Whether to save or not
 */
function debugImage (image, name, debug) {
  if (debug) {
    void image.toFile(`./res/debug/${name}.png`)
  }
}
