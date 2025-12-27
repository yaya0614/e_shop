<script setup lang="ts">
import AdminNavigationBar from '~/components/admin-navigation-bar.vue';
</script>

<template>
  <div class="flex flex-1 flex-col w-screen h-screen overflow-hidden">
    <div class="flex flex-row sticky top-0 z-10 bg-gray-300 px-6 py-4 w-full">
      <h1 class="text-2xl">閱森書店-管理中心</h1>
    </div>
    <div class="flex flex-1 flex-row shrink-0 overflow-hidden">
      <AdminNavigationBar />
      <slot />
    </div>
  </div>
</template>
