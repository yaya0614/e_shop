<script setup lang="ts">
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'vendor-bar',
});

// --- 介面定義 ---
interface LogEntry {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface LogResponse {
  logs: LogEntry[];
}

interface ApiError {
  statusCode?: number;
  message?: string;
  data?: { message?: string };
}

// --- 路由參數 ---
const {
  params: { vendorId },
} = useRoute('vendor-vendorId');

// --- 錯誤處理邏輯 (參考 index.vue 模式) ---
const mapLogErrorToUserMessage = (
  e: ApiError,
): { title: string; description: string } => {
  let title = '獲取日誌失敗';
  let description = '無法連線到伺服器，請檢查您的網路。';

  if (e.statusCode) {
    title = `錯誤碼 ${e.statusCode}`;
    switch (e.statusCode) {
      case 401:
        description = '登入已過期，請重新登入。';
        break;
      case 403:
        description = '您無權查看此商家的操作日誌。';
        break;
      case 404:
        description = '找不到商家日誌資料。';
        break;
      case 500:
        description = '伺服器內部錯誤，請聯絡系統管理員。';
        break;
      default:
        description = e.data?.message || e.message || '發生未知錯誤。';
        break;
    }
  }
  return { title, description };
};

// --- 資料獲取 ---
const { data, pending, error, refresh } = await useFetch<LogResponse>(
  `/api/vendor/${vendorId}/log`,
  {
    method: 'GET',
    credentials: 'include',
    lazy: true,
  },
);

// 處理錯誤通知
watch(error, (newErr) => {
  if (newErr) {
    const err = newErr as unknown as ApiError;
    const { title, description } = mapLogErrorToUserMessage(err);
    toast.error(title, { description });
  }
});

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
</script>

<template>
  <div
    class="flex flex-col h-screen px-8 pt-8 pb-32 overflow-y-auto w-full bg-gray-50"
  >
    <div class="max-w-6xl w-full mx-auto">
      <div class="flex justify-between items-center mb-8 shrink-0">
        <h1 class="font-semibold text-2xl text-gray-800">
          操作日誌 (Audit Logs)
        </h1>
        <button
          :disabled="pending"
          class="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded-md hover:bg-gray-50 transition shadow-sm text-sm disabled:opacity-50"
          @click="() => refresh()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            :class="{ 'animate-spin': pending }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          重新整理
        </button>
      </div>

      <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-1/4">
                發生時間
              </th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-1/4">
                操作人員
              </th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-1/2">
                異動描述
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-if="pending && !data"
              class="animate-pulse"
            >
              <td
                colspan="3"
                class="px-6 py-10 text-center text-gray-400"
              >
                正在同步日誌資料...
              </td>
            </tr>
            <tr v-else-if="!data?.logs || data.logs.length === 0">
              <td
                colspan="3"
                class="px-6 py-10 text-center text-gray-400"
              >
                此商家目前尚無操作紀錄
              </td>
            </tr>
            <tr
              v-for="log in data?.logs"
              :key="log.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-gray-500 font-mono">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0"
                  >
                    {{ log.user.name?.charAt(0) || 'U' }}
                  </div>
                  <span
                    class="text-sm font-medium text-gray-700 truncate max-w-[150px]"
                  >
                    {{ log.user.name || '未知使用者' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-600 leading-relaxed">
                  {{ log.message }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="h-10"></div>
    </div>
  </div>
</template>
