<script setup lang="ts">
import { computed, ref } from 'vue';

export interface PreviewOrder {
  orderId: string;
  price: number;
  status: 'RECEIVED' | 'PROCESSING' | 'TRANSPORT' | 'FINISH' | 'CANCELED';
  userName: string;
  products: {
    productId: string;
    quantity: number;
  }[];
}

const props = defineProps<{
  vendorId: string;
  orders: PreviewOrder[];
}>();

const sortBy = ref<'價格低' | '價格高'>('價格低');
const statusFilter = ref<
  'all' | 'RECEIVED' | 'PROCESSING' | 'TRANSPORT' | 'FINISH' | 'CANCELED'
>('all');

const displayOrders = computed(() => {
  let result = [...(props.orders ?? [])];

  if (statusFilter.value !== 'all') {
    result = result.filter((order) => order.status === statusFilter.value);
  }

  if (sortBy.value === '價格低') {
    result.sort((a, b) => a.price - b.price);
  } else {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
});

function getStatusLabel(status: PreviewOrder['status']) {
  switch (status) {
    case 'FINISH':
      return '已完成';
    case 'CANCELED':
      return '已取消';
    case 'RECEIVED':
      return '已接收';
    case 'PROCESSING':
      return '處理中';
    case 'TRANSPORT':
      return '運輸中';
    default:
      return status;
  }
}
</script>

<template>
  <div class="bg-white rounded-lg border w-full h-full flex flex-col">
    <div class="px-6 py-4 flex gap-3 justify-end shrink-0">
      <select
        v-model="sortBy"
        class="border rounded-md px-3 py-2 text-sm text-gray-600"
      >
        <option value="價格低">價格低</option>
        <option value="價格高">價格高</option>
      </select>

      <select
        v-model="statusFilter"
        class="border rounded-md px-3 py-2 text-sm text-gray-600"
      >
        <option value="all">全部</option>
        <option value="FINISH">已完成</option>
        <option value="PENDING">待處理</option>
        <option value="CANCEL">已取消</option>
        <option value="RECEIVED">已接收</option>
        <option value="PROCESSING">處理中</option>
        <option value="TRANSPORT">運輸中</option>
      </select>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10">
          <tr>
            <th class="px-6 py-3 text-left font-medium">訂單編號</th>
            <th class="px-6 py-3 text-left font-medium">買家名稱</th>
            <th class="px-6 py-3 text-left font-medium">商品數</th>
            <th class="px-6 py-3 text-left font-medium">價錢</th>
            <th class="px-6 py-3 text-left font-medium">訂單狀態</th>
            <th class="px-6 py-3 text-left font-medium">訂單詳情</th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="order in displayOrders"
            :key="order.orderId"
            class="hover:bg-gray-50 transition"
          >
            <td class="px-6 py-4 text-green-600 font-medium">
              #{{ order.orderId }}
            </td>

            <td class="px-6 py-4 text-gray-700">
              {{ order.userName }}
            </td>

            <td class="px-6 py-4 text-gray-500">
              {{ order.products.length }}
            </td>

            <td class="px-6 py-4 font-medium text-gray-700">
              ${{ order.price }}
            </td>

            <td class="px-6 py-4">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': order.status === 'FINISH',
                  'bg-yellow-100 text-yellow-800':
                    order.status === 'PROCESSING' ||
                    order.status === 'TRANSPORT',
                  'bg-red-100 text-red-800': order.status === 'CANCELED',
                }"
              >
                {{ getStatusLabel(order.status) }}
              </span>
            </td>

            <td class="px-6 py-4">
              <button
                class="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition"
                :name="order.userName"
                @click="
                  $router.push(`/vendor/${vendorId}/order/${order.orderId}`)
                "
              >
                查看細項
              </button>
            </td>
          </tr>

          <tr v-if="displayOrders.length === 0">
            <td
              colspan="6"
              class="px-6 py-10 text-center text-gray-400"
            >
              No orders found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
