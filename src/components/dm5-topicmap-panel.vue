<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar :comp-defs="toolbarCompDefs"></dm5-toolbar>
    <div ref="mountElement"></div><!-- topicmap renderer mount element -->
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-topicmap-panel created', this.topicmapTypes)
    this.$store.registerModule('topicmapPanel', require('../topicmap-panel').default)
  },

  mounted () {
    // console.log('dm5-topicmap-panel mounted')
    this.$store.dispatch('_initTopicmapPanel', {
      topicmapTypes: this.topicmapTypes,
      mountElement: this.$refs.mountElement,
      parent: this
    })
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  props: {
    toolbarCompDefs: Object,
    topicmapTypes: Object,
    contextCommands: Object,
    quillConfig: Object
  },

  components: {
    'dm5-toolbar': require('./dm5-toolbar').default
  }
}
</script>

<style>
</style>
