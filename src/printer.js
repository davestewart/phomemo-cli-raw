import Fs from 'fs'
import { log } from './services/utils.js'
import { print } from './services/print.js'

export async function printer (characteristic, file, options) {
  let target = file

  // copy test image if no file supplied
  if (file === '') {
    target = './res/assets/burger.png'
    options.dither = true
  }

  // print
  log('Starting printer...')
  try {
    await print(characteristic, target, options)
    process.exit(0)
  }
  catch (err) {
    console.log(err)
    process.exit(1)
  }
}
