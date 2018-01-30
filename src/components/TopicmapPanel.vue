<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar></dm5-toolbar>
    <component :is="renderer"></component>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-topicmap-panel created')
  },

  computed: {
    renderer () {
      // ### TODO: renderer registry
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
  overflow: hidden;
}
</style>
