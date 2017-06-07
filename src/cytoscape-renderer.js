import cytoscape from 'cytoscape'
import cxtmenu from 'cytoscape-cxtmenu'
import dm5 from 'dm5'

// Note: the topicmap is not vuex state. (This store module provides no state at all, only actions.)
// In conjunction with Cytoscape the topicmap is not considered reactive data.
// We have to bind topicmap data to the Cytoscape graph model manually anyways.
// (This is because Cytoscape deploys a canvas, not a DOM).

var topicmap            // topicmap to render (a Topicmap object)

var cy = initialize()   // the Cytoscape instance
var events = false      // tracks Cytoscape event listener registration, which is lazy

cxtmenu(cytoscape)      // register extension
initContextMenus()

const actions = {

  renderTopicmap ({dispatch}, _topicmap) {
    topicmap = _topicmap
    eventListeners(dispatch)
    refresh()
  },

  // sync view with model

  addTopic (_, id) {
    console.log('addTopic', id)
    cy.add(cyNode(topicmap.getTopic(id)))
  },

  select (_, id) {
    console.log('select', id)
    cy.getElementById(id.toString()).select()
  },

  setTopicPosition (_, id) {
    console.log('setTopicPosition', id)
    const pos = topicmap.getTopic(id).getPosition()
    cy.getElementById(id.toString()).position(pos)   // TODO: think about Cytoscape string IDs
  }
}

export default {
  actions
}

// Cytoscape

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
  cy.cxtmenu({
    selector: 'core',
    commands: [
      {
        content: 'Create'
      }
    ]
  })
}

// lazy registration of Cytoscape event listeners
function eventListeners (dispatch) {
  if (!events) {
    cy.on('select', 'node', e => {
      dispatch('selectTopic', e.target.id())
    })
    cy.on('select', 'edge', e => {
      dispatch('selectAssoc', e.target.id())
    })
    cy.on('tapstart', 'node', e => {
      var node = e.target
      var drag = false
      node.one('tapdrag', e => {
        drag = true
      })
      cy.one('tapend', e => {
        if (drag) {
          dispatch('onTopicDragged', {
            id: node.id(),
            pos: node.position()
          })
        }
      })
    })
    cy.on('tap', e => {
      if (e.target === cy) {
        dispatch('onBackgroundTap', {
          model:  e.position,
          render: e.renderedPosition
        })
      }
    })
    events = true
  }
}

function refresh () {
  console.log('refresh')
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
 * @param   topic   A ViewTopic
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

function cyEdge (assoc) {
  return {
    data: {
      id:     assoc.id,
      label:  assoc.value,
      source: assoc.role1.topic_id,
      target: assoc.role2.topic_id
    }
  }
}
