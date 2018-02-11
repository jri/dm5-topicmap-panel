<template>
  <div id="dm5-cytoscape-renderer">
    <div id="cytoscape-container"></div>
    <div id="measurement-box"></div>
    <dm5-detail-overlay :object="object" :writable="writable" :objectRenderers="objectRenderers"></dm5-detail-overlay>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-cytoscape-renderer created')
    this.$store.registerModule('cytoscapeRenderer', require('../cytoscape-renderer').default)
  },

  // Note: while loading cytoscape-renderer.js the Cytoscape instance is created. At this time the DOM
  // must be ready. So we do the loading only in the mounted() hook. (created() would be too early.) ### FIXDOC
  mounted () {
    // console.log('dm5-cytoscape-renderer mounted')
    this.$store.dispatch('initCytoscape')
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

  components: {
    'dm5-detail-overlay': require('./dm5-detail-overlay')
  }
}
</script>

<style>
#dm5-cytoscape-renderer {
  flex: auto;
  overflow: hidden;     /* adapt canvas width to window size */
}

#dm5-cytoscape-renderer #cytoscape-container {
  height: 100%;
}

#dm5-cytoscape-renderer #measurement-box {
  position: absolute;
  visibility: hidden;
}
</style>
