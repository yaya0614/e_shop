<script setup lang="ts">
import { ref } from 'vue';
import orderModel from '~/components/order-model.vue';

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

const fetchOrders = async () => {
  pending.value = true;
  error.value = null;

  const { data, error: fetchError } = await useFetch<VendorOrderResponse>(
    `/api/vendor/${vendorId}/order`,
    {
      method: 'GET',
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
</script>

<template>
  <div class="flex flex-1 flex-col px-8 py-8 h-screen w-screen">
    <h1 class="font-semibold mb-8 text-2xl">商家訂單</h1>
    <div
      v-if="error"
      class="text-red-500 mb-4"
    >
      {{ error }}
    </div>

    <div class="flex-[3] min-h-0 mb-10">
      <order-model
        :orders="previewOrders"
        :vendor-id="vendorId"
        class="h-full"
      />
    </div>
  </div>
</template>
