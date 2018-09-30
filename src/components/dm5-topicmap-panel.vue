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
    toolbarCompDefs: Object,
    topicmapTypes: Object,
    contextCommands: Object,
    quillConfig: Object
  },

  data () {
    return {
      // mirror props ### FIXME: add remaining props?
      object_:   this.object,
      writable_: this.writable
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
