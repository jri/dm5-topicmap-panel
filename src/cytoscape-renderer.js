import cytoscape from 'cytoscape'
import cxtmenu from 'cytoscape-cxtmenu'
import dm5 from 'dm5'

// Note: the topicmap is not vuex state. (This store module provides no state at all, only actions.)
// In conjunction with Cytoscape the topicmap is not considered reactive data.
// We have to bind topicmap data to the Cytoscape graph model manually anyways.
// (This is because Cytoscape deploys a canvas, not a DOM).

var topicmap            // view model: the rendered topicmap (a Topicmap object)

var cy = initialize()   // the Cytoscape instance
var events = false      // tracks Cytoscape event listener registration, which is lazy

cxtmenu(cytoscape)      // register extension
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
  // get style from CSS variables
  const style = window.getComputedStyle(document.body)
  // Note: someone (getPropertyValue()?/css-loader?) transforms " into ' what can't be parsed by Cytoscape then
  const font     = style.getPropertyValue('--main-font-family').replace(/'/g, '"')
  const nodeSize = style.getPropertyValue('--main-font-size')
  const edgeSize = style.getPropertyValue('--label-font-size')
  //
  return cytoscape({
    container: document.getElementById('cytoscape-renderer'),
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'rectangle',
          'background-color': 'hsl(210, 100%, 90%)',
          'padding': '3px',
          'width': 'label',
          'height': 'label',
          'label': 'data(label)',
          'font-family': font,
          'font-size': nodeSize,
          'text-valign': 'center'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': 'rgb(178, 178, 178)',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-family': font,
          'font-size': edgeSize,
          'text-margin-y': '-10',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 2,
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

function id(evt) {
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
      label: topic.value
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
