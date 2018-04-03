import Vue from 'vue'

let _topicmapTopic        // The displayed topicmap

let _props
let _topicmapTypes        // Registered topicmap types
let _mountElement         // The DOM element where to mount the topicmap renderers
let _parent

let topicmapCache = {}    // Loaded topicmaps, keyed by ID:
                          //   {
                          //     topicmapId: Topicmap         # a dm5.Topicmap
                          //   }

const state = {
  topicmapRenderer: undefined
}

const actions = {

  /**
   * @returns   a promise resolved once topicmap rendering is complete.
   *            The promise's value is the topicmap.
   */
  showTopicmap ({dispatch}, {topicmapTopic, writable}) {
    console.log('showTopicmap', topicmapTopic)
    return new Promise(resolve => {
      switchTopicmapRenderer(topicmapTopic)
        .then(() => getTopicmap(topicmapTopic.id, dispatch))
        .then(topicmap => dispatch('renderTopicmap', {topicmap, writable})
          .then(() => resolve(topicmap))
        )
      _topicmapTopic = topicmapTopic
    })
  },

  clearTopicmapCache () {
    topicmapCache = {}
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

// Topicmap Renderer Switching

/**
 * Switches to the topicmap renderer needed for the given topicmap.
 * If no renderer switch is needed nothing is performed and the returned promise is resolved immediately.
 *
 * @return  A promise resolved once the topicmap renderer is ready.
 */
function switchTopicmapRenderer (topicmapTopic) {
  return new Promise(resolve => {
    const oldTypeUri = _topicmapTopic && getTopicmapTypeUri(_topicmapTopic)
    const newTypeUri = getTopicmapTypeUri(topicmapTopic)
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

function getTopicmapTypeUri (topicmapTopic) {
  const child = topicmapTopic.getChildTopic('dm4.topicmaps.topicmap_renderer_uri')
  if (!child) {
    throw Error(`Topicmap topic ${topicmapTopic.id} has no dm4.topicmaps.topicmap_renderer_uri child topic`)
  }
  return child.value
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

// Topicmap Loading

// TODO: store promises in topicmap cache
function getTopicmap (id, dispatch) {
  var p   // a promise for a dm5.Topicmap
  const topicmap = topicmapCache[id]
  if (topicmap) {
    p = Promise.resolve(topicmap)
  } else {
    // console.log('Fetching topicmap', id)
    p = dispatch('fetchTopicmap', id).then(topicmap => {
      topicmapCache[topicmap.id] = topicmap
      return topicmap
    }).catch(error => {
      console.error(error)
    })
  }
  return p
}
