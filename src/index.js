import Fs from "fs"
import { Command } from 'commander'
import { parseOptions } from './services/options.js'
import { getDeviceCharacteristicMenu } from './services/device.js'
import { print } from './services/print.js'
import { serve } from './server.js'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

// show command menu
const program = new Command()
program
  .option('-p, --port <port>', 'port to start print server')
  .option('-f, --file <path>', 'path for image to print')
  .option('-s, --scale <size>', 'percent scale at which the image should print (1-100)', '100')
  .option('-d, --dither', 'flag to dither the passed image', false)
  .option('-c, --cache', 'maintain the cache of printed images', false)
  .option('--debug', 'maintain debug images and dump console logs', false)
  .option('--no-setup', 'skip printer setup')

// options
const args = program.parse(process.argv).opts()
const options = parseOptions(args)
const { port, file, setup } = args

// debug
console.log(`Mode: ${port ? 'Server' : 'Printer'}`)
console.log('Options:', options)
console.log('Args:', args)

// get device
export const characteristic = setup
  ? await getDeviceCharacteristicMenu()
  : null

// ---------------------------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------------------------

// if we've a port, start a server
if (port) {
  serve(port, characteristic, options)
}

// otherwise, print supplied or test image
else {
  let target = file

  // copy test image if no file supplied
  if (!file) {
    const source = './res/assets/burger.png'
    target = source.replace('assets', 'cache')
    Fs.copyFileSync(source, target)
  }

  // print
  void print(characteristic, target, options)
}
