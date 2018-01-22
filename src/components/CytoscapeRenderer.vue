<template>
  <div id="cytoscape-renderer">
    <topic-detail></topic-detail>
    <div id="measurement-box"></div>
  </div>
</template>

<script>
export default {

  created () {
    console.log('CytoscapeRenderer created')
    this.$store.registerModule('cytoscapeRenderer', require('../cytoscape-renderer').default)
  },

  // Note: while loading cytoscape-renderer.js the Cytoscape instance is created. At this time the DOM
  // must be ready. So we do the loading only in the mounted() hook. (created() would be too early.) ### FIXDOC
  mounted () {
    console.log('CytoscapeRenderer mounted')
    this.$store.dispatch('initCytoscape')
  },

  destroyed () {
    console.log('CytoscapeRenderer destroyed!')
    this.$store.dispatch('shutdownRenderer')
  },

  components: {
    'topic-detail': require('./TopicDetail')
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
