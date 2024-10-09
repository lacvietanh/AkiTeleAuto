<script setup>
  import Nav from './components/Nav.vue'
  import Features from './components/Features.vue'
  import Dashboard from './components/Dashboard.vue'
  import GameControls from './components/GameControls.vue'
  
  import { onMounted } from 'vue';

  onMounted(() => {

  })

</script>

<template>
  <div class="text">
    <span class="appName title">Aki Tele Auto <span class="is-hidden">PRO</span></span>
  </div>
  <div class="appDescription">
    <span>Telegram MiniApp Manager </span>
    <span class="AutoFarm-Pro"> & Auto Farm</span>
  </div>


  <Nav></Nav>
  <Features />
  <Dashboard />
  <GameControls />

</template>
<style scoped></style>