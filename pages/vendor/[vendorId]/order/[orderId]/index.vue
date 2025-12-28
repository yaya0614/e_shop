<script setup lang="ts">
definePageMeta({
  layout: 'vendor-bar',
});

const router = useRouter();
const route = useRoute('vendor-vendorId-order-orderId');
const orderId = route.params.orderId;

export interface OrderDetail {
  id: string;
  price: number;
  status: string;

  userId: string;
  userName: string;

  couponId: string | null;

  createdAt: string;
  updatedAt: string;

  vendor: {
    id: string;
    name: string;
  };

  products: {
    quantity: number;
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      coverId: string;
    };
  }[];
}

const goBack = () => {
  router.back();
};
const { data: order, pending } = await useFetch<OrderDetail>(
  `/api/order/${orderId}`,
  {
    credentials: 'include',
  },
);
</script>

<template>
  <div class="p-8 space-y-6 flex flex-col flex-1">
    <h1 class="text-2xl font-semibold">訂單詳情</h1>
    <button
      class="text-blue-500 hover:underline mb-4 mt-2 flex justify-start"
      @click="goBack"
    >
      ← 返回
    </button>
    <div v-if="pending">Loading...</div>

    <div
      v-else-if="order"
      class="space-y-6"
    >
      <div class="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <span class="text-gray-500">訂單編號：</span>
          <span class="font-mono">{{ order.id }}</span>
        </div>
        <div>
          <span class="text-gray-500">商家：</span>
          <span>{{ order.vendor.name }}</span>
        </div>
        <div>
          <span class="text-gray-500">下單時間：</span>
          <span>{{ new Date(order.createdAt).toLocaleString() }}</span>
        </div>
        <div>
          <span class="text-gray-500">買家名稱：</span>
          <span>{{ order.userName }}</span>
        </div>

        <!-- Product List -->
        <div class="bg-white rounded-xl border p-6 mt-10">
          <h2 class="text-lg font-semibold mb-4">商品明細</h2>

          <table class="w-full text-sm">
            <thead class="border-b text-gray-500">
              <tr>
                <th class="text-left py-2">商品名稱</th>
                <th class="text-left py-2">說明</th>
                <th class="text-right py-2">單價</th>
                <th class="text-right py-2">數量</th>
                <th class="text-right py-2">小計</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in order.products"
                :key="item.product.id"
                class="border-b last:border-0"
              >
                <td class="py-3 font-medium">
                  {{ item.product.name }}
                </td>
                <td class="py-3 text-gray-500">
                  {{ item.product.description }}
                </td>
                <td class="py-3 text-right">${{ item.product.price }}</td>
                <td class="py-3 text-right">
                  {{ item.quantity }}
                </td>
                <td class="py-3 text-right font-medium">
                  ${{ item.product.price * item.quantity }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <div class="underline px-6 py-4 text-lg font-semibold">
            總金額：${{ order.price }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
