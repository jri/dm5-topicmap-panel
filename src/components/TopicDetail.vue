<template>
  <div class="dm5-topic-detail" v-if="node" :style="{top: pos.y + 'px', left: pos.x + 'px'}">
    <h3>{{title}}</h3>
    <dm5-object-renderer></dm5-object-renderer>
  </div>
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

    title () {
      return this.node.data('label')
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
  padding: 0 12px 12px 12px;
  background-color: var(--background-color);
  min-width: 100px;
  max-width: 300px;
}
</style>
