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
    require('./mixins/detail-renderers').default
  ],

  props: {
    showInmapDetails: Boolean,
    toolbarCompDefs: Object,
    topicmapTypes: Object,
    contextCommands: Object,
    quillConfig: Object
  },

  data () {
    return {
      // mirror props (dynamic props are sufficient)
      object_:           this.object,
      writable_:         this.writable,
      showInmapDetails_: this.showInmapDetails
      // toolbarCompDefs_:  this.toolbarCompDefs   // FIXME: needed?
    }
  },

  computed: mapState({
    topicmapRenderer: state => state.topicmapPanel.topicmapRenderer,
    loading:          state => state.topicmapPanel.loading
  }),

  watch: {

    object_ () {
      // console.log('object_ watcher', this.object_)
      this.checkTopicmapRenderer()
      this.topicmapRenderer.object = this.object_
    },

    writable_ () {
      // console.log('writable_ watcher', this.writable_)
      this.checkTopicmapRenderer()
      this.topicmapRenderer.writable = this.writable_
    },

    showInmapDetails_ () {
      // console.log('showInmapDetails_ watcher', this.showInmapDetails_)
      this.checkTopicmapRenderer()
      this.topicmapRenderer.showInmapDetails = this.showInmapDetails_
    }
  },

  methods: {
    checkTopicmapRenderer () {
      if (!this.topicmapRenderer) {
        throw Error('no topicmap renderer instantiated')
      }
    }
  },

  components: {
    'dm5-toolbar': require('./dm5-toolbar').default
  }
}
</script>
