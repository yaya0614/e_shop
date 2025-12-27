<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import cardModel from '~/components/card-model.vue';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

definePageMeta({
  layout: 'vendor-bar',
});

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  coverId: string | null;
  quantity: number;
  subCategory?: {
    name: string;
  };
}

const router = useRouter();

type SortFilter = '' | 'NEWEST' | 'OLDEST' | 'PRICE_LOW' | 'PRICE_HIGH';

const selectedFilter = ref<SortFilter>('');
const currentPage = ref(1);
const limit = 10;

const {
  data: products,
  pending,
  error,
} = await useFetch<Product[]>('/api/product', {
  method: 'GET',
  credentials: 'include',
  lazy: true,
  default: () => [],
  query: computed(() => ({
    page: currentPage.value,
    limit,
    Filter: selectedFilter.value || undefined,
  })),
  watch: [currentPage, selectedFilter],
});

const goToDetail = (id: string) => {
  router.push({
    name: 'product-productId',
    params: { productId: id },
  });
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
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition"
        @click="router.push({ name: 'vendor-product-create' })"
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
        <p class="text-xs mt-2">錯誤碼：{{ error.statusCode }}</p>
      </div>

      <div
        v-else
        class="grid grid-cols-5 gap-8 mt-4"
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
            :navigate-detail="goToDetail"
          >
            <template #edit>
              <div
                v-if="product.quantity === 0"
                class="text-xs text-red-500 mb-1"
              >
                <button
                  class="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 transition"
                  @click.stop="goToDetail(product.id)"
                >
                  上架
                </button>
              </div>
              <div
                v-else
                class="text-xs text-red-500 mb-1"
              >
                <button
                  class="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition"
                  @click.stop="goToDetail(product.id)"
                >
                  下架
                </button>
              </div></template
            >
          </cardModel>
        </div>
      </div>

      <div
        v-if="!pending && products.length === 0"
        class="text-center py-20 text-gray-400"
      >
        目前沒有任何商品。
      </div>
    </div>

    <div class="shrink-0">
      <Pagination
        v-slot="{ page }"
        :items-per-page="limit"
        :total="
          products.length < limit
            ? currentPage * limit
            : currentPage * limit + 1
        "
        :default-page="1"
        @update:page="(value) => (currentPage = value)"
      >
        <PaginationContent>
          <PaginationPrevious />
          <PaginationItem
            :value="page"
            :is-active="true"
          >
            {{ page }}
          </PaginationItem>
          <PaginationEllipsis />
          <PaginationNext />
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
