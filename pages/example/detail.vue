<script setup lang="ts">
const router = useRouter();

const navigationTo = (id: string) => {
  router.push({ name: 'example-code', params: { code: id } });
};
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
    <h1>detail</h1>
    <button
      @click="router.push({ name: 'example-code', params: { code: '1' } })"
    >
      Go to Test 1
    </button>
    <button @click="navigationTo('2')">Go to Test 2</button>
  </div>
</template>

<style scoped></style>
