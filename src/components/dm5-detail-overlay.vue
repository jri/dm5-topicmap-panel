<template>
  <div :class="['dm5-detail-overlay', {locked}]" v-if="node" :style="style">
    <h3>{{title}}</h3>
    <!--
      Note: apparently "object" (a required "object" prop in child comp) can go away in an earlier update cycle than
      "node" (the visibility predicate in parent comp). So we have to put "v-if" here. TODO: approve this hypothesis.
    -->
    <dm5-object-renderer v-if="object" :object="object" :writable="writable" mode="info" :renderers="objectRenderers">
    </dm5-object-renderer>
    <el-button :class="['lock-button', 'fa', lockIcon]" type="text" @click="toggleLock"></el-button>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-detail-overlay created')
  },

  mounted () {
    // console.log('dm5-detail-overlay mounted')
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  data () {
    return {
      locked: true
    }
  },

  computed: {

    ele () {
      return this.$store.state.cytoscapeRenderer.ele
    },

    auxNode () {
      return this.$store.state.cytoscapeRenderer.auxNode
    },

    size () {
      return this.$store.state.cytoscapeRenderer.size
    },

    zoom () {
      return this.$store.state.cytoscapeRenderer.zoom
    },

    node () {
      return this.ele && (this.ele.isNode() ? this.ele : this.auxNode)
    },

    title () {
      return this.node.data('label')
    },

    style () {
      return {
        top:  this.pos.y + 'px',
        left: this.pos.x + 'px',
        transform: `scale(${this.zoom})`
      }
    },

    pos () {
      const p = this.node.renderedPosition()
      const pos = {x: p.x, y: p.y}
      if (this.size) {
        pos.x -= this.size.width  / 2
        pos.y -= this.size.height / 2
      } else {
        // console.warn('state "size" for', this.node.id(), 'not yet known')
      }
      return pos
    },

    lockIcon () {
      return this.locked ? 'fa-lock' : 'fa-unlock'
    }
  },

  methods: {
    toggleLock () {
      this.locked = !this.locked
    }
  },

  components: {
    'dm5-object-renderer': require('dm5-object-renderer')
  }
}
</script>

<style>
.dm5-detail-overlay {
  position: absolute;
  padding: 0 12px 12px 12px;
  background-color: var(--background-color);
  min-width: 100px;
  max-width: 300px;
}

.dm5-detail-overlay.locked {
  pointer-events: none;
}

.dm5-detail-overlay .lock-button {
  position: absolute;
  top: 1px;
  right: 3px;
  padding: 0;
  pointer-events: initial;
}
</style>
