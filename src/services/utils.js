import { inspect } from 'util'

export function log (...args) {
  const output = args.map(arg => {
    return arg && typeof arg === 'object'
      ? inspect(arg, { colors: true, breakLength: 0, depth: 5 })
      : arg
  })
  console.log(...output, '\n')
}
