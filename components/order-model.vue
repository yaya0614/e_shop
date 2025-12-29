<script setup lang="ts">
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
  updateOrderStatus: (
    orderId: string,
    status: PreviewOrder['status'],
  ) => Promise<void>;
}>();
</script>

<template>
  <div class="bg-white rounded-lg border w-full h-full flex flex-col">
    <div class="grid grid-cols-8 items-center">
      <div class="px-6 py-3 text-left font-medium col-span-3">訂單編號</div>
      <div class="px-6 py-3 text-left font-medium col-span-1">買家名稱</div>
      <div class="px-6 py-3 text-left font-medium col-span-1">商品數</div>
      <div class="px-6 py-3 text-left font-medium col-span-1">價錢</div>
      <div class="px-6 py-3 text-left font-medium col-span-1">訂單狀態</div>
      <div class="px-6 py-3 text-left font-medium col-span-1">訂單詳情</div>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div
        v-for="order in props.orders"
        :key="order.orderId"
        :class="{
          'hover:bg-gray-50 transition grid grid-cols-8 items-center': true,
          'bg-green-100/30': order.status === 'FINISH',
          'bg-red-100/30': order.status === 'CANCELED',
          'bg-yellow-100/30':
            order.status === 'PROCESSING' || order.status === 'TRANSPORT',
        }"
      >
        <div class="px-6 py-4 text-green-600 font-medium col-span-3">
          #{{ order.orderId }}
        </div>

        <div class="px-6 py-4 text-gray-700 col-span-1">
          {{ order.userName }}
        </div>

        <div class="px-6 py-4 text-gray-500 col-span-1">
          {{ order.products.length }}
        </div>

        <div class="px-6 py-4 font-medium text-gray-700 col-span-1">
          ${{ order.price }}
        </div>

        <div class="px-6 py-4 col-span-1">
          <Select
            v-model="order.status"
            @update:model-value="
              props.updateOrderStatus(
                order.orderId,
                $event as PreviewOrder['status'],
              )
            "
          >
            <SelectTrigger>
              <SelectValue placeholder="訂單狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FINISH">已完成</SelectItem>
              <SelectItem value="CANCELED">已取消</SelectItem>
              <SelectItem value="RECEIVED">已接收</SelectItem>
              <SelectItem value="PROCESSING">處理中</SelectItem>
              <SelectItem value="TRANSPORT">運輸中</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="px-6 py-4 col-span-1">
          <button
            class="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition"
            :name="order.userName"
            @click="$router.push(`/vendor/${vendorId}/order/${order.orderId}`)"
          >
            查看細項
          </button>
        </div>
      </div>

      <div v-if="props.orders.length === 0">
        <div
          colspan="6"
          class="px-6 py-10 text-center text-gray-400"
        >
          No orders found
        </div>
      </div>
    </div>
  </div>
</template>
