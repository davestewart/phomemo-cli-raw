import noble from '@abandonware/noble'
import { confirm, select } from '@inquirer/prompts'
import { Spinner } from 'cli-spinner'

export const SCAN_AGAIN = 'SCAN_AGAIN'
export const QUIT = 'QUIT'

export let discoveredDevices = {};

export async function getDeviceCharacteristicMenu () {
  let scanDurationInMs = 5000
  do {
    await scanDevices(scanDurationInMs)
    const choice = await selectDevice()

    if (choice === SCAN_AGAIN) {
      scanDurationInMs = 10000 // Try a longer duration the second time
      void scanDevices()
    }
    else if (choice === QUIT) {
      process.exit()
    }
    else {
      // Let's see if we can write to this device.
      let peripheral = discoveredDevices[choice]
      const characteristic = await getWritableCharacteristic(peripheral)

      // Looks like we can't write to this device.
      if (!characteristic) {
        const tryAgain = await promptTryAgain()
        if (tryAgain) {
          continue
        }
        else {
          process.exit()
        }
      }
      else {
        // We can write to the device, so send the characteristic.
        return characteristic
      }
    }
  } while (true)
}

async function scanDevices (scanDurationInMs = 5000) {
  discoveredDevices = {}

  const spinner = new Spinner('Scanning bluetooth devices.. %s')
  spinner.setSpinnerString('|/-\\')
  spinner.start()
  noble.on('discover', async (peripheral) => {
    const { localName } = peripheral.advertisement
    if (localName === undefined || localName.trim().length === 0) {
      return
    }
    discoveredDevices[localName] = peripheral
  })
  noble.startScanningAsync()

  await delay(scanDurationInMs)

  await noble.stopScanningAsync()
  spinner.stop(true)
}

async function selectDevice () {
  const choices = []
  for (const key in discoveredDevices) {
    choices.push({
      value: key,
    })
  }
  choices.push({
    name: '- Scan again',
    value: SCAN_AGAIN,
  })

  choices.push({
    name: '- Quit',
    value: QUIT,
  })

  const prompt = {
    message: 'Select your bluetooth printer',
    choices,
    pageSize: 12,
  }
  return select(prompt)
}

async function getWritableCharacteristic (peripheral) {
  await peripheral.connectAsync()
  const { characteristics } = await peripheral.discoverAllServicesAndCharacteristicsAsync()
  const [characteristic] = characteristics.filter(characteristic => {
    return characteristic.properties.includes('write')
  })
  return characteristic
}

async function promptTryAgain () {
  console.log('dang it doesn\'t look like we can print to this device 😕')
  return confirm({ message: 'want to try again?' })
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
