<template>
  <div class="dm5-topic-detail" v-if="topic" :style="{top: pos.y + 'px', left: pos.x + 'px'}">
    <dm5-object-renderer></dm5-object-renderer>
  </div>
</template>

<script>
export default {

  computed: {

    topic () {
      return this.$store.state.cytoscapeRenderer.selectedTopic
    },

    pos () {
      const pos = this.topic.getPosition()
      return {
        x: pos.x - this.size.width / 2,
        y: pos.y - this.size.height / 2
      }
    },

    size () {
      return {width: 250, height: 150}    // TODO
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
  width: 250px;   /* TODO */
  height: 150px;  /* TODO */
}
</style>
