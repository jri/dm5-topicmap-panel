<template>
  <div id="cytoscape-renderer"></div>
</template>

<script>
export default {

  mounted () {
    this.$store.registerModule('cytoscapeRenderer', require('../cytoscape-renderer').default)
  },

  destroyed () {
    console.log('CytosscapeRenderer destroyed')
    this.$store.dispatch('shutdownRenderer')
  }
}
</script>

<style>
#cytoscape-renderer {
  flex: auto;
  overflow: hidden;
}
</style>
