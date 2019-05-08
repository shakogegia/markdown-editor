import { EventEmitter } from 'fbemitter'

let emitter = null

export default () => {
  if (!emitter) {
    emitter = new EventEmitter()
  }
  return emitter
}
