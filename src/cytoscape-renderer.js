import Vue from 'vue'
import dm5 from 'dm5'

var fisheyeAnimation

const state = {

  cy: undefined,          // the Cytoscape instance
  ele: undefined,         // Selected Cytoscape element (node or edge).
                          // Undefined if there is no selection.

  topicmap: undefined,    // view model: the rendered topicmap (dm5.Topicmap)
  object: undefined,      // view model: the selected object (dm5.DeepaMehtaObject)
  writable: undefined,    // True if the current user has WRITE permission for the selected object

  details: {},            // In-map details

  svgReady: undefined     // a promise resolved once the FontAwesome SVG is loaded
}

const actions = {

  // Module internal

  initCytoscape (_, {cy, svgReady}) {
    state.cy = cy
    state.svgReady = svgReady
  },

  syncObject (_, object) {
    state.object = object
  },

  syncWritable (_, writable) {
    state.writable = writable
  },

  setPinned (_, {topicmap, topicId, pinned}) {
    // update state
    topicmap.setTopicViewProp(topicId, 'dm5.pinning.pinned', pinned)
    // sync view
    if (!pinned) {
      if (!state.ele || id(state.ele) !== topicId) {
        // console.log('unpinning non-selection', topicId)
        removeDetail(state.details[topicId]).then(playFisheyeAnimationIfDetailsOnscreen)
      }
    }
    // update server
    dm5.restClient.setViewProps(topicmap.id, topicId, {
      'dm5.pinning.pinned': pinned
    })
  },

  syncDetailSize () {
    // console.log('syncDetailSize', detailNode.id())
    // ### FIXME: resize detail DOMs which are not selected?
    showDetail(state.details[id(state.ele)])
  },

  playFisheyeAnimation () {
    playFisheyeAnimation()
  },

  resizeTopicmapRenderer () {
    // console.log('resizeTopicmapRenderer')
    state.cy.resize()
  },

  shutdownCytoscape () {
    // console.log('Unregistering cxtmenu extension')
    // TODO: not supported by Cytoscape
  },

  // Cross-Module
  // The "sync" actions adapt (Cytoscape) view to ("topicmap") model changes

  syncTopicmap ({dispatch}, topicmap) {
    // console.log('syncTopicmap', topicmap.id)
    state.topicmap = topicmap
    return new Promise(resolve => {
      state.svgReady.then(renderTopicmap).then(resolve)
    })
  },

  syncStyles (_, assocTypeColors) {
    // console.log('syncStyles', assocTypeColors)
    for (const typeUri in assocTypeColors) {
      state.cy.style().selector(`edge[typeUri='${typeUri}']`).style({'line-color': assocTypeColors[typeUri]})
    }
  },

  syncAddTopic (_, id) {
    // console.log('syncAddTopic', id)
    state.cy.add(cyNode(state.topicmap.getTopic(id)))
  },

  syncAddAssoc (_, id) {
    // console.log('syncAddAssoc', id)
    const assoc = state.topicmap.getAssoc(id)
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      state.cy.add(cyEdge(assoc))
    }
  },

  syncTopic (_, id) {
    // console.log('syncTopic', id)
    cyElement(id).data('label', state.topicmap.getTopic(id).value)
  },

  syncAssoc (_, id) {
    // console.log('syncAssoc', id)
    const assoc = state.topicmap.getAssoc(id)
    cyElement(id).data({
      typeUri: assoc.typeUri,
      label:   assoc.value
    })
  },

  /**
   * Renders given topic/assoc as selected.
   * The detail overlay is rendered, and the fisheye animation is played.
   *
   * Precondition:
   * - the topicmap rendering is complete.
   *
   * @param   id  id of a topic or an assoc
   * @param   p   a promise resolved once topic/assoc data has arrived (global "object" state is up-to-date).
   *              Note: the detail overlay's size can only be measured once "object" details are rendered.
   */
  syncSelect (_, {id, p}) {
    // console.log('syncSelect', id, cyElement(id).length)
    // Note: the fisheye animation can only be started once the restore animation is complete, *and* "object" is
    // available. The actual order of these 2 occasions doesn't matter.
    Promise.all([
      // Note: programmatic unselect() is required for browser history navigation. When *interactively* selecting a node
      // Cytoscape removes the current selection before. When *programmatically* selecting a node Cytoscape does *not*
      // remove the current selection.
      _syncUnselect(),
      p
    ]).then(() => {
      // console.log('restore animation complete')
      // update state
      state.ele = cyElement(id).select()
      // Note 1: select() is needed to restore selection after switching topicmap.
      // Note 2: setting the "ele" state causes the detail overlay to be rendered (at next tick). ### FIXDOC
      if (state.ele.size() != 1) {
        console.warn('syncSelect', id, 'not found', state.ele.size())
      }
      // console.log('syncSelect pinned', ele.isNode() && state.topicmap.getTopicViewProp(id, 'dm5.pinning.pinned'))
      const detail = createSelectionDetail()
      Vue.set(state.details, id, detail)      // Vue.set() triggers dm5-detail-layer rendering
      // sync view
      Vue.nextTick().then(() => {
        showDetail(detail)
      })
    })
  },

  syncUnselect () {
    // console.log('syncUnselect')
    _syncUnselect().then(playFisheyeAnimationIfDetailsOnscreen)
  },

  syncTopicPosition (_, id) {
    console.log('syncTopicPosition', id)
    _syncTopicPosition(id)
  },

  syncTopicVisibility (_, id) {
    console.log('syncTopicVisibility', id)
    const viewTopic = state.topicmap.getTopic(id)
    if (viewTopic.isVisible()) {
      state.cy.add(cyNode(viewTopic))
    } else {
      cyElement(id).remove()
    }
  },

  syncRemoveTopic (_, id) {
    console.log('syncRemoveTopic', id)
    cyElement(id).remove()
  },

  syncRemoveAssoc (_, id) {
    console.log('syncRemoveAssoc', id)
    cyElement(id).remove()
  }
}

export default {
  state,
  actions
}

// ---

/**
 * Builds a detail record for the current selection.
 */
function createSelectionDetail () {
  return {
    object: state.object,
    writable: state.writable,   // FIXME: not reactive
    ele: state.ele,
    node: state.ele.isNode() ? state.ele : createAuxNode(state.ele),
    size: undefined,
    viewTopic: state.ele.isNode() && state.topicmap.getTopic(id(state.ele)),
    // pinned: state.ele.isNode() && state.topicmap.getTopicViewProp(id, 'dm5.pinning.pinned')
    // Note: a sole "pinned" value is not reactive. With the "viewTopic" wrapper object it works.
    get id () {
      return id(this.ele)
    },
    get pinned () {
      return this.viewTopic && this.viewTopic.getViewProp('dm5.pinning.pinned')
    }
  }
}

/**
 * Measures the size of the detail overlay, adapts the detail node's size accordingly, and starts fisheye animation.
 *
 * Precondition:
 * - the DOM is updated already.
 */
function showDetail(detail) {
  const detailDOM = document.querySelector(`.dm5-detail-layer .dm5-detail[data-detail-id="${detail.id}"]`)
  if (!detailDOM) {
    throw Error('No detail DOM')
  }
  const size = {
    width:  detailDOM.clientWidth,
    height: detailDOM.clientHeight
  }
  detail.size = size        // FIXME: use Vue.set()?
  // console.log('showDetail', node.id(), state.size.width, state.size.height)
  detail.node.style(size)
  playFisheyeAnimation()
}

function playFisheyeAnimation() {
  fisheyeAnimation && fisheyeAnimation.stop()
  fisheyeAnimation = state.cy.layout({
    name: 'cose-bilkent',
    stop () {
      // console.log('fisheye animation complete')
    },
    // animate: 'end',
    // animationDuration: 3000,
    fit: false,
    randomize: false,
    nodeRepulsion: 1000,
    idealEdgeLength: 0,
    edgeElasticity: 0,
    tile: false
  }).run()
}

function playFisheyeAnimationIfDetailsOnscreen () {
  if (!dm5.utils.isEmpty(state.details)) {
    playFisheyeAnimation()
  }
}

function renderTopicmap () {
  const eles = []
  state.topicmap.forEachTopic(viewTopic => {
    if (viewTopic.isVisible()) {
      eles.push(cyNode(viewTopic))
    }
  })
  state.topicmap.forEachAssoc(assoc => {
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      eles.push(cyEdge(assoc))
    }
  })
  state.cy.remove("*")  // "*" is the group selector "all"
  state.cy.add(eles)
  // console.log('### Topicmap rendering complete!')
}

/**
 * @return  a promise resolved once the animation is complete.
 */
function _syncTopicPosition (id) {
  return cyElement(id).animation({
    // duration: 3000,
    position: state.topicmap.getTopic(id).getPosition(),
    easing: 'ease-in-out-cubic'
  }).play().promise()
}

/**
 * Unsets the selection (state + view), removes the detail from screen, and plays the restore animation.
 *
 * @return  a promise resolved once the restore animation is complete.
 */
function _syncUnselect () {
  // console.log('_syncUnselect', state.cy.elements(":selected").size(), state.object)
  if (state.ele) {    // ### TODO: check required?
    const detail = state.details[id(state.ele)]
    // Note: unselect() removes visual selection when manually stripping topic/assoc from browser URL.
    // In this situation cy.elements(":selected") would return a non-empty collection.
    // Note: when the user clicks on the background Cytoscape unselects the selected element by default.
    // Calling cy.elements(":selected") afterwards would return an empty collection.
    state.ele.unselect()    // view
    state.ele = undefined   // state
    if (!detail.pinned) {
      return removeDetail(detail)
    }
  }
  return Promise.resolve()
}

/**
 * Removes the given detail from screen and plays the restore animation.
 *
 * @return  a promise resolved once the restore animation is complete.
 */
function removeDetail (detail) {
  // remove detail DOM
  Vue.delete(state.details, detail.id)          // Vue.delete() triggers dm5-detail-layer rendering
  // adjust Cytoscape view
  if (detail.ele.isNode()) {
    detail.ele.style({width: '', height: ''})   // reset size
  } else {
    state.cy.remove(detail.node)                // remove aux node
  }
  return playRestoreAnimation()
}

/**
 * @return  a promise resolved once the animation is complete.
 */
function playRestoreAnimation () {
  const promises = []
  // console.log('starting restore animation')
  state.topicmap.forEachTopic(viewTopic => {
    if (viewTopic.isVisible()) {
      promises.push(_syncTopicPosition(viewTopic.id))
    }
  })
  return Promise.all(promises)
}

/**
 * Creates an auxiliary node to represent the given edge.
 */
function createAuxNode (edge) {
  return state.cy.add({
    data: {
      assocId: id(edge),            // Holds original edge ID. Needed by context menu.
      icon: '\uf10c'                // model.js DEFAULT_TOPIC_ICON
    },
    position: edge.midpoint(),
    classes: 'aux'
  })
}

/**
 * Builds a Cytoscape node from a dm5.ViewTopic
 *
 * @param   viewTopic   A dm5.ViewTopic
 */
function cyNode (viewTopic) {
  return {
    data: {
      id:    viewTopic.id,
      label: viewTopic.value,
      icon:  viewTopic.getIcon()
    },
    position: viewTopic.getPosition()
  }
}

/**
 * Builds a Cytoscape edge from a dm5.Assoc
 *
 * @param   assoc   A dm5.Assoc
 */
function cyEdge (assoc) {
  return {
    data: {
      id:      assoc.id,
      typeUri: assoc.typeUri,
      label:   assoc.value,
      source:  assoc.role1.topicId,
      target:  assoc.role2.topicId
    }
  }
}

/**
 * Gets the Cytoscape element with the given ID.
 *
 * @param   id    a DM object id (number)
 *
 * @return  A collection of 1 or 0 elements.
 */
function cyElement (id) {
  return state.cy.getElementById(id.toString())   // Note: a Cytoscape element ID is a string
}

// copy in dm5.cytoscape-renderer.vue and dm5-detail-layer.vue
function id (ele) {
  // Note: cytoscape element IDs are strings
  return Number(ele.id())
}
