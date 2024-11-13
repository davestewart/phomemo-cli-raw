import Fs from 'fs'
import Path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import multer from 'multer'

export function serve (port = 4000, print = (file, dither) => {}) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = Path.dirname(__filename)

  const app = express()

  // set up multer for file uploads
  const storage = multer.memoryStorage() // store files in memory temporarily
  const upload = multer({ storage })

  // define the /print endpoint
  app.post('/print', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('no file uploaded.')
    }

    // query parameters
    const dither = req.query.dither === '1'

    // create a temporary file path
    const path = Path.join(__dirname, '../res/cache', req.file.originalname)

    // save the file to the temp directory
    Fs.writeFile(path, req.file.buffer, (err) => {
      if (err) {
        return res.status(500).send('error saving file')
      }

      // report
      res.send('printing!')

      // print
      if (typeof print === 'function') {
        setTimeout(() => {
          print(path, dither)
        }, 500)
      }
    })
  })


  // start the server
  app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`)
  })
}
