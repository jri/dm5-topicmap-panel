import Vue from 'vue'

let _topicmap           // The displayed topicmap

let _props
let _topicmapTypes      // Registered topicmap types
let _mountElement       // The DOM element where to mount the topicmap renderers
let _parent

const state = {
  topicmapRenderer: undefined
}

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
        // 1) lookup topicmap type
        // console.log(`switching renderer from '${oldTypeUri}' to '${newTypeUri}'`)
        const topicmapType = _topicmapTypes[newTypeUri]
        if (!topicmapType) {
          throw Error(`Topicmap type '${newTypeUri}' is not registered`)
        }
        const comp = topicmapType.comp
        if (!comp) {
          throw Error(`No renderer component set for topicmap type '${newTypeUri}'`)
        }
        // 2) instantiate topicmap renderer
        // TODO: support actual component too (besides factory function)
        comp().then(module => {
          // TODO: don't pass *all* props ("toolbarCompDefs" and "topicmapTypes" are not meaningful to
          // the topicmap renderer, only to the topicmap panel). But it doesn't hurt.
          state.topicmapRenderer = new Vue({parent: _parent, propsData: _props, ...module.default})
          _mountElement = state.topicmapRenderer.$mount(_mountElement).$el
          //
          // call mounted() callback
          topicmapType.mounted && topicmapType.mounted()
          //
          // TODO: store modules
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

  _initTopicmapPanel (_, {props, mountElement, parent}) {
    // console.log('_initTopicmapPanel', parent)
    _props = props
    _topicmapTypes = props.topicmapTypes
    _mountElement = mountElement
    _parent = parent
  }
}

export default {
  state,
  actions
}
