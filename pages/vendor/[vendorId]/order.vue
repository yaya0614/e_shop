<script setup lang="ts">
definePageMeta({
  layout: 'vendor-bar',
});
</script>

<template>
  <div class="flex flex-1 flex-col px-8 py-8 h-screen w-screen">
    <h1 class="font-semibold mb-8 text-2xl">商家訂單</h1>
    <order-model class="w-full" />
  </div>
</template>
