<template>
  <div class="max-w-4xl mx-auto mt-12 p-4 sm:p-8">
    <h2 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-3">
      🏷️ 我的優惠券
    </h2>

    <section class="mb-8">
      <Card class="p-6">
        <h3 class="text-xl font-semibold text-gray-700 mb-4">領取優惠碼</h3>
        <CouponCodeInput @coupon-claimed="fetchCoupons" />
      </Card>
    </section>

    <section>
      <div
        v-if="loading"
        class="text-center py-10 text-gray-500"
      >
        <Spinner class="w-6 h-6 mr-2" /> 載入中...
      </div>

      <Alert
        v-else-if="coupons.length === 0 && !loading"
        type="info"
        title="無可用優惠券"
      >
        <p>目前沒有可用的優惠券。試著輸入優惠碼領取新優惠吧！</p>
      </Alert>
      <div
        v-else
        class="space-y-4"
      >
        <CouponCard
          v-for="coupon in coupons"
          :key="coupon.code"
          :coupon="coupon"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { UserCoupon } from '~/types/coupon';
// 引入您元件庫中的基礎元件
import { Card } from '~/components/ui/card';
import { Alert } from '~/components/ui/alert';
// 假設您有 Spinner 元件
import { Spinner } from '~/components/ui/spinner';
import { toast } from 'vue-sonner';

// 假設 CouponCard 和 CouponCodeInput 放在頂層 components
// 實際請根據您的結構調整路徑，例如: components/CouponCodeInput.vue

const coupons = ref<UserCoupon[]>([]);
const loading = ref(true);
//const error = ref<string | null>(null);
const mapFetchErrorToUserMessage = (e: {
  statusCode?: number;
  message?: string;
}): { title: string; description: string } => {
  let title = '載入失敗';
  let description = '無法連線到伺服器，請檢查您的網路。';

  // 檢查是否為 ofetch 錯誤或 HTTP 錯誤
  if (e.statusCode) {
    title = `錯誤碼 ${e.statusCode}`;
    switch (e.statusCode) {
      case 401:
        description = '您尚未登入或登入已過期，請重新登入。';
        break;
      case 403:
        description = '您沒有權限查看此頁面。';
        break;
      case 404:
        description = '伺服器找不到優惠券資料。';
        break;
      case 500:
        description = '伺服器發生未預期的錯誤，請稍後再試。';
        break;
      default:
        description = e.message || '伺服器返回一個未知的錯誤。';
        break;
    }
  }
  return { title, description };
};

const fetchCoupons = async () => {
  loading.value = true;
  try {
    const response = await $fetch<UserCoupon[]>('/api/coupon');
    coupons.value = response;
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number };
    const { title, description } = mapFetchErrorToUserMessage(err);

    // 使用 Toast 彈出錯誤訊息
    toast.error(title, {
      description: description,
      duration: 5000, // 顯示 5 秒
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCoupons();
});
</script>
