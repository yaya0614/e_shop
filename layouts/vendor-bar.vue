<script setup lang="ts"></script>

<template>
  <div class="flex flex-1 flex-col w-screen h-screen overflow-hidden">
    <div class="flex flex-row sticky top-0 z-10 bg-gray-300 px-6 py-4 w-full">
      <h1 class="text-2xl">閱森書店-賣家中心</h1>
    </div>
    <div class="flex flex-1 flex-row shrink-0 overflow-hidden">
      <NavigationBarLeft />
      <slot />
    </div>
  </div>
</template>
