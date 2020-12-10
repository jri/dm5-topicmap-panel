import dmx from 'dmx-api'

export default {
  props: {
    // The selected topic/assoc.
    // Undefined if nothing is selected.
    object: dmx.DMXObject
  }
}
