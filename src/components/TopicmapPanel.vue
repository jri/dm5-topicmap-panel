<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar></dm5-toolbar>
    <component :is="renderer" :object="object" :objectRenderers="objectRenderers"></component>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-topicmap-panel created')
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/object-renderers').default
  ],

  computed: {
    renderer () {
      // ### TODO: topicmap renderer registry
      return require('./CytoscapeRenderer')
    }
  },

  components: {
    'dm5-toolbar': require('./Toolbar')
  }
}
</script>

<style>
.dm5-topicmap-panel {
  display: flex;
  overflow: hidden;     /* adapt canvas width to window size */
}
</style>
