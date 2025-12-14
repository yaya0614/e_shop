<template>
  <div class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">操作紀錄</h1>
      <NuxtLink to="/home" class="text-sm text-blue-600 hover:underline">
        ← 回首頁
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-center py-10 text-gray-500">
      <span class="animate-pulse">資料載入中...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 p-4 rounded text-center">
      <p class="font-bold">無法取得紀錄</p>
      <p class="text-sm mt-1">{{ error.message }}</p>
    </div>

    <div v-else>
      <div v-if="logs.length === 0" class="text-center py-12 bg-gray-50 rounded-lg text-gray-400">
        <p>目前沒有任何紀錄</p>
      </div>

      <ul v-else class="space-y-3">
        <li 
          v-for="log in logs" 
          :key="log.id" 
          class="p-4 border border-gray-100 rounded-lg hover:bg-blue-50 transition flex justify-between items-center group"
        >
          <div class="flex flex-col">
            <span class="font-bold text-gray-800 group-hover:text-blue-700">
              {{ log.message }}
            </span>
          </div>
          
          <div class="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
            {{ new Date(log.createdAt).toLocaleString() }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. 定義資料形狀 (配合你的 log.prisma)
interface LogItem {
  id: string;
  message: string; // ✅ 這裡改成 message
  createdAt: string;
}

interface LogApiResponse {
  success: boolean;
  data: LogItem[];
}

// 2. 呼叫 API
const { data, pending, error } = await useFetch<LogApiResponse>('/api/user/logs');

const logs = computed(() => {
  return data.value?.data || [];
});

useHead({ title: '操作紀錄 | E-Shop' });
</script>