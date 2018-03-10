<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar :comp-defs="toolbarCompDefs"></dm5-toolbar>
    <component :is="renderer" :object-renderers="objectRenderers" :context-commands="contextCommands"></component>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-topicmap-panel created', this.toolbarCompDefs)
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  props: {
    contextCommands: Object,
    toolbarCompDefs: Object
  },

  computed: {
    renderer () {
      // TODO: topicmap renderer registry
      return require('./dm5-cytoscape-renderer').default
    }
  },

  watch: {

    object () {
      this.$store.dispatch('_syncObject', this.object)
    },

    writable () {
      this.$store.dispatch('_syncWritable', this.writable)
    }
  },

  components: {
    'dm5-toolbar': require('./dm5-toolbar').default
  }
}
</script>

<style>
</style>
