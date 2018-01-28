<template>
  <div class="dm5-topic-detail" v-if="node" :style="style">
    <el-button class="menu-button fa fa-bars" type="text" @contextmenu.native.prevent="openMenu"></el-button>
    <h3>{{title}}</h3>
    <dm5-object-renderer></dm5-object-renderer>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-topic-detail created')
  },

  mounted () {
    // console.log('dm5-topic-detail mounted')
  },

  computed: {

    ele () {
      return this.$store.state.cytoscapeRenderer.ele
    },

    size () {
      return this.$store.state.cytoscapeRenderer.size
    },

    zoom () {
      return this.$store.state.cytoscapeRenderer.zoom
    },

    node () {
      return this.ele && this.ele.isNode() && this.ele
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
        console.warn('state "size" for', this.node.id(), 'not yet known')
      }
      return pos
    }
  },

  methods: {
    openMenu () {
      this.node.emit('cxttapstart', {
        position: {x: 100, y: 100}, renderedPosition: {x: 100, y: 100}, rp: {x: 100, y: 100}  // TODO
      })
    }
  },

  components: {
    'dm5-object-renderer': require('dm5-object-renderer')
  }
}
</script>

<style>
.dm5-topic-detail {
  position: absolute;
  padding: 0 12px 12px 12px;
  background-color: var(--background-color);
  min-width: 100px;
  max-width: 300px;
}

.dm5-topic-detail .menu-button {
  position: absolute;
  top: 1px;
  right: 3px;
  padding: 0;
}
</style>
