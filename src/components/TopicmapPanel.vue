<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar></dm5-toolbar>
    <component :is="renderer" :object="object"></component>
  </div>
</template>

<script>
import dm5 from 'dm5'

export default {

  created () {
    console.log('dm5-topicmap-panel created', this.object)
  },

  props: {
    // The selected Topic/Assoc/TopicType/AssocType.
    // Undefined if nothing is selected.
    object: dm5.DeepaMehtaObject
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
