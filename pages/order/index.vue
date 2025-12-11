<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { GetOrderHistoryResponse, OrderHistoryItem } from '~/types/order';
import { FetchError } from 'ofetch';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router'; // 引入 useRouter

// 建立 router 實例，用於導航，與 login.vue 一致
const router = useRouter();

// 假設 API 的基礎路徑是 /api/order
const orders = ref<OrderHistoryItem[]>([]);
const isLoading = ref(true);

const fetchOrderHistory = async () => {
  isLoading.value = true;
  try {
    const data = await $fetch<GetOrderHistoryResponse>('/api/order', {
      method: 'GET',
      credentials: 'include',
    });

    orders.value = data.orders || [];
  } catch (err) {
    if (err instanceof FetchError) {
      if (err.statusCode === 401) {
        toast.error('請重新登入', {
          description: 'Token 失效或未授權，無法查看訂單歷史。',
        });
      } else {
        toast.error('載入失敗', {
          description: `無法取得訂單歷史: ${err.message}`,
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
  fetchOrderHistory();
});

const goToOrderDetail = (orderId: string) => {
  router.push(`/order/${orderId}`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">我的訂單歷史記錄</h1>

    <div
      v-if="isLoading"
      class="text-center"
    >
      <p>載入中...</p>
    </div>

    <div
      v-else-if="orders.length === 0"
      class="text-center py-10 border rounded"
    >
      <p>您目前沒有任何訂單記錄。</p>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white shadow-md rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
        @click="goToOrderDetail(order.id)"
      >
        <div class="flex justify-between items-start border-b pb-3 mb-3">
          <h2 class="text-xl font-semibold">
            訂單編號: {{ order.id.substring(0, 8) }}...
          </h2>
          <span
            :class="[
              'font-medium px-3 py-1 rounded-full text-sm',
              {
                'bg-green-100 text-green-800': order.status === 'RECEIVED',
                'bg-yellow-100 text-yellow-800': order.status === 'PROCESSING',
              },
            ]"
          >
            {{ order.status }}
          </span>
        </div>

        <p class="text-gray-600 mb-2">
          訂單日期: {{ formatDate(order.createdAt) }}
        </p>
        <p class="text-lg font-bold text-indigo-600 mb-4">
          總金額: ${{ order.price.toLocaleString() }}
        </p>

        <div class="mt-2 text-sm text-gray-500">
          <p class="font-medium mb-1">包含商品:</p>
          <ul class="list-disc list-inside">
            <li
              v-for="(item, index) in order.products.slice(0, 2)"
              :key="index"
            >
              {{ item.product.name }} (x{{ item.quantity }}) -
              {{ item.product.vendor.name }}
            </li>
            <li v-if="order.products.length > 2">
              ... 還有 {{ order.products.length - 2 }} 件商品
            </li>
          </ul>
        </div>

        <div class="mt-4 text-right text-sm text-blue-500 hover:underline">
          查看詳情 →
        </div>
      </div>
    </div>
  </div>
</template>
