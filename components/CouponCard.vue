<template>
  <Card
    :class="[
      coupon.type === 'DISCOUNT' ? 'border-indigo-300' : 'border-green-300',
      'border-l-8', // 用 border-l 模擬折扣券的邊界裝飾
      'flex justify-between items-center p-5 shadow-sm transition duration-150 hover:shadow-md',
    ]"
  >
    <div class="flex-1">
      <div
        class="text-2xl font-bold"
        :class="
          coupon.type === 'DISCOUNT' ? 'text-indigo-800' : 'text-green-800'
        "
      >
        <span v-if="coupon.type === 'DISCOUNT'">
          NT$ {{ coupon.discountPrice }} 元折扣
        </span>
        <span v-else-if="coupon.type === 'COUPON'">
          {{ coupon.couponPercentage }}% 折扣
          <span v-if="coupon.maxPrice">
            (最高折 NT$ {{ coupon.maxPrice }})</span
          >
        </span>
      </div>
      <p class="text-sm text-gray-600 mt-1">
        最低消費門檻：NT$ {{ coupon.minPrice || 0 }}
      </p>
    </div>

    <div class="text-right flex flex-col items-end">
      <div
        class="text-lg font-semibold text-gray-700 bg-gray-50 px-3 py-1 border border-dashed rounded-md"
      >
        {{ coupon.code }}
      </div>
      <p class="text-xs text-gray-500 mt-1 mb-3">優惠碼</p>

      <Button
        size="sm"
        variant="secondary"
        @click="handleCopy(coupon.code)"
      >
        複製代碼
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { UserCoupon } from '~/types/coupon';
// 引入您元件庫中的基礎元件
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

interface Props {
  coupon: UserCoupon;
}

defineProps<Props>();

const handleCopy = (code: string) => {
  // 實際複製邏輯，這裡僅為模擬
  navigator.clipboard.writeText(code);
  alert(`優惠碼 ${code} 已複製！`);
};
</script>
