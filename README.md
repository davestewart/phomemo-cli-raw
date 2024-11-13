## cli-phomemo-printer

> A Node JS package to enabling printing to a Phomemo printer

## Overview

The [Phomemo M02 S/Pro](https://eu.phomemo.com/products/m02-pro-portable-printer) is pocket-sized, bluetooth thermal label printer:

![Phomemo MO2 Pro](https://eu.phomemo.com/cdn/shop/files/Cyan-Phomemo-M02-PRO-Bluetooth-Mini-Printer-High-Quality-Printing-Multiple-Thermal-Stickers_1220x_crop_center.png?v=1729060454)

This package enables you to print directly to the printer using Node JS, from both local files, or via the browser through a local Express server.

## Setup

### Bluetooth

For the package to connect to the printer over Bluetooth, OSX needs to give permissions to the application running Node JS.

This will most likely be your Terminal app or your IDE. 

Navigate to **System Settings** > **Privacy & Security** > **Bluetooth**, and add any apps which will need to communicate with the printer.

> Note that you **should not** connect to the printer via Bluetooth settings – or else the CLI will be unable to find the printer.  

### Installation

Next, clone the repository directly from GitHub:

```bash
git clone git@github.com:davestewart/phomemo-cli.git
cd phomemo-cli
npm install
```

### Running

Once set up, you can run the CLI in `printer` or `server` mode.

Before starting, it will first attempt to connect to the printer (see the [Troubleshooting](#troubleshooting) section if you have issues).

#### Printer Mode

Passing a file path via `-f` will run the CLI in "printer" mode:

```bash
node src -f path/to/file.jpg
```

If you the main file without any command-line arguments, you'll print out a sample burger sticker.

#### Server Mode

Passing a port  via `-p` will run the CLI in "server" mode:

```bash
node src -p 4000
```

The package's scripts are set up to run a server the same way:

```bash
npm run serve
```

You can then `POST` to `http://localhost:4000/print` to print images to the printer.

You may pass CLI arguments as query strings, for example:

```
http://localhost:4000/print?scale=28&dither=1
```

Note that any CLI arguments (i.e. `-d`) and query string values will be combined in the final print function, so the following would print a dithered image at 50%:

```
// bash
node src -d

// http
http://localhost:4000/print?scale=50
```

### CLI arguments

The full CLI arguments are:

```
Options:
  -f, --file      image file path to print 
  -p, --port      port to start print server (default: 4000)
  -d, --dither    flag to dither the printed output (default: 0)
  -s, --scale     percent to scale the printed output (1-100+) (default: 100)
  -h, --help      display help for command
```

## Image and label sizes

The printer's default label size is 53mm, with images expected to be 560px wide (or they will be resized to fit).

If you want to print on [smaller labels](https://www.amazon.co.uk/s?k=phomemo+labels) you will need to tweak the printer's `scale` setting, via either command line arguments or query parameters:

| Label Size     | Image Width | CLI     | Server      |
|----------------|-------------|---------|-------------|
| 53mm (default) | 560px       | None    | None        |
| 25mm           | 264px       | `-s 47` | `?scale=47` |
| 15mm           | 158px       | `-s 28` | `?scale=28` |

## Troubleshooting

### Connection

It may take several attempts to find the printer:

```bash
> phomemo-cli@1.0.0 serve
> node src -p 4000

Operating as: server
? Select your bluetooth printer - Scan again
? Select your bluetooth printer - Scan again
? Select your bluetooth printer (Use arrow keys)
❯ M02 Pro
  - Scan again
  - Quit
```

If the printer does not show in the list:

- make sure the printer is turned on
- make sure you did not connect to the printer using the system dialog
- don't run two scripts attempting to access the printer at the same time

### Battery

A flashing light on the printer then loss of power probably means that the printer needs charging.

Note that:

- the printer will only charge from a basic mobile phone charger, or a USB cable attached to a laptop
- attaching a more powerful charger (such as a laptop) will cause the printer not to charge
- you can use the Phomemo app to monitor the charge level

### Other printers

If you're not using the Phomemo M02S/Pro, you will need to edit `src/print.js` and change `BYTES_PER_LINE` to match your printer.

> Note that the value of `70` for the MO2 was determined through trial and error

## Credits

The [original repo](https://github.com/vrk/cli-phomemo-printer) and printing functionality was created by [Victoria Kirst](https://github.com/vrk) – thanks to the very helpful breadcrumbs left by:

- [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools): lifesaver for having the protocol documented & providing the general algorithm
- [Phomemo Thermal Printing On MacOS](https://brainbaking.com/post/2023/02/phomemo-thermal-printing-on-macos/): gave me faith that this was even possible!

The additional server functionality, Sharp migration, code refactor and improved docs were added by [Dave Stewart](https://github.com/davestewart).
