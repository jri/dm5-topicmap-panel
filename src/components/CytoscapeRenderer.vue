<template>
  <div id="cytoscape-renderer">
    <div id="measurement-box"></div>
  </div>
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

#measurement-box {
  position: absolute;
  visibility: hidden;
}
</style>
