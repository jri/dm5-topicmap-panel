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
      switchTopicmapRenderer(topicmap)
        .then(() => dispatch('syncTopicmap', topicmap))
        .then(resolve)
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

/**
 * Switches to the topicmap renderer needed for the given topicmap.
 * If no renderer switch is needed nothing is performed and the returned promise is resolved immediately.
 *
 * @return  A promise resolved once the topicmap renderer is ready.
 */
function switchTopicmapRenderer (topicmap) {
  return new Promise(resolve => {
    const oldTypeUri = _topicmap && _topicmap.getTopicmapTypeUri()
    const newTypeUri = topicmap.getTopicmapTypeUri()
    if (oldTypeUri !== newTypeUri) {
      console.log(`switching renderer from '${oldTypeUri}' to '${newTypeUri}'`)
      const topicmapType = getTopicmapType(newTypeUri)
      const comp = getRendererComponent(topicmapType)
      comp().then(module => {
        // instantiate topicmap renderer
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
      }).then(resolve)
    } else {
      resolve()
    }
  })
}

function getTopicmapType (topicmapTypeUri) {
  if (!_topicmapTypes) {
    throw Error(`No topicmap types passed to dm5-topicmap-panel`)
  }
  const topicmapType = _topicmapTypes[topicmapTypeUri]
  if (!topicmapType) {
    throw Error(`Topicmap type '${topicmapTypeUri}' is not known to dm5-topicmap-panel`)
  }
  return topicmapType
}

function getRendererComponent (topicmapType) {
  const comp = topicmapType.comp
  if (!comp) {
    throw Error(`No renderer component set for topicmap type '${topicmapType.uri}'`)
  }
  if (typeof comp !== 'function') {
    throw Error(`Renderer component is expected to be a function, got ${typeof comp}
      (topicmap type '${topicmapType.uri}')`)
  }
  // TODO: support actual component too (besides factory function)
  return comp
}
