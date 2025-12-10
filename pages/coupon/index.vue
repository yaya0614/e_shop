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
        <div v-if="loading" class="text-center py-10 text-gray-500">
          <Spinner class="w-6 h-6 mr-2" /> 載入中...
        </div>
        <Alert v-else-if="error" type="destructive" title="載入失敗">
          <p>無法載入您的優惠券：{{ error }}</p>
        </Alert>
        <Alert v-else-if="coupons.length === 0" type="info" title="無可用優惠券">
          <p>目前沒有可用的優惠券。試著輸入優惠碼領取新優惠吧！</p>
        </Alert>
        <div v-else class="space-y-4">
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

  // 假設 CouponCard 和 CouponCodeInput 放在頂層 components
  // 實際請根據您的結構調整路徑，例如: components/CouponCodeInput.vue

  const coupons = ref<UserCoupon[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchCoupons = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch<UserCoupon[]>('/api/coupon');
      coupons.value = response;
    } catch (e: any) {
      error.value = e.message || '無法連線到伺服器。';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchCoupons();
  });
  </script>