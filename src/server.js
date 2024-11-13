import Fs, { existsSync, mkdirSync } from 'fs'
import Path from 'path'
import express from 'express'
import multer from 'multer'
import { parseArgs, print } from './print.js'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

export const CACHE_DIR = 'res/cache/'
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR)
}

// ---------------------------------------------------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------------------------------------------------

export function serve (port = 4000, characteristic) {
  // express
  const app = express()

  // set up multer for file uploads
  const storage = multer.memoryStorage() // store files in memory temporarily
  const upload = multer({ storage })

  // define the /print endpoint
  app.post('/print', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.')
    }

    // create a temporary file path
    const path = Path.join(CACHE_DIR, req.file.originalname.toLowerCase())

    // save the file to the temp directory
    Fs.writeFile(path, req.file.buffer, (err) => {
      if (err) {
        return res.status(500).send('Error saving file')
      }

      // report
      res.send('Printing!')

      // print
      if (typeof print === 'function') {
        const { scale, dither } = parseArgs(req.query)
        print(characteristic, path, scale, dither)
      }
    })
  })

  // start the server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}
