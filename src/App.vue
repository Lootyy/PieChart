<script setup>
  import { ref, computed } from 'vue'
  import PieBar from './PieBar.vue'
  import List from './List.vue'
  import { Tracker } from './Tracker.js'

  const gap = ref(2)
  const width = ref(20)
  const fluid = ref(true)

  const canFluid = computed(() => width.value < 100)

  Tracker.set([ {count:5, children:[{count:2},{count:2}]},
                {count:5},
                {count:3, children: [{count:2},{count:3},{count:1}]},
                {count:2},
                {count:2} ])

</script>

<template>
  <div class="content">
    <h2 class="title">Click on the green :)</h2>
      <div class='controls'>
        <label>Gap <span class="value">{{ gap }}</span></label>
        <input class type="range" min="0" max="36" step="0.5" value="2" @input="e => gap = Number(e.target.value)" >
        <label>Width <span class="value"> {{ width }}</span></label>
        <input type="range" min="10" max="200" value="30" @input="e => width = Number(e.target.value)">
        <label>Fluid</label>
        <input type="checkbox" :disabled="!canFluid" v-model="fluid">
      </div>
      <PieBar class="piebar" :data="Tracker.data" :gap="gap" :width="width" :fluid="fluid"></PieBar>
    <div class='groups'>
      <List :data="Tracker.data">
      </List>
    </div>
  </div>
</template>

<style scoped>
.content {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 660px 1fr;
  grid-template-rows: 1fr 660px 1fr;
  grid-template-areas:  '. title .'
                        'controls graph .'
                        'groups groups groups';
}
.controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: fit-content;
  justify-self: end;
  grid-area: controls;
}

.piebar {
  width: 660px;
  align-self: flex-end;
  grid-area: graph;
}

.groups {
  grid-column: span 3;
  grid-area: groups;
  width: min-content;
  justify-self: center;
}

.controls label {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.controls [type='checkbox'] {
  width: 1.2rem;
  aspect-ratio: 1 / 1;
}

.title {
  grid-area: title;
  margin: auto;
}


</style>
