import { Command } from 'commander'
import { serve } from './server.js'
import { getDeviceCharacteristicMenu } from './device.js'
import { print } from './print.js'

// ---------------------------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------------------------

// for cli and server, start the command menu
const program = new Command();
program
  .option('-f, --file <path>', 'path for image to print', './res/cache/burger.png')
  .option('-s, --scale <size>', 'percent scale at which the image should print (1-100)', 100)
  .option('-d, --dither <dither>', 'flag to dither the passed image', false)
  .option('-p, --port <port>', 'port to start print server');

// setup
const { port, file, scale, dither } = program.parse(process.argv).opts();

// mode
console.log(`Operating as: ${port ? 'server' : 'printer'}`)

// get device
export const characteristic = await getDeviceCharacteristicMenu();

// if we've a port, start a server
if (port) {
  serve(port, (file, dither) => print(characteristic, file, scale, dither))
}

// otherwise, print supplied image
else {
  void print(characteristic, file, scale, dither)
}
