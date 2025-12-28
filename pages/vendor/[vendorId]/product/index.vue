<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import cardModel from '~/components/card-model.vue';

definePageMeta({
  layout: 'vendor-bar',
});

interface Product {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
  price: number;
  discountPrice: number | null;
  coverId: string | null;
  quantity: number;
}

const router = useRouter();
const route = useRoute();
const vendorId = route.params.vendorId as string;

const selectedFilter = ref('');

const { data, pending, error } = await useFetch<{
  products: Product[];
}>(`/api/vendor/${vendorId}/product`, {
  method: 'GET',
  credentials: 'include',
  default: () => ({ products: [] }),
});

const products = computed(() => data.value?.products ?? []);

const goToDetail = (productId: string) => {
  router.push(`/vendor/${vendorId}/product/${productId}`);
};
</script>
<template>
  <div class="flex flex-1 flex-col px-8 py-8 h-screen w-screen">
    <h1 class="font-semibold mb-2 text-2xl">店內商品</h1>

    <div class="flex justify-between items-center mb-2">
      <select
        v-model="selectedFilter"
        class="w-56 border rounded-lg p-2 text-sm bg-white"
      >
        <option value="">預設排序</option>
        <option value="NEWEST">最新上架</option>
        <option value="OLDEST">最早上架</option>
        <option value="PRICE_LOW">價格：低 → 高</option>
        <option value="PRICE_HIGH">價格：高 → 低</option>
      </select>

      <button
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
        @click="router.push(`/vendor/${vendorId}/product-create`)"
      >
        新增商品
      </button>
    </div>

    <div class="h-px mx-10 bg-gray-200 my-3"></div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-if="pending"
        class="flex justify-center items-center h-64 text-gray-500"
      >
        載入商品中...
      </div>
      <div
        v-else-if="error"
        class="text-center py-20 text-red-500"
      >
        <p>無法取得商品資料，請確認登入狀態。</p>
      </div>

      <div
        v-else-if="products.length === 0"
        class="text-center py-20 text-gray-400"
      >
        目前沒有任何商品。
      </div>

      <div
        v-else
        class="grid grid-cols-5 gap-8 mt-4 min-h-0 mb-10"
      >
        <div
          v-for="product in products"
          :key="product.id"
        >
          <cardModel
            :id="product.id"
            :description="product.name"
            :path-test="product.coverId || 'https://picsum.photos/200/300'"
            :price="product.price"
            :discount-price="product.discountPrice"
            :navigate-detail="() => goToDetail(product.id)"
          >
            <template #edit>
              <span
                class="text-xs px-2 py-1 rounded font-medium"
                :class="
                  product.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                "
              >
                {{ product.status === 'ACTIVE' ? '上架中' : '已下架' }}
              </span>
            </template>
          </cardModel>
        </div>
      </div>
    </div>
  </div>
</template>
