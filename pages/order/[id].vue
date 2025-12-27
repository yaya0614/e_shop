<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { FetchError } from 'ofetch';
import { toast } from 'vue-sonner';
import type { OrderDetailResponse } from '~/types/order';

const route = useRoute();
const orderId = route.params.id as string;

const orderDetail = ref<OrderDetailResponse | null>(null);
const isLoading = ref(true);

const fetchOrderDetail = async () => {
  if (!orderId) {
    toast.error('載入失敗', {
      description: '無效的訂單編號。',
    });
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const data = await $fetch<OrderDetailResponse>(`/api/order/${orderId}`, {
      method: 'GET',
      credentials: 'include',
    });

    orderDetail.value = data;
  } catch (err) {
    if (err instanceof FetchError) {
      if (err.statusCode === 401) {
        toast.error('未授權', {
          description: '請檢查登入狀態。',
        });
      } else if (err.statusCode === 404) {
        toast.error('找不到訂單', {
          description: `訂單編號 ${orderId} 不存在。`,
        });
      } else {
        toast.error('載入失敗', {
          description: `無法取得訂單詳情: ${err.message}`,
        });
      }
    } else {
      toast.error('發生未知錯誤', {
        description: '請檢查網路連線或稍後再試。',
      });
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchOrderDetail();
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 px-10">
      <NuxtLink
        to="/order"
        class="text-blue-500 hover:underline mb-4 mt-4 block"
      >
        ← 返回訂單列表
      </NuxtLink>

      <h1 class="text-3xl font-bold mb-6">訂單詳情</h1>

      <!-- 載入中 -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center h-64 text-gray-500"
      >
        <p>載入中...</p>
      </div>

      <!-- 訂單詳情 -->
      <div
        v-else-if="orderDetail"
        class="bg-white shadow-xl rounded-lg p-8 mb-6"
      >
        <div class="mb-6 border-b pb-4 space-y-2">
          <p class="text-gray-700">
            <span class="font-bold">訂單 ID:</span> {{ orderDetail.id }}
          </p>

          <p class="text-gray-700">
            <span class="font-bold">供應商:</span> {{ orderDetail.vendor.name }}
          </p>

          <p class="text-gray-700">
            <span class="font-bold">下單時間:</span>
            {{ formatDate(orderDetail.createdAt) }}
          </p>

          <p class="text-gray-700">
            <span class="font-bold">最後更新:</span>
            {{ formatDate(orderDetail.updatedAt) }}
          </p>

          <p
            v-if="orderDetail.couponId"
            class="text-gray-700"
          >
            <span class="font-bold">使用優惠券 ID:</span>
            {{ orderDetail.couponId }}
          </p>

          <p class="text-gray-700">
            <span class="font-bold">狀態:</span>
            <span class="font-bold text-green-600">{{
              orderDetail.status
            }}</span>
          </p>

          <p class="text-gray-700 pt-2">
            <span class="font-bold">總金額:</span>
            <span class="text-xl font-bold text-red-600"
              >${{ orderDetail.price.toLocaleString() }}</span
            >
          </p>
        </div>

        <h2 class="text-2xl font-semibold mb-4">訂購商品列表</h2>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  商品名稱
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  單價
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  數量
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  小計
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="item in orderDetail.products"
                :key="item.product.id"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ item.product.name }}
                  </div>
                  <div class="text-xs text-gray-500 truncate w-48">
                    {{ item.product.description }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${{ item.product.price.toLocaleString() }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.quantity }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                >
                  ${{ (item.product.price * item.quantity).toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
