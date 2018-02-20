const FISHEYE = true

import Vue from 'vue'

// Note: the topicmap is not vuex state. (This store module provides no state at all, only actions. ### FIXDOC)
// In conjunction with Cytoscape the topicmap is not considered reactive data.
// We have to snyc topicmap data with the Cytoscape graph model manually anyways.
// (This is because Cytoscape deploys a canvas, not a DOM).

var topicmap            // view model: the rendered topicmap (a dm5.Topicmap object)

var ele                 // Selected Cytoscape element (node or edge).
                        // Must only be queried if detailNode is defined.

var auxNode             // in case of an assoc selection: the auxiliary node that represents the assoc

var fisheyeAnimation

//

const state = {

  cy: undefined,          // the Cytoscape instance

  svgReady: undefined,    // a promise resolved once the FontAwesome SVG is loaded

  detailNode: undefined,  // The Cytoscape node underlying the detail overlay.
                          // Either a "real" node, or, in case of an assoc selection, the "aux" node.
                          // Undefined if there is no selection.

  size: undefined         // size of the detail overlay (object with "width" and "height" properties).
}

const actions = {

  initCytoscape (_, {cy, svgReady}) {
    state.cy = cy
    state.svgReady = svgReady
  },

  resizeTopicmapRenderer () {
    // console.log('resizeTopicmapRenderer')
    state.cy.resize()
  },

  // The "sync" actions adapt (Cytoscape) view to ("topicmap") model changes

  syncTopicmap ({dispatch}, _topicmap) {
    // console.log('syncTopicmap', _topicmap.id)
    topicmap = _topicmap
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
    state.cy.add(cyNode(topicmap.getTopic(id)))
  },

  syncAddAssoc (_, id) {
    // console.log('syncAddAssoc', id)
    const assoc = topicmap.getAssoc(id)
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      state.cy.add(cyEdge(assoc))
    }
  },

  syncTopic (_, id) {
    // console.log('syncTopic', id)
    cyElement(id).data('label', topicmap.getTopic(id).value)
  },

  syncAssoc (_, id) {
    // console.log('syncAssoc', id)
    const assoc = topicmap.getAssoc(id)
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
      // update state + sync view
      ele = cyElement(id).select()
      // Note 1: select() is needed to restore selection after switching topicmap.
      // Note 2: setting the "ele" state causes the detail overlay to be rendered (at next tick).
      if (ele.size() != 1) {
        console.warn('syncSelect', id, 'not found', ele.size())
      }
      if (FISHEYE) {
        if (ele.isNode()) {
          state.detailNode = ele
        } else {
          state.detailNode = auxNode = createAuxNode(ele)
        }
        Vue.nextTick().then(() => {
          showDetailOverlay()
        })
      }
    })
  },

  syncUnselect () {
    // console.log('syncUnselect')
    _syncUnselect()
  },

  syncTopicPosition (_, id) {
    console.log('syncTopicPosition', id)
    _syncTopicPosition(id)
  },

  syncTopicVisibility (_, id) {
    console.log('syncTopicVisibility', id)
    const viewTopic = topicmap.getTopic(id)
    if (viewTopic.isVisible()) {
      state.cy.add(cyNode(viewTopic))
    } else {
      cyElement(id).remove()
    }
  },

  syncDetailSize () {
    // console.log('syncDetailSize', detailNode.id())
    showDetailOverlay()
  },

  syncRemoveTopic (_, id) {
    console.log('syncRemoveTopic', id)
    cyElement(id).remove()
  },

  syncRemoveAssoc (_, id) {
    console.log('syncRemoveAssoc', id)
    cyElement(id).remove()
  },

  // ---

  shutdownCytoscape () {
    // console.log('Unregistering cxtmenu extension')
    // TODO
  }
}

export default {
  state,
  actions
}

// ---

/**
 * Measures the size of the detail overlay, adapts the detail node's size accordingly, and starts fisheye animation.
 *
 * Precondition:
 * - the DOM is updated already.
 */
function showDetailOverlay() {
  const detail = document.querySelector('.dm5-detail-overlay .detail')
  if (!detail) {
    throw Error('No detail overlay')
  }
  state.size = {
    width:  detail.clientWidth,
    height: detail.clientHeight
  }
  // console.log('showDetailOverlay', node.id(), state.size.width, state.size.height)
  state.detailNode.style(state.size)   // fisheye element style
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

function renderTopicmap () {
  const eles = []
  topicmap.forEachTopic(viewTopic => {
    if (viewTopic.isVisible()) {
      eles.push(cyNode(viewTopic))
    }
  })
  topicmap.forEachAssoc(assoc => {
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      eles.push(cyEdge(assoc))
    }
  })
  state.cy.remove("*")  // "*" is the group selector "all"
  state.cy.add(eles)
  // console.log('### Topicmap rendering complete!')
}

/**
 * @return  a promise that is resolved once the animation is complete.
 */
function _syncTopicPosition (id) {
  return cyElement(id).animation({
    // duration: 3000,
    position: topicmap.getTopic(id).getPosition(),
    easing: 'ease-in-out-cubic'
  }).play().promise()
}

/**
 * @return  a promise that is resolved once the restore animation is complete.
 */
function _syncUnselect () {
  // console.log('_syncUnselect', ele)
  if (state.detailNode) {
    // update state
    state.detailNode = undefined
    //
    // sync view
    // Note: unselect() removes visual selection when manually stripping topic/assoc from browser URL.
    // In this situation cy.elements(":selected") would return a non-empty collection.
    // Note: when the user clicks on the background Cytoscape unselects the selected element by default.
    // Calling cy.elements(":selected") afterwards would return an empty collection.
    ele.unselect()
    //
    if (FISHEYE) {
      if (ele.isNode()) {
        ele.style({width: '', height: ''})    // reset size
      } else {
        state.cy.remove(auxNode)
      }
      return playRestoreAnimation()
    }
  }
  return Promise.resolve()
}

/**
 * @return  a promise that is resolved once the animation is complete.
 */
function playRestoreAnimation () {
  const promises = []
  // console.log('starting restore animation')
  topicmap.forEachTopic(viewTopic => {
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
      assocId: id(edge),            // Holds original edge ID. Needed for context menu.
      label: edge.data('label'),
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

// copy in dm5.cytoscape-renderer.vue
function id (ele) {
  // Note: cytoscape element IDs are strings
  return Number(ele.id())
}
