<template>
  <div class="dm5-topicmap-panel" v-loading="loading">
    <dm5-toolbar :comp-defs="toolbarCompDefs_"></dm5-toolbar>
    <component :is="topicmapRenderer" :object="object_" :writable="writable_" :detail-renderers="detailRenderers"
      :context-commands="contextCommands" :quill-config="quillConfig">
    </component>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {

  created () {
    // console.log('dm5-topicmap-panel created', this.topicmapTypes, this.$store)
    this.$store.registerModule('topicmapPanel', require('../topicmap-panel').default)
    this.$store.dispatch('_initTopicmapPanel', this)
  },

  mounted () {
    // console.log('dm5-topicmap-panel mounted')
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/detail-renderers').default
  ],

  props: {
    toolbarCompDefs: Object,
    topicmapTypes:   Object,
    contextCommands: Object,
    quillConfig:     Object
  },

  data () {
    return {
      topicmapRenderer: undefined,
      // mirror props (mirroring the *dynamic* props is sufficient)
      // Note: making `toolbarCompDefs` dynamic allows components to be added *after* dm5-topicmap-panel instantiation.
      // E.g. the DMX Webclient does *not* synchronize plugin loading and instantiation of its toplevel components.
      object_:           this.object,
      writable_:         this.writable,
      toolbarCompDefs_:  this.toolbarCompDefs
    }
  },

  computed: mapState({
    loading: state => state.topicmapPanel.loading
  }),

  components: {
    'dm5-toolbar': require('./dm5-toolbar').default
  }
}
</script>
