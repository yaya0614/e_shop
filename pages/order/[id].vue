<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { OrderDetailResponse, OrderHistoryItem } from '~/types/order';
import { FetchError } from 'ofetch';
import { toast } from 'vue-sonner'; // 引入 toast

const route = useRoute();
const orderId = route.params.id as string;

const orderDetail = ref<
  (OrderDetailResponse & Partial<OrderHistoryItem>) | null
>(null);
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
    // 使用 toast.error 顯示錯誤訊息
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
</script>

<template>
  <div class="container mx-auto p-4">
    <NuxtLink
      to="/order"
      class="text-blue-500 hover:underline mb-4 block"
      >← 返回訂單列表</NuxtLink
    >

    <h1 class="text-3xl font-bold mb-6">訂單詳情</h1>

    <div
      v-if="isLoading"
      class="text-center"
    >
      <p>載入中...</p>
    </div>

    <div
      v-else-if="orderDetail"
      class="bg-white shadow-xl rounded-lg p-8"
    >
      <div class="mb-6 border-b pb-4">
        <p class="text-gray-700">**訂單 ID:** {{ orderDetail.id }}</p>
        <p class="text-gray-700">
          **狀態:**
          <span class="font-bold text-green-600">{{
            orderDetail.status || 'N/A'
          }}</span>
        </p>
        <p class="text-gray-700">
          **總金額:**
          <span class="text-xl font-bold text-red-600"
            >${{ orderDetail.price || 'N/A' }}</span
          >
        </p>
      </div>

      <h2 class="text-2xl font-semibold mb-4">訂購商品列表</h2>

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
              ${{ item.product.price }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ item.quantity }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              ${{ item.product.price * item.quantity }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
