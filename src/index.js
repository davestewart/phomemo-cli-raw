import Fs from "fs"
import { Command } from 'commander'
import { getDeviceCharacteristicMenu } from './device.js'
import { serve } from './server.js'
import { parseSettings, print } from './print.js'

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

// options
const options = program.parse(process.argv).opts()
const settings = parseSettings(options)
const { port, file } = options

// debug
console.log(`Mode: ${port ? 'Server' : 'Printer'}`)
console.log('Settings:', settings)

// get device
export const characteristic = await getDeviceCharacteristicMenu()

// ---------------------------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------------------------

// if we've a port, start a server
if (port) {
  serve(port, characteristic, settings)
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
  const { scale, dither } = settings
  void print(characteristic, target, scale, dither)
}
