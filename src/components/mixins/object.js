import dm5 from 'dmx-api'

export default {
  props: {
    // The selected topic/assoc.
    // Undefined if nothing is selected.
    object: dm5.DMXObject
  }
}
