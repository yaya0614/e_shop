<script setup lang="ts">
import { computed } from 'vue';

definePageMeta({
  layout: 'vendor-bar',
});

const route = useRoute();
const { vendorId, productId } = route.params as {
  vendorId: string;
  productId: string;
};

interface LogItem {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

// 獲取該產品專屬日誌資料
const {
  data: logsData,
  pending,
  error,
  refresh,
} = await useFetch<{ logs: LogItem[] }>(
  `/api/vendor/${vendorId}/product/${productId}/log`,
  {
    method: 'GET',
    credentials: 'include',
  },
);

// 額外獲取商品資訊以顯示在標題
const { data: productData } = await useFetch<{ name: string }>(
  `/api/product/${productId}`,
);

const logs = computed(() => logsData.value?.logs || []);

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

// 顏色與 Icon 邏輯
const getLogTypeClass = (message: string) => {
  const msg = message.toUpperCase();
  if (msg.includes('創建') || msg.includes('新增') || msg.includes('CREATE')) {
    return 'bg-green-50 border-green-200 text-green-800';
  }
  if (
    msg.includes('更新') ||
    msg.includes('修改') ||
    msg.includes('UPDATE') ||
    msg.includes('ACTIVE')
  ) {
    return 'bg-blue-50 border-blue-200 text-blue-800';
  }
  if (
    msg.includes('刪除') ||
    msg.includes('DELETE') ||
    msg.includes('INACTIVE')
  ) {
    return 'bg-red-50 border-red-200 text-red-800';
  }
  return 'bg-gray-50 border-gray-200 text-gray-800';
};

const getLogIcon = (message: string) => {
  const msg = message.toUpperCase();
  if (msg.includes('創建') || msg.includes('新增') || msg.includes('CREATE'))
    return '✓';
  if (
    msg.includes('更新') ||
    msg.includes('修改') ||
    msg.includes('UPDATE') ||
    msg.includes('ACTIVE')
  )
    return '✎';
  if (
    msg.includes('刪除') ||
    msg.includes('DELETE') ||
    msg.includes('INACTIVE')
  )
    return '✕';
  return '•';
};
</script>

<template>
  <div
    class="h-screen flex flex-col mx-auto px-4 py-8 overflow-hidden w-full bg-[#fcfcfc]"
  >
    <div class="mb-6 flex items-center justify-between shrink-0">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <button
            class="hover:underline"
            @click="navigateTo(`/vendor/${vendorId}/product/${productId}`)"
          >
            商品編輯
          </button>
          <span>/</span>
          <span>操作記錄</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">
          商品異動日誌：<span class="text-blue-600">{{
            productData?.name || '載入中...'
          }}</span>
        </h1>
        <p class="mt-2 text-sm text-gray-600 font-mono">ID: {{ productId }}</p>
      </div>
      <UiButton
        :disabled="pending"
        class="shadow-sm"
        @click="refresh"
      >
        <span v-if="pending">更新中...</span>
        <span v-else>🔄 重新整理</span>
      </UiButton>
    </div>

    <div
      v-if="pending"
      class="flex-1 flex items-center justify-center"
    >
      <UiSpinner class="h-8 w-8" />
    </div>
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 shrink-0"
    >
      無法載入此商品的異動記錄。
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
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold shadow-md border border-gray-50"
          >
            {{ getLogIcon(log.message) }}
          </div>
          <div class="flex-1">
            <p class="text-base font-bold leading-snug">{{ log.message }}</p>
            <div class="mt-2 flex items-center gap-4 text-xs opacity-70">
              <span class="flex items-center gap-1"
                >👤
                <span class="font-semibold text-gray-700">{{
                  log.user.name || '系統使用者'
                }}</span></span
              >
              <span class="flex items-center gap-1"
                >🕒 {{ formatDate(log.createdAt) }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="h-2"></div>
    </div>

    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed"
    >
      <span class="text-6xl mb-4">📋</span>暫無任何異動記錄
    </div>

    <div
      v-if="logs.length > 0"
      class="mt-6 border-t pt-4 flex justify-between items-center text-xs text-gray-500 shrink-0"
    >
      <span class="bg-white border px-3 py-1 rounded-full shadow-sm"
        >共
        <strong class="text-gray-900">{{ logs.length }}</strong>
        筆異動記錄</span
      >
      <span>最後同步：{{ new Date().toLocaleString() }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 確保自定義捲軸樣式 */
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
