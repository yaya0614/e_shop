<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import orderModel from '~/components/order-model.vue';
import { FetchError } from 'ofetch';

definePageMeta({
  layout: 'vendor-bar',
});

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
interface VendorOrderResponse {
  orders: PreviewOrder[];
}

const {
  params: { vendorId },
} = useRoute('vendor-vendorId');

const previewOrders = ref<PreviewOrder[]>([]);
const pending = ref(false);
const error = ref<string | null>(null);

const sortBy = ref<'價格低' | '價格高'>('價格低');
const statusFilter = ref<
  'ALL' | 'RECEIVED' | 'PROCESSING' | 'TRANSPORT' | 'FINISH' | 'CANCELED'
>('ALL');

const displayOrders = computed(() => {
  const result = previewOrders.value.filter(
    (order) =>
      order.status === statusFilter.value || statusFilter.value === 'ALL',
  );

  if (sortBy.value === '價格低') {
    result.sort((a, b) => a.price - b.price);
  } else {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
});

const fetchOrders = async () => {
  pending.value = true;
  error.value = null;

  const { data, error: fetchError } = await useFetch<VendorOrderResponse>(
    `/api/vendor/${vendorId}/order`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (fetchError.value) {
    throw new Error(fetchError.value.message);
  }

  if (data.value) {
    previewOrders.value = data.value.orders;
  }
};

fetchOrders();

const updateOrderStatus = async (
  orderId: string,
  status: PreviewOrder['status'],
) => {
  try {
    await $fetch(`/api/vendor/${vendorId}/order/${orderId}`, {
      method: 'PUT',
      body: { status },
    });
    toast.success('訂單狀態更新成功');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(error.message);
    }
  }
};
</script>

<template>
  <div class="flex flex-1 flex-col px-8 py-8 h-screen w-screen">
    <div class="flex flex-row justify-between items-center mb-6">
      <h1 class="font-semibold text-2xl">商家訂單</h1>
      <div class="flex gap-3">
        <Select v-model="sortBy">
          <SelectTrigger>
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="價格低">價格低</SelectItem>
            <SelectItem value="價格高">價格高</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="statusFilter">
          <SelectTrigger>
            <SelectValue placeholder="訂單狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部</SelectItem>
            <SelectItem value="FINISH">已完成</SelectItem>
            <SelectItem value="CANCELED">已取消</SelectItem>
            <SelectItem value="RECEIVED">已接收</SelectItem>
            <SelectItem value="PROCESSING">處理中</SelectItem>
            <SelectItem value="TRANSPORT">運輸中</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div
      v-if="error"
      class="text-red-500 mb-4"
    >
      {{ error }}
    </div>

    <div class="flex-3 min-h-0 mb-10">
      <order-model
        :orders="displayOrders"
        :vendor-id="vendorId"
        :update-order-status="updateOrderStatus"
        class="h-full"
      />
    </div>
  </div>
</template>
