<template>
  <div class="dm5-topicmap-panel">
    <slot name="dm5-topicmap-panel"></slot>
    <component :is="renderer"></component>
  </div>
</template>

<script>
export default {
  computed: {
    renderer () {
      // ### TODO: renderer registry
      return require('./CytoscapeRenderer')
    }
  }
}
</script>

<style>
.dm5-topicmap-panel {
  display: flex;
  overflow: hidden;
}
</style>
