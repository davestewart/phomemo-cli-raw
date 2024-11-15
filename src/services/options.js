/**
 * @typedef Options
 *
 * @property  {number}    [scale]     The scale factor
 * @property  {boolean}   [dither]    Whether to dither the image
 * @property  {boolean}   [cache]     Whether to maintain an image cache
 * @property  {boolean}   [debug]     Whether to dump debug messages
 */

/**
 * Helper function to Parse CLI options or HttpRequest query
 *
 * @param     {object}    options
 * @returns   {Options}
 */
export function parseOptions ({ scale, dither, cache, debug } = {}) {
  return {
    scale: num(scale),
    dither: bool(dither),
    cache: bool(cache),
    debug: bool(debug),
  }
}

/**
 * Merge CLI and Request query
 *
 * @param   {Options}  options    CLI options
 * @param   {object}    query     Request query
 * @returns {Options}
 */
export function mergeOptions (options = {}, query = {}) {
  query = parseOptions(query)
  return {
    scale: query.scale ?? options.scale,
    dither: query.dither ?? options.dither,
    cache: options.cache,
    debug: options.debug,
  }
}

function bool (value) {
   return value === '1' || value === 'true' || value === true
}

function num (value) {
  const result = Number(value)
  return !isNaN(result)
    ? result
    : undefined
}
