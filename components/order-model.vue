<script setup lang="ts">
interface Order {
  id: string;
  billingName: string;
  date: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Failed';
}

const orders = ref<Order[]>([
  {
    id: 'SKU87944',
    billingName: 'Destiny Franks',
    date: 'March 4, 2024, 12:08 p.m.',
    total: 100,
    status: 'Paid',
  },
]);

const sortBy = ref('lowest');
const statusFilter = ref('all');
</script>

<template>
  <div class="bg-white rounded-lg border">
    <div class="px-6 py-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">Recent Orders</h2>

      <div class="flex gap-3">
        <select
          v-model="sortBy"
          class="border rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="lowest">Lowest Price</option>
          <option value="highest">Highest Price</option>
        </select>

        <select
          v-model="statusFilter"
          class="border rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="all">Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500">
          <tr>
            <th class="px-6 py-3 text-left font-medium">訂單編號</th>
            <th class="px-6 py-3 text-left font-medium">訂購者</th>
            <th class="px-6 py-3 text-left font-medium">日期</th>
            <th class="px-6 py-3 text-left font-medium">價錢</th>
            <th class="px-6 py-3 text-left font-medium">訂單狀態</th>
            <th class="px-6 py-3 text-left font-medium">訂單詳情</th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="hover:bg-gray-50 transition"
          >
            <td class="px-6 py-4 text-green-600 font-medium">
              #{{ order.id }}
            </td>

            <td class="px-6 py-4 text-gray-700">
              {{ order.billingName }}
            </td>

            <td class="px-6 py-4 text-gray-500">
              {{ order.date }}
            </td>

            <td class="px-6 py-4 font-medium text-gray-700">
              ${{ order.total }}
            </td>

            <td class="px-6 py-4">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-600': order.status === 'Paid',
                  'bg-yellow-100 text-yellow-600': order.status === 'Pending',
                  'bg-red-100 text-red-600': order.status === 'Failed',
                }"
              >
                {{ order.status }}
              </span>
            </td>

            <td class="px-6 py-4">
              <button
                class="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition"
              >
                View details
              </button>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="orders.length === 0">
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
