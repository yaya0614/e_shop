<script setup lang="ts">
definePageMeta({
  layout: 'admin',
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

const {
  data: logsData,
  pending,
  error,
  refresh,
} = await useFetch<{ logs: LogItem[] }>('/api/admin/log', {
  method: 'GET',
  credentials: 'include',
});

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

const getLogTypeClass = (message: string) => {
  if (
    message.includes('創建') ||
    message.includes('新增') ||
    message.includes('Create')
  ) {
    return 'bg-green-50 border-green-200 text-green-800';
  }
  if (
    message.includes('更新') ||
    message.includes('修改') ||
    message.includes('Update')
  ) {
    return 'bg-blue-50 border-blue-200 text-blue-800';
  }
  if (message.includes('刪除') || message.includes('Delete')) {
    return 'bg-red-50 border-red-200 text-red-800';
  }
  if (
    message.includes('審核') ||
    message.includes('核准') ||
    message.includes('Approve')
  ) {
    return 'bg-purple-50 border-purple-200 text-purple-800';
  }
  return 'bg-gray-50 border-gray-200 text-gray-800';
};

const getLogIcon = (message: string) => {
  if (
    message.includes('創建') ||
    message.includes('新增') ||
    message.includes('Create')
  ) {
    return '✓';
  }
  if (
    message.includes('更新') ||
    message.includes('修改') ||
    message.includes('Update')
  ) {
    return '✎';
  }
  if (message.includes('刪除') || message.includes('Delete')) {
    return '✕';
  }
  if (
    message.includes('審核') ||
    message.includes('核准') ||
    message.includes('Approve')
  ) {
    return '⚑';
  }
  return '•';
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">管理員操作記錄</h1>
        <p class="mt-2 text-sm text-gray-600">查看所有管理員的操作歷史記錄</p>
      </div>
      <UiButton
        :disabled="pending"
        class="flex items-center gap-2"
        @click="refresh"
      >
        <span v-if="pending">重新整理中...</span>
        <span v-else>🔄 重新整理</span>
      </UiButton>
    </div>

    <div
      v-if="pending"
      class="flex items-center justify-center py-12"
    >
      <UiSpinner class="h-8 w-8" />
      <span class="ml-3 text-gray-600">載入中...</span>
    </div>

    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-6"
    >
      <div class="flex items-center">
        <span class="text-2xl">⚠️</span>
        <div class="ml-3">
          <h3 class="text-lg font-semibold text-red-800">載入失敗</h3>
          <p class="mt-1 text-sm text-red-600">
            {{ error.message || '無法載入操作記錄' }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else-if="logs.length === 0"
      class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center"
    >
      <span class="text-6xl">📋</span>
      <h3 class="mt-4 text-lg font-semibold text-gray-900">暫無操作記錄</h3>
      <p class="mt-2 text-sm text-gray-600">目前還沒有任何管理員操作記錄</p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="log in logs"
        :key="log.id"
        :class="[
          'rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md',
          getLogTypeClass(log.message),
        ]"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold shadow"
          >
            {{ getLogIcon(log.message) }}
          </div>
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold">{{ log.message }}</p>
                <div class="mt-2 flex items-center gap-3 text-xs opacity-75">
                  <span class="flex items-center gap-1">
                    <span>👤</span>
                    <span>{{ log.user.name || '未知使用者' }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span>🕒</span>
                    <span>{{ formatDate(log.createdAt) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="logs.length > 0"
      class="mt-6 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span
          >共
          <strong class="font-semibold text-gray-900">{{ logs.length }}</strong>
          筆記錄</span
        >
        <span class="text-xs text-gray-500"
          >最後更新：{{ new Date().toLocaleString('zh-TW') }}</span
        >
      </div>
    </div>
  </div>
</template>
