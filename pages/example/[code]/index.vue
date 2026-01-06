<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute('example-code');
const code = route.params.code;
</script>

<template>
  <div
    style="
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
    "
  >
    <h1>Example code: {{ code }}</h1>
  </div>
</template>