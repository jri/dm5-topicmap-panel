<template>
  <div class="dm5-topicmap-panel" v-loading="loading">
    <dm5-toolbar :comp-defs="toolbarCompDefs"></dm5-toolbar>
    <div ref="mountElement"></div><!-- topicmap renderer mount element -->
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {

  created () {
    // console.log('dm5-topicmap-panel created', this.topicmapTypes)
    this.$store.registerModule('topicmapPanel', require('../topicmap-panel').default)
  },

  mounted () {
    // console.log('dm5-topicmap-panel mounted')
    this.$store.dispatch('_initTopicmapPanel', {
      store:        this.$store,
      props:        this.$props,
      mountElement: this.$refs.mountElement,
      parent:       this
    })
  },

  mixins: [
    require('./mixins/object').default,
    require('./mixins/writable').default,
    require('./mixins/object-renderers').default
  ],

  props: {
    selection: Object,
    toolbarCompDefs: Object,
    topicmapTypes: Object,
    contextCommands: Object,
    quillConfig: Object
  },

  computed: mapState({
    topicmapRenderer: state => state.topicmapPanel.topicmapRenderer,
    loading:          state => state.topicmapPanel.loading
  }),

  watch: {

    object () {
      // console.log('object watcher', this.object)
      this.checkTopicmapRenderer()
      this.topicmapRenderer.object = this.object
    },

    writable () {
      // console.log('writable watcher', this.writable)
      this.checkTopicmapRenderer()
      this.topicmapRenderer.writable = this.writable
    }
  },

  methods: {
    checkTopicmapRenderer () {
      if (!this.topicmapRenderer) {
        throw Error('Topicmap renderer not yet instantiated')
      }
    }
  },

  components: {
    'dm5-toolbar': require('./dm5-toolbar').default
  }
}
</script>

<style>
</style>
