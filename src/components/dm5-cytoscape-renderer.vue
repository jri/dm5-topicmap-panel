<template>
  <div class="dm5-cytoscape-renderer">
    <div class="cytoscape-container" ref="cytoscape-container"></div>
    <div class="measurement-box" ref="measurement-box"></div>
    <dm5-detail-overlay :object="object" :writable="writable" :objectRenderers="objectRenderers" :zoom="zoom">
    </dm5-detail-overlay>
  </div>
</template>

<script>
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import cxtmenu from 'cytoscape-cxtmenu'
import fa from 'font-awesome/fonts/fontawesome-webfont.svg'
import dm5 from 'dm5'

// get style from CSS variables
const style = window.getComputedStyle(document.body)
const FONT_FAMILY          = style.getPropertyValue('--main-font-family')
const MAIN_FONT_SIZE       = style.getPropertyValue('--main-font-size')
const LABEL_FONT_SIZE      = style.getPropertyValue('--label-font-size')
const ICON_COLOR           = style.getPropertyValue('--color-topic-icon')
const HOVER_BORDER_COLOR   = style.getPropertyValue('--color-topic-hover')
const BACKGROUND_COLOR     = style.getPropertyValue('--background-color')
const BORDER_COLOR_LIGHTER = style.getPropertyValue('--border-color-lighter')

var box                   // the measurement box
var faFont                // Font Awesome SVG <font> element

const svgReady = dm5.restClient.getXML(fa).then(svg => {
  // console.log('### SVG ready!')
  faFont = svg.querySelector('font')
})

// register extensions
cytoscape.use(coseBilkent)
cytoscape.use(cxtmenu)

export default {

  created () {
    // console.log('dm5-cytoscape-renderer created')
    this.$store.registerModule('cytoscapeRenderer', require('../cytoscape-renderer').default)
  },

  // Note: when the Cytoscape instance is created the DOM must be ready.
  mounted () {
    // console.log('dm5-cytoscape-renderer mounted')
    this.$store.dispatch('initCytoscape', {
      cy: this.initialize(),
      svgReady
    })
    this.eventListeners()
    this.contextMenus()
    box = this.$refs['measurement-box']
  },

  destroyed () {
    console.log('dm5-cytoscape-renderer destroyed!')
    this.$store.dispatch('shutdownCytoscape')
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  data: () => ({
    zoom: 1         // TODO: real init value
  }),

  computed: {
    cy () {
      return this.$store.state.cytoscapeRenderer.cy
    }
  },

  methods: {

    initialize () {
      return cytoscape({
        container: this.$refs['cytoscape-container'],
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
              'border-color': BORDER_COLOR_LIGHTER,
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
              'font-family': FONT_FAMILY,
              'font-size': LABEL_FONT_SIZE,
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
              'border-color': HOVER_BORDER_COLOR,
              'border-opacity': 1
            }
          }
        ],
        layout: {
          name: 'preset'
        },
        wheelSensitivity: 0.2
      })
    },

    // register Cytoscape event listeners
    eventListeners () {
      this.cy.on('tap', 'node', e => {
        const clicks = e.originalEvent.detail
        // console.log('"tap node" event!', id(e.target), clicks)
        if (clicks === 1) {
          this.$parent.$emit('topic-select', id(e.target))
        } else if (clicks === 2) {
          this.$parent.$emit('topic-double-click', id(e.target))
        }
      }).on('tap', 'edge', e => {
        // console.log('"tap edge" event!', id(e.target))
        this.$parent.$emit('assoc-select', id(e.target))
      }).on('tap', e => {
        if (e.target === this.cy) {
          // console.log('"tap background" event!')
          this.$parent.$emit('topicmap-click')
        }
      }).on('cxttap', e => {
        if (e.target === this.cy) {
          this.$parent.$emit('topicmap-contextmenu', {
            model:  e.position,
            render: e.renderedPosition
          })
        }
      }).on('tapstart', 'node', e => {
        const dragState = new DragState(e.target)
        const handler = this.dragHandler(dragState)
        this.cy.on('tapdrag', handler)
        this.cy.one('tapend', e => {
          this.cy.off('tapdrag', handler)
          if (dragState.hoverNode) {
            dragState.unhover()
            dragState.resetPosition()
            this.$parent.$emit('topic-drop-on-topic', {
              // topic 1 dropped onto topic 2
              topicId1: id(dragState.node),
              topicId2: id(dragState.hoverNode)
            })
          } else if (dragState.drag) {
            this.$parent.$emit('topic-drag', {
              id: id(dragState.node),
              pos: dragState.node.position()
            })
          }
        })
      }).on('zoom', () => {
        this.zoom = this.cy.zoom()
      })
    },

    contextMenus () {
      // Note: a node might be an "auxiliary" node, that is a node that represents an edge.
      // In this case the original edge ID is contained in the node's "assocId" data.
      this.cy.cxtmenu({
        selector: 'node',
        commands: ele => assocId(ele) ? assocCommands(assocId) : topicCommands,
        atMouse: true
      })
      this.cy.cxtmenu({
        selector: 'edge',
        commands: ele => assocCommands(id)
      })

      const topicCommands = [
        {content: 'Hide',   select: ele => this.$store.dispatch('hideTopic',   id(ele))},
        {content: 'Delete', select: ele => this.$store.dispatch('deleteTopic', id(ele))}
      ]

      const assocCommands = idMapper => [
        {content: 'Hide',   select: ele => this.$store.dispatch('hideAssoc',   idMapper(ele))},
        {content: 'Delete', select: ele => this.$store.dispatch('deleteAssoc', idMapper(ele))}
      ]

      function assocId (ele) {
        return ele.data('assocId')
      }
    },

    dragHandler (dragState) {
      return e => {
        var _node = this.nodeAt(e.position, dragState.node)
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
    },

    nodeAt (pos, excludeNode) {
      var foundNode
      this.cy.nodes().forEach(node => {
        if (node !== excludeNode && isInside(pos, node)) {
          foundNode = node
          return false    // abort iteration
        }
      })
      return foundNode
    }
  },

  components: {
    'dm5-detail-overlay': require('./dm5-detail-overlay')
  }
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

// TODO: memoization
function renderNode (ele) {
  const label = ele.data('label')
  const iconPath = faGlyphPath(ele.data('icon'))
  const size = measureText(label)
  const width = size.width + 32
  const height = size.height + 8
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${BACKGROUND_COLOR}"></rect>
      <text x="26" y="${height - 7}" font-family="${FONT_FAMILY}" font-size="${MAIN_FONT_SIZE}">${label}</text>
      <path d="${iconPath}" fill="${ICON_COLOR}" transform="scale(0.009 -0.009) translate(600 -2000)"></path>
    </svg>`
  return {
    url: 'data:image/svg+xml,' + encodeURIComponent(svg),
    width, height
  }
}

function faGlyphPath (unicode) {
  try {
    return faFont.querySelector(`glyph[unicode="${unicode}"]`).getAttribute('d')
  } catch (e) {
    throw Error(`FA glyph "${unicode}" not available (${e})`)
  }
}

function measureText (text) {
  box.textContent = text
  return {
    width: box.clientWidth,
    height: box.clientHeight
  }
}

function isInside (pos, node) {
  var x = pos.x
  var y = pos.y
  var box = node.boundingBox()
  return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
}

// copy in cytoscape-renderer.js
function id (ele) {
  // Note: cytoscape element IDs are strings
  return Number(ele.id())
}
</script>

<style>
.dm5-cytoscape-renderer {
  height: 100%;
}

.dm5-cytoscape-renderer .cytoscape-container {
  height: 100%;
}

.dm5-cytoscape-renderer .measurement-box {
  position: absolute;
  visibility: hidden;
}
</style>
