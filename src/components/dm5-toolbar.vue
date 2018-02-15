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
  display: flex;              /* arrange childs as a row */
  position: absolute;         /* share space with Cytoscape canvas */
  z-index: 1;                 /* render on top of Cytoscape canvas */
  width: 100%;
  pointer-events: none;       /* make click-through */
}

.dm5-toolbar > * {
  pointer-events: initial;    /* childs still act on clicks */
}
</style>
