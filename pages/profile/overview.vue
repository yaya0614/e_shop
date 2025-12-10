<template>
  <div
    class="max-w-md mx-auto mt-12 p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
  >
    <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
      測試頁面：個人檔案概覽 (Test)
    </h2>

    <div class="p-4 mb-4 bg-yellow-100 border border-yellow-300 rounded-lg">
      <p class="text-sm font-medium text-yellow-800">
        此區塊用於測試 p-4 類別是否能正確解析。
      </p>
    </div>

    <div class="space-y-4 text-gray-700">
      <div>
        <strong class="block text-sm font-medium mb-1">使用者名稱:</strong>
        <span class="block p-2 border border-gray-300 rounded-lg bg-gray-50">
          {{ userProfile.name }}
        </span>
      </div>

      <div>
        <strong class="block text-sm font-medium mb-1">電子郵件:</strong>
        <span class="block p-2 border border-gray-300 rounded-lg bg-gray-50">
          {{ userProfile.email }}
        </span>
      </div>
    </div>

    <NuxtLink
      to="/profile/edit"
      class="mt-6 block text-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
    >
      前往編輯頁面 →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// 確保您的 lib/auth.ts 檔案已存在且路徑正確
import { useAuth } from '~/lib/auth';

const { userProfile } = useAuth();

// 移除所有複雜的 enterVendorDashboard, v-if 相關邏輯
</script>
