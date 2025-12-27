<script setup lang="ts">
import chartModel from '~/components/chart-model.vue';
import orderModel from '~/components/order-model.vue';

definePageMeta({
  layout: 'vendor-bar',
});
const selectedMonth = ref<string>('');

const exportReport = () => {
  if (!selectedMonth.value) {
    alert('請選擇月份');
    return;
  }
};
</script>

<template>
  <div class="flex flex-col h-screen px-8 py-8 mb-2 overflow-y-scroll w-screen">
    <h1 class="font-semibold mb-8 text-2xl">Dashboard</h1>

    <div class="mt-2 flex gap-6">
      <div class="basis-4/5">
        <div class="w-full aspect-video">
          <ClientOnly>
            <chartModel class="w-full h-full" />
          </ClientOnly>
        </div>
      </div>

      <div
        class="basis-1/5 flex flex-col justify-center gap-4 border rounded-lg p-6 bg-white"
      >
        <div class="flex flex-1 flex-col py-4 gap-2">
          <p class="text-2xl text-gray-700">店家名稱</p>
          <p class="text-gray-700">創建時間</p>
        </div>

        <div class="text-sm font-medium text-gray-700">指定報表時間</div>

        <input
          v-model="selectedMonth"
          type="month"
          class="border rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
        />

        <button
          :disabled="!selectedMonth"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition"
          @click="exportReport"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16"
            />
          </svg>

          匯出報表
        </button>
      </div>
    </div>

    <h1 class="text-xl font-semibold mt-10 mb-4 shrink-0">近期訂單</h1>

    <div class="flex h-fit w-full flex-col">
      <order-model class="w-full" />
    </div>
    <div class="flex h-fit w-full flex-col opacity-0">
      <order-model class="w-full" />
    </div>
  </div>
</template>
