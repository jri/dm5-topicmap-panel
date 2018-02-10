<template>
  <div id="cytoscape-renderer">
    <div id="cytoscape-container"></div>
    <div id="measurement-box"></div>
    <topic-detail :object="object" :writable="writable" :objectRenderers="objectRenderers"></topic-detail>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('CytoscapeRenderer created')
    this.$store.registerModule('cytoscapeRenderer', require('../cytoscape-renderer').default)
  },

  // Note: while loading cytoscape-renderer.js the Cytoscape instance is created. At this time the DOM
  // must be ready. So we do the loading only in the mounted() hook. (created() would be too early.) ### FIXDOC
  mounted () {
    // console.log('CytoscapeRenderer mounted')
    this.$store.dispatch('initCytoscape')
  },

  destroyed () {
    console.log('CytoscapeRenderer destroyed!')
    this.$store.dispatch('shutdownCytoscape')
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  components: {
    'topic-detail': require('./TopicDetail')
  }
}
</script>

<style>
#cytoscape-renderer {
  flex: auto;
  overflow: hidden;     /* adapt canvas width to window size */
}

#cytoscape-renderer #cytoscape-container {
  height: 100%;
}

#cytoscape-renderer #measurement-box {
  position: absolute;
  visibility: hidden;
}
</style>
