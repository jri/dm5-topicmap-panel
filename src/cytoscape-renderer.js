import cytoscape from 'cytoscape'
import cxtmenu from 'cytoscape-cxtmenu'
import fa from 'font-awesome/fonts/fontawesome-webfont.svg'
import dm5 from 'dm5'

var faFont
dm5.restClient.getXML(fa).then(svg => {
  console.log('Font Awesome SVG loaded', svg)
  faFont = svg.querySelector('font')
})

// settings
// get style from CSS variables
const style = window.getComputedStyle(document.body)
const fontFamily      = style.getPropertyValue('--main-font-family')
const mainFontSize    = style.getPropertyValue('--main-font-size')
const labelFontSize   = style.getPropertyValue('--label-font-size')
const backgroundColor = style.getPropertyValue('--background-color')

// Note: the topicmap is not vuex state. (This store module provides no state at all, only actions.)
// In conjunction with Cytoscape the topicmap is not considered reactive data.
// We have to bind topicmap data to the Cytoscape graph model manually anyways.
// (This is because Cytoscape deploys a canvas, not a DOM).

var topicmap              // view model: the rendered topicmap (a Topicmap object)

const cy = initialize()   // the Cytoscape instance
var events = false        // tracks Cytoscape event listener registration, which is lazy

const box = document.getElementById('measurement-box')

cxtmenu(cytoscape)        // register extension
initContextMenus()

const actions = {

  // sync renderer with view model

  syncTopicmap ({dispatch}, _topicmap) {
    console.log('syncTopicmap', _topicmap.id)
    topicmap = _topicmap
    eventListeners(dispatch)
    refreshTopicmap()
  },

  syncAddTopic (_, id) {
    console.log('syncAddTopic', id)
    cy.add(cyNode(topicmap.getTopic(id)))
  },

  syncAddAssoc (_, id) {
    console.log('syncAddAssoc', id)
    cy.add(cyEdge(topicmap.getAssoc(id)))
  },

  syncTopicLabel (_, id) {
    console.log('syncTopicLabel', id)
    cyElement(id).data('label', topicmap.getTopic(id).value)
  },

  syncSelect (_, id) {
    console.log('syncSelect', id)
    cy.elements(":selected").unselect()
    cyElement(id).select()
  },

  syncTopicPosition (_, id) {
    console.log('syncTopicPosition', id)
    cyElement(id).animate({
      position: topicmap.getTopic(id).getPosition(),
      easing: 'ease-in-out-cubic'
    })
  },

  // ---

  shutdownRenderer () {
    // TODO
    console.log('Unregistering cxtmenu extension')
  }
}

export default {
  actions
}

// ---

function initialize() {
  return cytoscape({
    container: document.getElementById('cytoscape-renderer'),
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'rectangle',
          'background-image': ele => renderNode(ele).svg,
          'background-opacity': 0,
          'width':  ele => renderNode(ele).width,
          'height': ele => renderNode(ele).height,
          'border-width': 3,
          'border-opacity': 0
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
        selector: 'node:selected',
        style: {
          'border-color': 'red',
          'border-opacity': 1
        }
      },
      {
        selector: 'node.hover',
        style: {
          'border-color': '#36a',
          'border-opacity': 1
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': 'red'
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
  if (!events) {
    cy.on('select', 'node', evt => {
      dispatch('selectTopic', id(evt))
    })
    cy.on('select', 'edge', evt => {
      dispatch('selectAssoc', id(evt))
    })
    cy.on('unselect', evt => {
      dispatch('unselect', id(evt))
    })
    cy.on('tapstart', 'node', evt => {
      const dragState = new DragState(evt.target)
      cy.on('tapdrag', dragHandler(dragState))
      cy.one('tapend', evt => {
        cy.off('tapdrag')
        if (dragState.hoverNode) {
          dragState.unhover()
          dragState.resetPosition()
          dispatch('onTopicDroppedOntoTopic', {
            topicId: dragState.node.id(),
            droppedOntoTopicId: dragState.hoverNode.id()
          })
        } else if (dragState.drag) {
          dispatch('onTopicDragged', {
            id: Number(dragState.node.id()),
            pos: dragState.node.position()
          })
        }
      })
    })
    cy.on('cxttap', evt => {
      if (evt.target === cy) {
        dispatch('onBackgroundRightClick', {
          model:  evt.position,
          render: evt.renderedPosition
        })
      }
    })
    events = true
  }
}

/**
 * Maintains display state for dragging a node and hovering other nodes.
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

function initContextMenus () {
  // TODO
  cy.cxtmenu({
    selector: 'node',
    commands: [
      {
        content: 'Hide Topic'
      },
      {
        content: 'Delete Topic'
      }
    ]
  })
  cy.cxtmenu({
    selector: 'edge',
    commands: [
      {
        content: 'Hide Association'
      },
      {
        content: 'Delete Association'
      }
    ]
  })
}

// TODO: memoization
function renderNode (ele) {
  const label = ele.data('label')
  const iconPath = faGlyphPath(ele.data('icon'))
  const iconColor = '#36a'
  const size = measureText(label)
  const width = size.width + 32
  const height = size.height + 8
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}"></rect>
      <text x="26" y="${height - 7}" font-family="${fontFamily}" font-size="${mainFontSize}">${label}</text>
      <path d="${iconPath}" fill="${iconColor}" transform="scale(0.009 -0.009) translate(600 -2000)"></path>
    </svg>`
  return {
    svg: 'data:image/svg+xml,' + encodeURIComponent(svg),
    width, height
  }
}

function measureText(text) {
  box.textContent = text
  return {
    width: box.clientWidth,
    height: box.clientHeight
  }
}

function nodeAt(pos, excludeNode) {
  var foundNode
  cy.nodes().forEach(node => {
    if (node !== excludeNode && isInside(pos, node)) {
      foundNode = node
      return false    // abort iteration
    }
  })
  return foundNode
}

function isInside(pos, node) {
  var x = pos.x
  var y = pos.y
  var box = node.boundingBox()
  return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
}

function faGlyphPath (unicode) {
  try {
    return faFont.querySelector(`glyph[unicode="${unicode}"]`).getAttribute('d')
  } catch (e) {
    throw Error(`Glyph "${unicode}" not found`)
  }
}

function id (evt) {
  // Note: cytoscape element IDs are strings
  return Number(evt.target.id())
}

function refreshTopicmap () {
  const elems = []
  topicmap.forEachTopic(topic => {
    elems.push(cyNode(topic))
  })
  topicmap.forEachAssoc(assoc => {
    elems.push(cyEdge(assoc))
  })
  cy.add(elems)
}

/**
 * Builds a Cytoscape node from a DM ViewTopic.
 *
 * @param   viewTopic   A DM ViewTopic
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
 * Builds a Cytoscape edge from a DM Assoc.
 *
 * @param   assoc   A DM Assoc
 */
function cyEdge (assoc) {
  return {
    data: {
      id:     assoc.id,
      label:  assoc.value,
      source: assoc.role1.topicId,
      target: assoc.role2.topicId
    }
  }
}

/**
 * Gets the Cytoscape element with the given ID.
 *
 * @param   id    a DM object id (number)
 */
function cyElement(id) {
  return cy.getElementById(id.toString())   // Note: a Cytoscape element ID is a string
}
