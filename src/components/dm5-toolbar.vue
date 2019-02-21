<template>
  <div class="dm5-toolbar">
    <div class="left">
      <component v-for="compDef in compDefs.left" :is="compDef.comp" :key="compDef.id"></component>
    </div>
    <div class="right">
      <component v-for="compDef in compDefs.right" :is="compDef.comp" :key="compDef.id"></component>
    </div>
  </div>
</template>

<script>
export default {

  created () {
    // console.log('dm5-toolbar created', this.compDefs)
  },

  props: {
    compDefs: Object
  }
}
</script>

<style>
.dm5-toolbar {
  display: flex;              /* arrange childs as a row */
  align-items: flex-start;
  position: absolute;         /* share space with Cytoscape canvas */
  z-index: 1001;              /* render on top of Leaflet container */
  box-sizing: border-box;
  width: 100%;
  padding: 4px 8px 0 4px;
  pointer-events: none;       /* make toolbar click-through */
}

.dm5-toolbar > div {
  display: flex;
}

.dm5-toolbar > div.right {
  flex: auto;
  justify-content: flex-end;
}

.dm5-toolbar > div > * {
  pointer-events: initial;    /* childs still act on clicks */
}
</style>
