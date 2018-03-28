import Vue from 'vue'

let _topicmap           // The displayed topicmap

let _topicmapTypes      // Registered topicmap types
let _mountElement       // The DOM element where to mount the topicmap renderers
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
        const topicmapType = _topicmapTypes[newTypeUri]
        if (!topicmapType) {
          throw Error(`Topicmap type '${newTypeUri}' is not registered`)
        }
        const comp = topicmapType.comp
        if (!comp) {
          throw Error(`No renderer component set for topicmap type '${newTypeUri}'`)
        }
        // TODO: support actual component too (besides factory function)
        comp().then(module => {
          const propsData = {}
          _mountElement = new Vue({parent: _parent, propsData, ...module.default}).$mount(_mountElement).$el
          //
          // call mounted() callback
          topicmapType.mounted && topicmapType.mounted()
          //
          // const viewModule = state.topicmapTypes[newTypeUri].storeModules.view
          // _store.registerModule('cytoscapeRenderer', viewModule)    // FIXME: dynamic name needed
          //
          dispatch('syncTopicmap', topicmap).then(resolve)
        })
      } else {
        dispatch('syncTopicmap', topicmap).then(resolve)
      }
      _topicmap = topicmap
    })
  },

  // Module internal

  _initTopicmapPanel (_, {topicmapTypes, mountElement, parent}) {
    // console.log('_initTopicmapPanel', parent)
    _topicmapTypes = topicmapTypes
    _mountElement = mountElement
    _parent = parent
  }
}

export default {
  actions
}
