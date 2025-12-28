<script setup lang="ts">
import { onMounted } from 'vue';
import { useUser } from '~/lib/useUser';

const { userProfile, isLoading, fetchUserProfile } = useUser();

onMounted(() => {
  fetchUserProfile();
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 items-center justify-center px-4">
      <div
        class="w-full max-w-md p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
      >
        <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
          個人檔案概覽
        </h2>

        <!-- 載入中 -->
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

        <!-- 未登入或訪客 -->
        <div
          v-else-if="userProfile.role === 'GUEST'"
          class="text-center py-10 text-red-500"
        >
          <p>🔴 找不到使用者資料或您尚未登入。</p>
        </div>

        <!-- 使用者資料 -->
        <div
          v-else
          class="space-y-4 text-gray-700"
        >
          <div>
            <strong class="block text-sm font-medium mb-1">使用者名稱:</strong>
            <span
              class="block p-2 border border-gray-300 rounded-lg bg-gray-50"
            >
              {{ userProfile.name || '未設定' }}
            </span>
          </div>

          <div>
            <strong class="block text-sm font-medium mb-1">電子郵件:</strong>
            <span
              class="block p-2 border border-gray-300 rounded-lg bg-gray-50"
            >
              {{ userProfile.email }}
            </span>
          </div>

          <div>
            <strong class="block text-sm font-medium mb-1">聯絡地址:</strong>
            <span
              class="block p-2 border border-gray-300 rounded-lg bg-gray-50"
            >
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

          <div class="pt-4 border-t border-gray-100">
            <strong class="block text-sm font-medium mb-2 text-gray-700"
              >付款方式:</strong
            >
            <div
              class="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 group hover:border-blue-400 transition duration-200"
            >
              <div class="flex items-center space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-gray-400 group-hover:text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span class="text-sm font-medium text-gray-600"
                  >管理已儲存的卡片</span
                >
              </div>

              <NuxtLink
                to="/user/payment"
                class="text-sm text-blue-600 font-bold hover:underline"
              >
                前往管理 →
              </NuxtLink>
            </div>
          </div>

          <NuxtLink
            to="/user/profile/edit"
            class="mt-6 block text-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
          >
            ✏️ 編輯基本資料
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
