<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar :compDefs="toolbarCompDefs"></dm5-toolbar>
    <component :is="renderer" :object="object" :writable="writable" :object-renderers="objectRenderers"></component>
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
    toolbarCompDefs: Object
  },

  computed: {
    renderer () {
      // ### TODO: topicmap renderer registry
      return require('./dm5-cytoscape-renderer')
    }
  },

  components: {
    'dm5-toolbar': require('./dm5-toolbar')
  }
}
</script>

<style>
.dm5-topicmap-panel {
  display: flex;
  overflow: hidden;     /* adapt canvas width to window size */
}
</style>
