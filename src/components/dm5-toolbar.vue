<template>
  <div class="dm5-toolbar">
    <component v-for="compDef in compDefs" :is="compDef.comp" :key="compDef.id"></component>
  </div>
</template>

<script>
export default {
  computed: {
    compDefs () {
      return this.$store.state.compDefs.toolbar
    }
  }
}
</script>

<style>
.dm5-toolbar {
  display: flex;
  flex: none;
  position: absolute;
  width: 100%;
  z-index: 10;    /* Cytoscape canvases are at 1, 2, 3 */
  background-color: rgba(0, 0, 0, 0);
}
</style>
