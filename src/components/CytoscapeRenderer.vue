<template>
  <div id="cytoscape-renderer">
    <div id="measurement-box"></div>
  </div>
</template>

<script>
export default {

  // Note: while loading cytoscape-renderer.js the Cytoscape instance is created. At this time the DOM
  // must be ready. So we do the loading only in the mounted() hook. (created() would be too early.)
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

#measurement-box {
  position: absolute;
  visibility: hidden;
}
</style>
