import Vue from 'vue'

let _topicmap           // The displayed topicmap

let _topicmapTypes      // Registered topicmap types
let _topicmapRenderer   // The element where to mount the topicmap renderers
let _parent

const actions = {

  /**
   * @returns   a promise resolved once topicmap rendering is complete.
   */
  renderTopicmap ({dispatch}, topicmap) {
    console.log('renderTopicmap', topicmap)
    return new Promise(resolve => {
      const oldTypeUri = _topicmap && _topicmap.getTopicmapTypeUri()
      const newTypeUri = topicmap.getTopicmapTypeUri()
      if (oldTypeUri !== newTypeUri) {
        // console.log(`switching renderer from '${oldTypeUri}' to '${newTypeUri}'`)
        // const viewModule = state.topicmapTypes[newTypeUri].storeModules.view
        // _store.registerModule('cytoscapeRenderer', viewModule)    // FIXME: dynamic name needed
        _topicmapTypes[newTypeUri].comp().then(module => {
          // console.log('module', module)
          const propsData = {}
          const comp = new Vue({parent: _parent, propsData, ...module.default}).$mount(_topicmapRenderer)
          dispatch('syncTopicmap', topicmap).then(resolve)
        })
      }
      _topicmap = topicmap
    })
  },

  // Module internal

  _initTopicmapPanel (_, {topicmapTypes, topicmapRenderer, parent, store}) {
    console.log('_initTopicmapPanel', parent)
    _topicmapTypes = topicmapTypes
    _topicmapRenderer = topicmapRenderer
    _parent = parent
  }
}

export default {
  actions
}
