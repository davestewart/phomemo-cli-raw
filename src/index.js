import { Command } from 'commander'
import { parseOptions } from './services/options.js'
import { getDevice, getDeviceMenu } from './services/device.js'
import { printer as print } from './printer.js'
import { serve } from './server.js'
import { log } from './services/utils.js'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

// show command menu
const program = new Command()
program
  // device
  .option('--device <device>', 'choose a named device', '')
  .option('--no-device', 'skip choosing a device')

  // server
  .option('--port <port>', 'port to start print server')

  // image
  .option('--file <path>', 'path for image to print', '')
  .option('--scale <size>', 'percent scale at which the image should print (1-100)', '100')
  .option('--dither', 'flag to dither the passed image', false)

  // dev
  .option('--cache', 'maintain cache folder of printed images', false)
  .option('--debug', 'maintain debug image folder and dump console logs', false)

// options
const args = program.parse(process.argv).opts()
const options = parseOptions(args)
const { port, file, device } = args

// debug
log(`\nMode: ${port ? 'Server' : 'Printer'}`)
if (options.debug) {
  log('Params:', args)
  log('Options:', options)
}

// get device
export const characteristic = device !== false
  ? device
    ? await getDevice(device)
    : await getDeviceMenu()
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
  void print(characteristic, file, options)
}

