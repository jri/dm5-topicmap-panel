import cytoscape from 'cytoscape'
import cxtmenu from 'cytoscape-cxtmenu'
import dm5 from 'dm5'

// settings
// get style from CSS variables
const style = window.getComputedStyle(document.body)
const fontFamily    = style.getPropertyValue('--main-font-family')
const mainFontSize  = style.getPropertyValue('--main-font-size')
const labelFontSize = style.getPropertyValue('--label-font-size')

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
    cyElement(id).position(topicmap.getTopic(id).getPosition())
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
          // 'background-color': '#d0e0f0',
          'background-image': ele => renderSVG(ele).svg,
          // 'background-width': 20,
          // 'background-height': 20,
          // 'background-fit': 'contain',
          // 'background-position-x': 0,
          // 'background-position-y': 3,
          'background-opacity': 0,
          // 'background-clip': 'none',
          // 'padding': padding,
          'width':  ele => renderSVG(ele).width,
          'height': ele => renderSVG(ele).height,
          // 'label': 'data(label)',
          // 'font-family': fontFamily,
          // 'font-size': mainFontSize,
          // 'text-valign': 'center',
          // 'text-margin-x': 16,
          // 'text-wrap': 'wrap',
          // 'text-max-width': 50
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': 'rgb(178, 178, 178)',
          'curve-style': 'bezier',
          'label': 'data(label)',
          // Note: someone (getPropertyValue()?/css-loader?) transforms " into ' what can't be parsed by Cytoscape then
          'font-family': fontFamily.replace(/'/g, '"'),
          'font-size': labelFontSize,
          'text-margin-y': '-10',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': 'red'
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
      var node = evt.target
      var drag = false
      node.one('tapdrag', evt => {
        drag = true
      })
      cy.one('tapend', evt => {
        if (drag) {
          dispatch('onTopicDragged', {
            id: Number(node.id()),
            pos: node.position()
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

// TODO: not used
function renderIcon (ele) {
  return ele.data('icon')
}

function renderSVG (ele) {
  var label = ele.data('label')
  var size = measureText(label)
  var width = size.width
  var height = size.height
  // console.log('renderSVG', label, width, height, fontFamily)
  var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#d0e0f0"></rect>
    <text x="0" y="${height}" font-family="${fontFamily}" font-size="${mainFontSize}">${label}</text>
  </svg>`
  return {
    svg: 'data:image/svg+xml;base64,' + btoa(svg),
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

function id (evt) {
  // Note: cytoscape element IDs are strings
  return Number(evt.target.id())
}

function refreshTopicmap () {
  console.log('refresh topicmap')
  var elems = []
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
 * @param   topic   A DM ViewTopic
 */
function cyNode (topic) {
  return {
    data: {
      id:    topic.id,
      label: topic.value,
      icon:  topic.getIcon()
    },
    position: topic.getPosition()
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
