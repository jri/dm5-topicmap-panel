# DeepaMehta 5 Topicmap Panel

## Version History

**0.9** -- Feb 21, 2018

* In-map *assoc* details.
* Better composability:
    * Component relies on explicit props (instead of context injection): `object`, `writable`, `objectRenderers`, `toolbarCompDefs`. Props have reasonable defaults.
    * Component emits events (instead of dispatching actions): `topic-select`, `topic-double-click`, `topic-drag`, `topic-drop-on-topic`, `assoc-select`, `topicmap-click`, `topicmap-contextmenu`.
    * Toolbar provides separate `left` and `right` mount points.
    * Canvas resize can be triggered from outside.
* Fixes:
    * Click events on toolbar background bubble to canvas.
    * In-map details do not line wrap at canvas edge.

**0.8** -- Feb 3, 2018

* In-map topic details with inline edit capability
* "Semantic Fisheye" layout with animations
* Composability: inject context instead of accessing host app store

**0.7** -- Jan 13, 2018

* Topic colors customizable via CSS vars

**0.6** -- Oct 19, 2017

* Colored associations
* Detect topic double click

**0.5** -- Oct 3, 2017

* Synchronize initialization
* Visualize topic/assoc selection states

**0.4** -- Jul 17, 2017

**0.3** -- Jun 30, 2017

**0.2** -- Jun 14, 2017

**0.1** -- Apr 28, 2017

------------
Jörg Richter  
Feb 21, 2018
