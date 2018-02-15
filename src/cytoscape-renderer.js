const FISHEYE = true

import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import cxtmenu from 'cytoscape-cxtmenu'
import fa from 'font-awesome/fonts/fontawesome-webfont.svg'
import dm5 from 'dm5'
import Vue from 'vue'

// get style from CSS variables
const style = window.getComputedStyle(document.body)
const fontFamily         = style.getPropertyValue('--main-font-family')
const mainFontSize       = style.getPropertyValue('--main-font-size')
const labelFontSize      = style.getPropertyValue('--label-font-size')
const iconColor          = style.getPropertyValue('--color-topic-icon')
const hoverBorderColor   = style.getPropertyValue('--color-topic-hover')
const backgroundColor    = style.getPropertyValue('--background-color')
const borderColorLighter = style.getPropertyValue('--border-color-lighter')

// Note: the topicmap is not vuex state. (This store module provides no state at all, only actions. ### FIXDOC)
// In conjunction with Cytoscape the topicmap is not considered reactive data.
// We have to snyc topicmap data with the Cytoscape graph model manually anyways.
// (This is because Cytoscape deploys a canvas, not a DOM).

var topicmap              // view model: the rendered topicmap (a dm5.Topicmap object)

var cy                    // the Cytoscape instance
var box                   // the measurement box

var faFont                // Font Awesome SVG <font> element
var init = false          // tracks Cytoscape event listener registration and context menu initialization, which is lazy

const svgReady = dm5.restClient.getXML(fa).then(svg => {
  // console.log('### SVG ready!')
  faFont = svg.querySelector('font')
})

// register extensions
cytoscape.use(coseBilkent)
cytoscape.use(cxtmenu)

//

const state = {

  ele: undefined,         // Selected Cytoscape element (node or edge).
                          // Undefined if there is no selection.

  auxNode: undefined,     // In case of an edge selection: the auxiliary node that represents the edge.

  size: undefined,        // Size of in-map topic detail (object with "width" and "height" properties).

  zoom: 1                 // TODO: real init value
}

const actions = {

  initCytoscape () {
    cy = initialize().on('zoom', () => {
      state.zoom = cy.zoom()
    })
    box = document.getElementById('measurement-box')
  },

  resizeTopicmapRenderer () {
    // console.log('resizeTopicmapRenderer')
    cy.resize()
  },

  // The "sync" actions adapt (Cytoscape) view to ("topicmap") model changes

  syncTopicmap ({dispatch}, _topicmap) {
    // console.log('syncTopicmap', _topicmap.id)
    // lazy initialization
    if (!init) {
      eventListeners(dispatch)
      initContextMenus(dispatch)
      init = true
    }
    //
    topicmap = _topicmap
    return new Promise(resolve => {
      svgReady.then(renderTopicmap).then(resolve)
    })
  },

  syncStyles (_, assocTypeColors) {
    // console.log('syncStyles', assocTypeColors)
    for (const typeUri in assocTypeColors) {
      cy.style().selector(`edge[typeUri='${typeUri}']`).style({'line-color': assocTypeColors[typeUri]})
    }
  },

  syncAddTopic (_, id) {
    // console.log('syncAddTopic', id)
    cy.add(cyNode(topicmap.getTopic(id)))
  },

  syncAddAssoc (_, id) {
    // console.log('syncAddAssoc', id)
    const assoc = topicmap.getAssoc(id)
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      cy.add(cyEdge(assoc))
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
      state.ele = cyElement(id).select()
      // Note 1: select() is needed to restore selection after switching topicmap.
      // Note 2: setting the "ele" state causes the detail overlay to be rendered (at next tick).
      if (state.ele.size() != 1) {
        console.warn('syncSelect', id, 'not found', state.ele.size())
      }
      if (FISHEYE) {
        let detailNode
        if (state.ele.isNode()) {
          detailNode = state.ele
        } else {
          detailNode = state.auxNode = auxNode(state.ele)
        }
        Vue.nextTick().then(() => {
          showDetailOverlay(detailNode)
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
      cy.add(cyNode(viewTopic))
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

function initialize() {
  return cytoscape({
    container: document.getElementById('cytoscape-container'),
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'rectangle',
          'background-image': ele => renderNode(ele).url,
          'background-opacity': 0,
          'width':  ele => renderNode(ele).width,
          'height': ele => renderNode(ele).height,
          'border-width': 1,
          'border-color': borderColorLighter,
          'border-opacity': 1
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': 'rgb(178, 178, 178)',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-family': fontFamily,
          'font-size': labelFontSize,
          'text-margin-y': '-10',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: 'node:selected, node.aux',
        style: {
          'border-opacity': 0
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'width': 6
        }
      },
      {
        selector: 'node.hover',
        style: {
          'border-width': 3,
          'border-color': hoverBorderColor,
          'border-opacity': 1
        }
      }
    ],
    layout: {
      name: 'preset'
    },
    wheelSensitivity: 0.2
  })
}

// lazy registration of Cytoscape event listeners
function eventListeners (dispatch) {
  cy.on('tap', 'node', evt => {
    const clicks = evt.originalEvent.detail
    // console.log('"tap node" event!', id(evt.target), clicks)
    if (clicks === 1) {
      dispatch('selectTopic', id(evt.target))
    } else if (clicks === 2) {
      dispatch('onTopicDoubleClick', evt.target.data('viewTopic'))
    }
  })
  cy.on('tap', 'edge', evt => {
    // console.log('"tap edge" event!', id(evt.target))
    dispatch('selectAssoc', id(evt.target))
  })
  cy.on('tap', evt => {
    if (evt.target === cy) {
      // console.log('"tap background" event!')
      dispatch('onBackgroundClick')
    }
  })
  cy.on('cxttap', evt => {
    if (evt.target === cy) {
      dispatch('onBackgroundRightClick', {
        model:  evt.position,
        render: evt.renderedPosition
      })
    }
  })
  cy.on('tapstart', 'node', evt => {
    const dragState = new DragState(evt.target)
    const handler = dragHandler(dragState)
    cy.on('tapdrag', handler)
    cy.one('tapend', evt => {
      cy.off('tapdrag', handler)
      if (dragState.hoverNode) {
        dragState.unhover()
        dragState.resetPosition()
        dispatch('onTopicDroppedOntoTopic', {
          topicId: dragState.node.id(),                   // FIXME: number ID?
          droppedOntoTopicId: dragState.hoverNode.id()    // FIXME: number ID?
        })
      } else if (dragState.drag) {
        dispatch('onTopicDragged', {
          id: Number(dragState.node.id()),                // FIXME: number ID?
          pos: dragState.node.position()
        })
      }
    })
  })
}

/**
 * Maintains state for dragging a node and hovering other nodes.
 */
class DragState {

  constructor (node) {
    this.node = node              // the dragged node
    this.nodePosition = {         // the dragged node's original position. Note: a new pos object must be created.
      x: node.position('x'),
      y: node.position('y')
    }
    this.hoverNode = undefined    // the node hovered while dragging
    this.drag = false             // true once dragging starts
  }

  hover () {
    this.hoverNode.addClass('hover')
  }

  unhover () {
    this.hoverNode.removeClass('hover')
  }

  resetPosition () {
    this.node.animate({
      position: this.nodePosition,
      easing: 'ease-in-out-cubic',
      duration: 200
    })
  }
}

function dragHandler (dragState) {
  return function (evt) {
    var _node = nodeAt(evt.position, dragState.node)
    if (_node) {
      if (_node !== dragState.hoverNode) {
        dragState.hoverNode && dragState.unhover()
        dragState.hoverNode = _node
        dragState.hover()
      }
    } else {
      if (dragState.hoverNode) {
        dragState.unhover()
        dragState.hoverNode = undefined
      }
    }
    dragState.drag = true
  }
}

function initContextMenus (dispatch) {
  // Note: a node might be an "auxiliary" node, that is a node that represents an edge.
  // In this case the original edge ID is contained in the node's "assocId" data.
  cy.cxtmenu({
    selector: 'node',
    commands: ele => assocId(ele) ? assocCommands(assocId) : topicCommands,
    atMouse: true
  })
  cy.cxtmenu({
    selector: 'edge',
    commands: ele => assocCommands(idMapper)
  })

  const topicCommands = [
    {content: 'Hide',             select: hideTopic},
    {content: 'Delete',           select: deleteTopic}
  ]

  const assocCommands = idMapper => {
    return [
      {content: 'Hide',   select: hideAssoc},
      {content: 'Delete', select: deleteAssoc}
    ]

    function hideAssoc (ele) {
      dispatch('hideAssoc', idMapper(ele))
    }

    function deleteAssoc (ele) {
      dispatch('deleteAssoc', idMapper(ele))
    }
  }

  function idMapper (ele) {
    return id(ele)
  }

  function assocId (ele) {
    return ele.data('assocId')
  }

  // ---

  function hideTopic (ele) {
    dispatch('hideTopic', id(ele))
  }

  function deleteTopic (ele) {
    dispatch('deleteTopic', id(ele))
  }
}

/**
 * Measures size of detail overlay, adapts the given node's size accordingly, and starts fisheye animation.
 *
 * Precondition:
 * - the DOM is updated already.
 */
function showDetailOverlay(node) {
  const detail = document.querySelector('.dm5-detail-overlay .detail')
  if (!detail) {
    throw Error('No detail overlay')
  }
  state.size = {
    width:  detail.clientWidth,
    height: detail.clientHeight
  }
  // console.log('showDetailOverlay', node.id(), state.size.width, state.size.height)
  node.style(state.size)   // fisheye element style
  playFisheyeAnimation()
}

function playFisheyeAnimation() {
  // Note: node locking diminishes layout quality.
  // state.ele.lock()
  cy.layout({
    name: 'cose-bilkent',
    stop () {
      // console.log('fisheye animation complete')
      // state.ele.unlock()
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

// TODO: memoization
function renderNode (ele) {
  const label = ele.data('label')
  const iconPath = faGlyphPath(ele.data('icon'))
  const size = measureText(label)
  const width = size.width + 32
  const height = size.height + 8
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}"></rect>
      <text x="26" y="${height - 7}" font-family="${fontFamily}" font-size="${mainFontSize}">${label}</text>
      <path d="${iconPath}" fill="${iconColor}" transform="scale(0.009 -0.009) translate(600 -2000)"></path>
    </svg>`
  return {
    url: 'data:image/svg+xml,' + encodeURIComponent(svg),
    width, height
  }
}

function measureText (text) {
  box.textContent = text
  return {
    width: box.clientWidth,
    height: box.clientHeight
  }
}

function nodeAt (pos, excludeNode) {
  var foundNode
  cy.nodes().forEach(node => {
    if (node !== excludeNode && isInside(pos, node)) {
      foundNode = node
      return false    // abort iteration
    }
  })
  return foundNode
}

function isInside (pos, node) {
  var x = pos.x
  var y = pos.y
  var box = node.boundingBox()
  return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
}

function faGlyphPath (unicode) {
  try {
    return faFont.querySelector(`glyph[unicode="${unicode}"]`).getAttribute('d')
  } catch (e) {
    throw Error(`FA glyph "${unicode}" not available (${e})`)
  }
}

function renderTopicmap () {
  const elems = []
  topicmap.forEachTopic(viewTopic => {
    if (viewTopic.isVisible()) {
      elems.push(cyNode(viewTopic))
    }
  })
  topicmap.forEachAssoc(assoc => {
    if (!assoc.hasAssocPlayer()) {    // this renderer doesn't support assoc-connected assocs
      elems.push(cyEdge(assoc))
    }
  })
  cy.remove("*")  // "*" is the group selector "all"
  cy.add(elems)
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
  const ele = state.ele
  // console.log('_syncUnselect', ele)
  if (ele) {
    // update state
    state.ele = undefined
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
        cy.remove(state.auxNode)
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
function auxNode (edge) {
  return cy.add({
    data: {
      assocId: id(edge),  // hold original edge ID
      icon: '\uf10c'      // model.js DEFAULT_TOPIC_ICON
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
      icon:  viewTopic.getIcon(),
      viewTopic
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
  return cy.getElementById(id.toString())   // Note: a Cytoscape element ID is a string
}

function id (ele) {
  // Note: cytoscape element IDs are strings
  return Number(ele.id())
}
