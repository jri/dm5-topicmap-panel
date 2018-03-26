<template>
  <div class="dm5-topicmap-panel">
    <dm5-toolbar :comp-defs="toolbarCompDefs"></dm5-toolbar>
    <component :is="topicmapRenderer" :object-renderers="objectRenderers" :context-commands="contextCommands"
      :quill-config="quillConfig">
    </component>
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
    toolbarCompDefs: Object,
    topicmapTypes: Object,
    contextCommands: Object,
    quillConfig: Object
  },

  computed: {
    topicmapRenderer () {
      const topicmapTypeUri = 'dm4.webclient.default_topicmap_renderer'     // TODO
      const comp = this.topicmapTypes[topicmapTypeUri].comp
      if (!comp) {
        throw Error(`No renderer known for topicmap type ${topicmapTypeUri}`)
      }
      return comp
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
