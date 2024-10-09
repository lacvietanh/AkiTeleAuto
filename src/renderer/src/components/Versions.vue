<script setup>
import { reactive } from 'vue'

const versions = reactive({ ...window.electron.process.versions })
</script>

<template>
  <ul class="toats">
    <li class="electron-version">E {{ versions.electron }}</li>
    <li class="chrome-version">C {{ versions.chrome }}</li>
    <li class="node-version">N {{ versions.node }}</li>
  </ul>
</template>
