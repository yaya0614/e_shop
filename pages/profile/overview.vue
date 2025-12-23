<template>
  <div
    class="max-w-md mx-auto mt-12 p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
  >
    <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
      個人檔案概覽
    </h2>

    <div
      v-if="isLoading"
      class="text-center py-10 text-gray-500"
    >
      <svg
        class="animate-spin h-5 w-5 text-blue-500 mx-auto mb-2"
        viewBox="0 0 24 24"
      ></svg>
      <p>資料載入中...</p>
    </div>

    <div
      v-else-if="userProfile.role === 'GUEST'"
      class="text-center py-10 text-red-500"
    >
      <p>🔴 找不到使用者資料或您尚未登入。</p>
    </div>

    <div
      v-else
      class="space-y-4 text-gray-700"
    >
      <div>
        <strong class="block text-sm font-medium mb-1">使用者名稱:</strong>
        <span class="block p-2 border border-gray-300 rounded-lg bg-gray-50">
          {{ userProfile.name || '未設定' }}
        </span>
      </div>

      <div>
        <strong class="block text-sm font-medium mb-1">電子郵件:</strong>
        <span class="block p-2 border border-gray-300 rounded-lg bg-gray-50">
          {{ userProfile.email }}
        </span>
      </div>

      <div>
        <strong class="block text-sm font-medium mb-1">聯絡地址:</strong>
        <span class="block p-2 border border-gray-300 rounded-lg bg-gray-50">
          {{ userProfile.address || '未設定' }}
        </span>
      </div>

      <div>
        <strong class="block text-sm font-medium mb-1">權限等級:</strong>
        <span
          class="block p-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
        >
          {{ userProfile.role.toLowerCase() }}
        </span>
      </div>

      <NuxtLink
        to="/profile/edit"
        class="mt-6 block text-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
      >
        前往編輯頁面 →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 確保路徑正確：使用新的 useUser Composable
import { useUser } from '~/lib/useUser';

const { userProfile, isLoading, fetchUserProfile } = useUser();

// 確保每次進入頁面時都嘗試獲取最新的使用者資料
onMounted(() => {
  fetchUserProfile();
});
</script>
