import Vue from 'vue'

let _topicmapTopic        // Topicmap topic of the displayed topicmap

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
   */
  showTopicmap ({dispatch}, {topicmapTopic, writable}) {
    console.log('showTopicmap', topicmapTopic.id)
    return switchTopicmapRenderer(topicmapTopic)
      .then(() => getTopicmap(topicmapTopic.id, dispatch))
      .then(topicmap => dispatch('renderTopicmap', {topicmap, writable}))
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
      getRendererComponent(topicmapType).then(comp => {
        // instantiate topicmap renderer
        // TODO: don't pass *all* props ("toolbarCompDefs" and "topicmapTypes" are not meaningful to
        // the topicmap renderer, only to the topicmap panel). But it doesn't hurt.
        state.topicmapRenderer = new Vue({parent: _parent, propsData: _props, ...comp})
        _mountElement = state.topicmapRenderer.$mount(_mountElement).$el
        //
        // call mounted() callback
        topicmapType.mounted && topicmapType.mounted()
        //
        // TODO: store modules
        // const viewModule = state.topicmapTypes[newTypeUri].storeModules.view
        // _store.registerModule('cytoscapeRenderer', viewModule)    // FIXME: dynamic name needed
        resolve()
      })
    } else {
      resolve()
    }
    _topicmapTopic = topicmapTopic
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
  return new Promise(resolve => {
    const renderer = topicmapType.renderer
    if (typeof renderer !== 'function') {
      throw Error(`Topicmap renderer is expected to be a function, got ${typeof renderer}
        (topicmap type '${topicmapType.uri}')`)
    }
    const p = renderer()
    if (!(p instanceof Promise)) {
      throw Error(`Topicmap renderer function is expected to return a Promise, got ${p.constructor.name} (${p})
        (topicmap type '${topicmapType.uri}')`)
    }
    p.then(module => {
      const comp = module.default.comp
      if (!comp) {
        throw Error(`No renderer component set for topicmap type '${topicmapType.uri}'`)
      }
      resolve(comp)
    })
    // TODO: support actual component too (besides factory function)
  })
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
      if (Array.isArray(topicmap)) {
        throw Error(`${topicmap.length} renderers competed for fetching topicmap ${id}`)
      }
      topicmapCache[topicmap.id] = topicmap
      return topicmap
    }).catch(error => {
      console.error(error)
    })
  }
  return p
}
