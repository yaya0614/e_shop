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
  updateOrderStatus?: (
    orderId: string,
    status: PreviewOrder['status'],
  ) => Promise<void>;
}>();

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
          'bg-green-100/30':
            order.status === 'FINISH' && props.updateOrderStatus,
          'bg-red-100/30':
            order.status === 'CANCELED' && props.updateOrderStatus,
          'bg-yellow-100/30':
            (order.status === 'PROCESSING' || order.status === 'TRANSPORT') &&
            props.updateOrderStatus,
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
            v-if="props.updateOrderStatus"
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
          <span
            v-else
            class="px-3 py-1 rounded-full text-xs font-medium"
            :class="{
              'bg-green-100 text-green-800': order.status === 'FINISH',
              'bg-yellow-100 text-yellow-800':
                order.status === 'PROCESSING' || order.status === 'TRANSPORT',
              'bg-red-100 text-red-800': order.status === 'CANCELED',
            }"
          >
            {{ getStatusLabel(order.status) }}
          </span>
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
