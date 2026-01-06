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
const route = useRoute();

type SortFilter = '' | 'NEWEST' | 'OLDEST' | 'PRICE_LOW' | 'PRICE_HIGH';

const selectedFilter = ref<SortFilter>(''); // ← 預設排序
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
    keyword: route.query.search
      ? String(route.query.search).trim().length > 0
        ? String(route.query.search).trim()
        : undefined
      : undefined,
  })),
  watch: [currentPage, selectedFilter, () => route.query.search],
});

const goToDetail = (id: string) => {
  router.push({
    name: 'product-productId',
    params: { productId: id },
  });
};
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1">
      <!-- 排序選單 -->
      <div class="w-full flex justify-end pr-10 mt-2">
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
      </div>

      <div class="h-px mx-10 bg-gray-200 my-3"></div>

      <!-- 商品列表 -->
      <div class="flex-1 px-10">
        <!-- 載入中 -->
        <div
          v-if="pending"
          class="flex justify-center items-center h-64 text-gray-500"
        >
          載入商品中...
        </div>

        <!-- 錯誤 -->
        <div
          v-else-if="error"
          class="text-center py-20 text-red-500"
        >
          <p>無法取得商品資料，請確認登入狀態。</p>
          <p class="text-xs mt-2">錯誤碼：{{ error.statusCode }}</p>
        </div>

        <!-- 商品卡片 -->
        <div
          v-else
          class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-4"
        >
          <div
            v-for="product in products"
            :key="product.id"
          >
            <cardModel
              :id="product.id"
              :description="product.name"
              :path-test="'https://picsum.photos/200/300'"
              :price="product.price"
              :discount-price="product.discountPrice"
              :navigate-detail="goToDetail"
            />
          </div>
        </div>

        <!-- 無資料 -->
        <div
          v-if="!pending && products.length === 0"
          class="text-center py-20 text-gray-400"
        >
          目前沒有任何商品。
        </div>
      </div>
    </div>

    <!-- 分頁 -->
    <template #footer>
      <div class="py-4">
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
    </template>
  </NuxtLayout>
</template>
