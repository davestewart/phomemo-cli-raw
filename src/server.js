import Fs from 'fs'
import Path from 'path'
import express from 'express'
import multer from 'multer'
import Sharp from 'sharp'
import { mergeOptions } from './services/options.js'
import { print } from './services/print.js'
import { log } from './services/utils.js'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

export const CACHE_DIR = 'res/cache/'
if (!Fs.existsSync(CACHE_DIR)) {
  Fs.mkdirSync(CACHE_DIR)
}

function sendError (res, message, status = 400) {
  res.status(status).send({ error: message })
}

// ---------------------------------------------------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------------------------------------------------

export function serve (port = 4000, characteristic, options = {}) {
  // debug
  log('Starting server...')

  // express
  const app = express()

  // configure uploads
  const storage = multer.memoryStorage() // store files in memory temporarily
  const upload = multer({ storage })

  // make images accessible
  app.use('/images', express.static(Path.resolve(CACHE_DIR)))

  // serve index file
  app.use(express.static('./res/public'))

  /**
   * Print submitted file
   */
  app.post('/print', upload.single('image'), async (req, res) => {
    // check file upload
    if (!req.file) {
      return sendError(res, 'No file uploaded')
    }

    // create a temporary file path
    const path = Path.join(CACHE_DIR, req.file.originalname.toLowerCase())

    // cache file
    try {
      Fs.writeFileSync(path, req.file.buffer)
    }
    catch (err) {
      return sendError(res, 'Error caching file')
    }

    // print file
    try {
      const metadata = await print(characteristic, path, mergeOptions(options, req.query))
      res.json(metadata)
    }
    catch (err) {
      sendError(res, err.message)
    }
    finally {
      if (!options.cache) {
        Fs.unlinkSync(path)
      }
    }
  })

  /**
   * Print cached file
   */
  app.get('/print', async (req, res) => {
    const path = Path.join(CACHE_DIR, req.query.name)
    if (typeof print === 'function') {
      try {
        const metadata = await print(characteristic, path, mergeOptions(options, req.query))
        res.json(metadata)
      }
      catch (err) {
        sendError(res, err.message)
      }
    }
  })

  /**
   * List cached files
   */
  app.get('/cache', async (req, res) => {
    {
      try {
        // Read directory
        const files = Fs.readdirSync(CACHE_DIR)

        // Filter and map image files
        const images = await Promise.all(
          files
            .filter(file => {
              const ext = Path.extname(file).toLowerCase()
              return /\.(jpg|jpeg|png|gif|webp)$/i.test(ext)
            })
            .map(async file => {
              const path = Path.resolve(CACHE_DIR, file)
              const stats = Fs.statSync(path)
              const metadata = await Sharp(path).metadata()
              return {
                name: file,
                path: `/images/${file}`,
                width: metadata.width,
                height: metadata.height,
                timestamp: Math.floor(stats.mtimeMs / 1000),
              }
            })
        )
        return res.json(images.sort((a, b) => b.timestamp - a.timestamp))
      }
      catch (error) {
        console.error('Error scanning images:', error)
        sendError(res, 'Failed to scan images')
      }
    }
  })

  /**
   * Remove cached file
   */
  app.get('/remove', async (req, res) => {
    // variables
    const name = req.query.name
    const cache = Path.resolve(CACHE_DIR)
    const path = Path.resolve(CACHE_DIR, name)

    // defend against ../ paths
    if (path.startsWith(cache)) {
      if (Fs.existsSync(path)) {
        Fs.unlinkSync(path)
        res.status(200).send('Removed file OK')
      }
      else {
        sendError(res, 'Unable to find file')
      }
    }
  })

  /**
   * Remove cached files
   */
  app.get('/clear', async (req, res) => {
    try {
      if (Fs.existsSync(CACHE_DIR)) {
        Fs.rmSync(CACHE_DIR, { recursive: true })
        Fs.mkdirSync(CACHE_DIR)
        res.status(200).send('Cleared cache dir OK')
      }
      else {
        sendError(res, 'Unable to find cache dir')
      }
    }
    catch (error) {
      sendError(res, 'Unable to clear cache dir')
    }
  })

  // start the server
  app.listen(port, () => {
    log(`Server running at http://localhost:${port}`)
  })
}
