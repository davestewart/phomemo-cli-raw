## cli-phomemo-printer

> A Node JS package enables printing to a Phomemo printer

## Overview

The [Phomemo M02 S/Pro](https://eu.phomemo.com/products/m02-pro-portable-printer) is pocket-sized, bluetooth thermal printer that outputs to both paper and transparent labels:

![Phomemo MO2 Pro](https://eu.phomemo.com/cdn/shop/files/Cyan-Phomemo-M02-PRO-Bluetooth-Mini-Printer-High-Quality-Printing-Multiple-Thermal-Stickers_1220x_crop_center.png?v=1729060454)

This package enables you to print directly to the printer using Node JS, from both local files, or via the browser through a local express server.

## Setup

### Bluetooth

For the package to connect to to the printer, OSX needs to give permissions to the application running Node JS. This will most likely be your terminal app or your IDE. 

Navigate to System Settings > Privacy & Security > Bluetooth, and then add your preferred terminal app (e.g. iTerm) to allow it to connect to Bluetooth.

> Note that you **should not** connect to the printer in the Bluetooth settings, or else the CLI will be unable to find the printer.  

### Installation

Next, clone the repository directly from GitHub:

```bash
git clone git@github.com:davestewart/phomemo-cli.git
cd phomemo-cli
npm install
```

### Running

Once set up, you can run the CLI in `server` or `printer` mode.

Before starting, it will first attempt to connect to the printer (see the [Troubleshooting](#troubleshooting) section if you have issues).

#### Server

Run this command to start the web server on port 4000:

```bash
npm run serve
```

You will then be able to `POST` to `http://localhost:4000/print` to print images to the printer.

Pass CLI arguments as query strings, for example:

```
http://localhost:4000/print?dither=50scale=28
```

#### Printer

Run this command to print a file directly using the `-f` param:

```bash
node src -f path/to/file.jpg
```

If you run this command without command-line arguments, you'll print out a burger sticker.

#### CLI args

```
Options:
  -f, --file      file path to file to print 
  -p, --port      port to start print server (default: 4000)
  -s, --scale     scale (percent) the printed output (1-100+) (default: 100)
  -d, --dither    dither the printed output (0-100) (default: 50)
  -h, --help      display help for command
```

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

### Paper size

Various sized [labels](https://www.amazon.co.uk/s?k=phomemo+labels) are available for the Phomemo printer. If you're printing using smaller labels than the default, you'll need to scale the output using the `-s` flag.

| Label Size     | CLI     | Server      |
|----------------|---------|-------------|
| 53mm (default) | None    | None        |
| 25mm           | `-s 47` | `?scale=47` |
| 15mm           | `-s 28` | `?scale=28` |

### Battery

A flashing light on the printer then loss of power probably means that the printer needs charging.

Note that:

- the printer will only charge from a basic mobile phone charger, or a USB cable attached to a laptop.
- attaching a more powerful charger (such as a laptop) will cause the printer not to charge.
- you can use the Phomemo app to monitor the charge level.

### Other printers

If you're not using the Phomemo M02S/Pro, you will need to edit `src/print/index.js` to change `BYTES_PER_LINE` to match your paper.

There is not a technique for this; "guess & check" was originally used to figure it out.



## Credits

This code was cobbled together by reading the very helpful breadcrumbs left by:

- [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools): lifesaver for having the protocol documented & providing the general algorithm
- [Phomemo Thermal Printing On MacOS](https://brainbaking.com/post/2023/02/phomemo-thermal-printing-on-macos/): gave me faith that this was even possible!
