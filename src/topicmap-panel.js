import Vue from 'vue'

const state = {
  topicmap: undefined,        // The displayed topicmap
  topicmapTypes: undefined    // Registered topicmap types
}

const actions = {

  /**
   * @returns   a promise resolved once topicmap rendering is complete.
   */
  renderTopicmap ({dispatch}, topicmap) {
    console.log('renderTopicmap', topicmap)
    state.topicmap = topicmap
    return new Promise(resolve => {
      // Note: setting the "topicmap" state triggers instantiation of the renderer component.
      // Instantiation happens asynchronously. We can rely on renderer's store module (which
      // the renderer component only registers at instantiation time) not before next tick.
      // Otherwise the 'syncTopicmap' action would not be available.
      Vue.nextTick(() => {
        dispatch('syncTopicmap', topicmap).then(resolve)
      })
    })
  },

  // Module internal

  _syncTopicmapTypes (_, topicmapTypes) {
    // console.log('_syncTopicmapTypes')
    state.topicmapTypes = topicmapTypes
  }
}

export default {
  state,
  actions
}
