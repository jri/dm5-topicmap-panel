<template>
  <dm5-object-renderer class="dm5-topic-detail" v-if="node" :style="{top: pos.y + 'px', left: pos.x + 'px'}">
  </dm5-object-renderer>
</template>

<script>
export default {

  computed: {

    ele () {
      return this.$store.state.cytoscapeRenderer.ele
    },

    size () {
      return this.$store.state.cytoscapeRenderer.size
    },

    node () {
      return this.ele && this.ele.isNode() && this.ele
    },

    pos () {
      const p = this.node.position()
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

  components: {
    'dm5-object-renderer': require('dm5-object-renderer')
  }
}
</script>

<style>
.dm5-topic-detail {
  position: absolute;
  background-color: #fee;
}
</style>
