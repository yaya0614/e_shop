<template>
  <div class="max-w-4xl mx-auto mt-12 p-4 sm:p-8">
    <h2 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-3">
      👤 個人檔案概覽
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <section
        class="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4"
      >
        <h3
          class="text-xl font-semibold text-gray-700 flex justify-between items-center"
        >
          基本資料
          <NuxtLink
            to="/profile/edit"
            class="text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
          >
            編輯個人資料 →
          </NuxtLink>
        </h3>
        <hr class="border-gray-100" />

        <div class="space-y-3 text-gray-600">
          <div class="flex items-center">
            <strong class="w-24 text-gray-800">姓名:</strong>
            <span>{{ userProfile.name }}</span>
          </div>
          <div class="flex items-center">
            <strong class="w-24 text-gray-800">電子郵件:</strong>
            <span>{{ userProfile.email }}</span>
          </div>
          <div class="flex items-start">
            <strong class="w-24 text-gray-800">地址:</strong>
            <span class="flex-1">{{ userProfile.address || '未設定' }}</span>
          </div>
          <div class="flex items-center pt-2">
            <strong class="w-24 text-gray-800">帳號角色:</strong>
            <span
              :class="
                userProfile.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-500'
              "
              class="px-3 py-1 text-xs font-semibold text-white rounded-full"
            >
              {{ userProfile.role === 'ADMIN' ? '管理員' : '一般使用者' }}
            </span>
          </div>
        </div>
      </section>

      <section
        class="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4"
      >
        <h3 class="text-xl font-semibold text-gray-700">帳號狀態</h3>
        <hr class="border-gray-100" />
        <div class="space-y-3 text-gray-600">
          <div>
            <strong class="block text-sm text-gray-800">建立日期:</strong>
            <span>{{ formatDate(userProfile.createdAt) }}</span>
          </div>
          <div>
            <strong class="block text-sm text-gray-800">上次更新:</strong>
            <span>{{ formatDate(userProfile.updatedAt) }}</span>
          </div>
          <div class="pt-2">
            <strong class="block text-sm text-gray-800">登出帳號:</strong>
            <button
              class="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition duration-200"
              @click="handleLogout"
            >
              登出
            </button>
          </div>
        </div>
      </section>

      <section
        class="md:col-span-3 bg-white border border-gray-200 rounded-xl shadow-md p-6"
      >
        <h3 class="text-xl font-semibold text-gray-700 mb-4">快速導覽與交易</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NuxtLink
            to="/orders"
            class="link-card"
          >
            📜 訂單記錄
          </NuxtLink>
          <NuxtLink
            to="/coupons"
            class="link-card"
          >
            🏷️ 我的優惠券
          </NuxtLink>
          <NuxtLink
            to="/security"
            class="link-card"
          >
            🔒 安全設定
          </NuxtLink>
          <NuxtLink
            to="/cart"
            class="link-card"
          >
            🛒 我的購物車
          </NuxtLink>
        </div>
      </section>

      <section
        v-if="vendorScope"
        class="md:col-span-3 bg-indigo-50 border border-indigo-200 rounded-xl shadow-lg p-6 flex justify-between items-center transition duration-300 hover:shadow-xl"
      >
        <div>
          <h3 class="text-xl font-semibold text-indigo-700">💼 供應商儀表板</h3>
          <p class="text-indigo-600 mt-1">
            您目前是 <strong>{{ vendorScope.name }}</strong> 的
            <span class="font-bold">{{
              vendorScope.role === 'MANAGER' ? '經理' : '員工'
            }}</span
            >。
          </p>
        </div>

        <button
          :disabled="isEnteringVendor"
          class="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          @click="handleEnterVendor"
        >
          {{ isEnteringVendor ? '驗證中...' : '進入供應商後台' }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

// 假設 useAuth 內包含了您之前定義的 userProfile, vendorScope, enterVendorDashboard 函式
const { userProfile, vendorScope, enterVendorDashboard } = useAuth();
const router = useRouter();

const isEnteringVendor = ref(false);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const handleEnterVendor = async () => {
  if (!vendorScope.value) return;

  isEnteringVendor.value = true;

  try {
    // 步驟：呼叫 API 進行 Token Exchange
    const vendorId = vendorScope.value.id;
    await enterVendorDashboard(vendorId); // 模擬 API 呼叫

    // 成功後，Token 已在 Cookie 中更新，導航到儀表板
    alert('Token 交換成功，即將導航到供應商儀表板！(模擬)');
    // router.push(`/vendor/${vendorId}`); // 實際導航
  } catch (error) {
    // 處理 403 Forbidden 或其他錯誤
    alert('進入供應商後台失敗，您可能沒有權限。');
    // 實際處理：router.push('/unauthorized');
  } finally {
    isEnteringVendor.value = false;
  }
};

const handleLogout = () => {
  // 實際應呼叫登出 API 並清除本地狀態/Cookie
  alert('執行登出操作...(模擬清除 Token)');
  // router.push('/auth/login');
};
</script>

<style scoped>
/* 將通用的連結卡片樣式抽出 */
.link-card {
  @apply flex items-center justify-center p-4 bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 transition duration-150 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 shadow-sm;
}
</style>
