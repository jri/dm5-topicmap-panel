import Vue from 'vue'

let _topicmapTopic        // Topicmap topic of the displayed topicmap

let _store
let _props
let _topicmapTypes        // Registered topicmap types
let _mountElement         // The DOM element where to mount the topicmap renderers
let _parent

let topicmapCache = {}    // Loaded topicmaps, keyed by ID:
                          //   {
                          //     topicmapId: Topicmap         # a dm5.Topicmap
                          //   }

const state = {
  topicmapRenderer: undefined,
  loading: true
}

const actions = {

  /**
   * @returns   a promise resolved once topicmap rendering is complete.
   */
  showTopicmap ({dispatch}, {topicmapTopic, writable, selection}) {
    // console.log('showTopicmap', topicmapTopic.id)
    state.loading = true
    return switchTopicmapRenderer(topicmapTopic)
      .then(() => getTopicmap(topicmapTopic.id, dispatch))
      .then(topicmap => dispatch('renderTopicmap', {topicmap, writable, selection}))
      .then(() => state.loading = false)
      .catch(error => {
        console.error(`Rendering topicmap ${topicmapTopic.id} failed`, error)
      })
  },

  clearTopicmapCache () {
    topicmapCache = {}
  },

  resizeTopicmapRenderer () {
    // empty dummy action to catch a "resize" request when no renderer is mounted yet
  },

  // Module internal

  _initTopicmapPanel (_, {store, props, mountElement, parent}) {
    // console.log('_initTopicmapPanel', parent)
    _store = store
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
      // console.log(`switching renderer from '${oldTypeUri}' to '${newTypeUri}'`)
      const topicmapType = getTopicmapType(newTypeUri)
      getRenderer(topicmapType).then(renderer => {
        // 1) switch store module
        oldTypeUri && _store.unregisterModule(oldTypeUri)
        _store.registerModule(newTypeUri, renderer.storeModule)
        // 2) instantiate renderer component
        // TODO: don't pass *all* props ("toolbarCompDefs" and "topicmapTypes" are not meaningful to
        // the topicmap renderer, only to the topicmap panel)? But it doesn't hurt.
        state.topicmapRenderer = new Vue({parent: _parent, propsData: _props, ...renderer.comp})
        // ### FIXME: former renderer component is apparently not destroyed.
        // Their computed properties are still recomputed.
        _mountElement = state.topicmapRenderer.$mount(_mountElement).$el
        // 3) call mounted() callback ### TODO: currently not needed
        topicmapType.mounted && topicmapType.mounted()
        //
        resolve()
      })
    } else {
      resolve()
    }
    _topicmapTopic = topicmapTopic
  })
}

function getTopicmapTypeUri (topicmapTopic) {
  const child = topicmapTopic.childs['dmx.topicmaps.topicmap_renderer_uri']
  if (!child) {
    throw Error(`Topicmap topic ${topicmapTopic.id} has no dmx.topicmaps.topicmap_renderer_uri child topic`)
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

function getRenderer (topicmapType) {
  return new Promise(resolve => {
    const rendererFunc = topicmapType.renderer
    if (typeof rendererFunc !== 'function') {
      throw Error(`Topicmap renderer is expected to be a function, got ${typeof rendererFunc}
        (topicmap type '${topicmapType.uri}')`)
    }
    const p = rendererFunc()
    if (!(p instanceof Promise)) {
      throw Error(`Topicmap renderer function is expected to return a Promise, got ${p.constructor.name} (${p})
        (topicmap type '${topicmapType.uri}')`)
    }
    p.then(module => {
      const renderer = module.default
      if (!renderer.storeModule) {
        throw Error(`No store module set for topicmap type '${topicmapType.uri}'`)
      }
      if (!renderer.comp) {
        throw Error(`No renderer component set for topicmap type '${topicmapType.uri}'`)
      }
      resolve(renderer)
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
    })
  }
  return p
}
