<script setup lang="ts">
import { computed } from 'vue';

definePageMeta({
  layout: 'header-all',
});

interface LogItem {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

// 2. 整合 API (API Integrate)：對接 api/user/log/
const {
  data: logsData,
  pending,
  error,
  refresh,
} = await useFetch<{ logs: LogItem[] }>('/api/user/log', {
  method: 'GET',
  credentials: 'include',
});

const logs = computed(() => logsData.value?.logs || []);

// 3. 處理任務要求的 Date 顯示格式
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

// 視覺樣式邏輯
const getLogTypeClass = (message: string) => {
  const msg = message.toUpperCase();
  if (msg.includes('創建') || msg.includes('CREATE') || msg.includes('新增')) {
    return 'bg-green-50 border-green-200 text-green-800';
  }
  if (msg.includes('更新') || msg.includes('UPDATE') || msg.includes('修改')) {
    return 'bg-blue-50 border-blue-200 text-blue-800';
  }
  if (msg.includes('刪除') || msg.includes('DELETE')) {
    return 'bg-red-50 border-red-200 text-red-800';
  }
  return 'bg-gray-50 border-gray-200 text-gray-800';
};

// 圖示邏輯
const getLogIcon = (message: string) => {
  const msg = message.toUpperCase();
  if (msg.includes('創建') || msg.includes('CREATE')) return '✓';
  if (msg.includes('更新') || msg.includes('UPDATE')) return '✎';
  if (msg.includes('刪除') || msg.includes('DELETE')) return '✕';
  return '•';
};
</script>

<template>
  <div
    class="flex flex-col h-screen mx-auto max-w-4xl px-8 py-8 overflow-hidden bg-[#fcfcfc]"
  >
    <div class="mb-8 flex items-center justify-between shrink-0">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button
            class="hover:underline"
            @click="navigateTo('/user/profile/overview')"
          >
            會員中心
          </button>
          <span>/</span>
          <span class="text-gray-900 font-medium">操作日誌</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">我的活動日誌</h1>
        <p class="mt-2 text-sm text-gray-600">
          以下是您在系統中的個人操作紀錄 (僅限本人查看)
        </p>
      </div>
      <button
        :disabled="pending"
        class="px-4 py-2 bg-white border rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        @click="() => refresh()"
      >
        {{ pending ? '更新中...' : '🔄 重新整理' }}
      </button>
    </div>

    <div
      v-if="pending"
      class="flex-1 flex items-center justify-center"
    >
      <UiSpinner class="h-10 w-10 text-blue-600" />
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 border border-red-100 p-6 rounded-xl text-red-800"
    >
      載入日誌時發生錯誤：{{ error.message || '請重新整理頁面' }}
    </div>

    <div
      v-else-if="logs.length > 0"
      class="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar"
    >
      <div
        v-for="log in logs"
        :key="log.id"
        :class="[
          'rounded-xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md',
          getLogTypeClass(log.message),
        ]"
      >
        <div class="flex items-center gap-5">
          <div
            class="flex h-12 w-12 aspect-square shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold shadow-md border border-gray-50"
          >
            {{ getLogIcon(log.message) }}
          </div>

          <div class="flex-1">
            <p class="text-base font-bold leading-snug mb-1">
              {{ log.message }}
            </p>

            <div class="flex items-center gap-4 text-xs opacity-70 font-medium">
              <span class="flex items-center gap-1">
                👤 {{ log.user.name || '本人' }}
              </span>
              <span class="flex items-center gap-1">
                🕒 {{ formatDate(log.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="h-4 shrink-0"></div>
    </div>

    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white border border-dashed rounded-2xl"
    >
      <span class="text-6xl mb-4 text-gray-200">📋</span>
      <p class="text-lg font-medium">目前尚無任何操作紀錄</p>
    </div>

    <div
      v-if="logs.length > 0"
      class="mt-6 border-t pt-4 flex justify-between items-center text-xs text-gray-500 shrink-0"
    >
      <span class="bg-gray-100 px-3 py-1 rounded-full font-bold">
        總計 {{ logs.length }} 筆
      </span>
      <span>同步時間：{{ new Date().toLocaleString() }}</span>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
