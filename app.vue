<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <div class="flex flex-col w-screen h-screen max-h-screen overflow-hidden">
    <NuxtLayout>
      <Toaster />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
