<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import cardModel from '~/components/card-model.vue';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  coverId: string | null;
  quantity: number;
  subCategorys: Array<{ id: string; name: string; categoryId: string }>;
}

interface CartItem {
  id: string;
  description: string;
  price: number;
  imagePath: string;
  quantity?: number;
}

const router = useRouter();
const route = useRoute();
const selectedQuantity = ref(1);

// 獲取路由參數中的 productId
const productId = route.params.productId as string;

// 2. 獲取單一產品詳情 (整合後端 API: GET /api/product/{productId})
const { data: product, pending: loadingDetail } = await useFetch<Product>(
  `/api/product/${productId}`,
  {
    method: 'GET',
    credentials: 'include',
    key: `product-detail-${productId}`,
  },
);

// 相關書籍獲取邏輯維持原樣 (已包含 credentials: 'include')
const { data: relatedBooks, pending: loadingBooks } = await useFetch<Product[]>(
  '/api/product',
  {
    method: 'GET',
    credentials: 'include',
    lazy: true,
    default: () => [],
    query: {
      page: 1,
      limit: 11,
      Filter: 'NEWEST',
    },
  },
);

// 3. 處理加入購物車
const handleAddToCart = () => {
  if (!product.value) return;

  const quantity = Number(selectedQuantity.value);
  const cartJson = localStorage.getItem('myCart') || '[]';
  const cartItems: CartItem[] = JSON.parse(cartJson) as CartItem[];

  // 尋找是否已存在
  const idx = cartItems.findIndex(
    (item: CartItem) => item.id === product.value?.id,
  );

  if (idx > -1) {
    cartItems[idx].quantity = (cartItems[idx].quantity || 0) + quantity;
  } else {
    cartItems.push({
      id: product.value.id,
      description: product.value.name,
      price: product.value.discountPrice || product.value.price, // 優先存入折扣價
      imagePath: product.value.coverId
        ? `/api/image/${product.value.coverId}`
        : 'https://picsum.photos/200/300',
      quantity,
    });
  }

  localStorage.setItem('myCart', JSON.stringify(cartItems));
};

const goToDetail = (id: string) => {
  router.push({
    name: 'product-productId',
    params: { productId: id },
  });
};
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 px-10">
      <div
        v-if="loadingDetail"
        class="flex justify-center items-center h-96 text-gray-500"
      >
        正在載入產品資訊...
      </div>

      <div
        v-else-if="product"
        class="flex flex-row mt-6 w-full gap-4"
      >
        <div
          class="aspect-square border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
          style="width: 400px; height: 400px"
        >
          <img
            :src="
              product.coverId
                ? `/api/image/${product.coverId}`
                : 'https://picsum.photos/200/300'
            "
            class="w-full h-full object-contain"
          />
        </div>

        <div class="flex flex-col ml-10 flex-1">
          <p class="text-xl font-semibold">
            {{ product.name }}
          </p>
          <div class="h-px bg-gray-300 my-3"></div>
          <p>商品編號：{{ product.id }}</p>
          <p>分類：{{ product.subCategorys.map((s) => s.name).join(', ') }}</p>
          <p>庫存狀態：{{ product.quantity > 0 ? '現貨' : '缺貨' }}</p>
          <div class="h-px bg-gray-300 my-3"></div>
          <div class="flex items-center gap-4">
            <p
              v-if="product.discountPrice"
              class="text-red-600 font-bold text-2xl"
            >
              NT$ {{ product.discountPrice }}
            </p>
            <p :class="{ 'line-through text-gray-400': product.discountPrice }">
              定價：{{ product.price }} 元
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-4 ml-auto w-[260px]">
          <div class="flex flex-col gap-1">
            <p class="">結帳方式:</p>
            <p class="text-sm leading-snug">
              信用卡、無卡分期、貨到付款、行動支付、超商付款、ATM銀聯卡
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <p :class="product.quantity <= 0 ? 'text-gray-400' : ''">數量:</p>
            <select
              v-model="selectedQuantity"
              :disabled="product.quantity <= 0"
              class="bg-gray-200 border-2 rounded-lg border-gray-300 h-10 px-2 disabled:opacity-50"
            >
              <option
                v-for="n in Math.min(product.quantity, 10)"
                :key="n"
                :value="n"
              >
                {{ n }}
              </option>
            </select>
            <p
              v-if="product.quantity <= 0"
              class="text-red-500 text-sm font-bold text-center mt-1"
            >
              ⚠️ 暫無庫存
            </p>
          </div>

          <Button
            class="w-full h-12"
            :class="
              product.quantity <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-600'
            "
            :disabled="product.quantity <= 0"
          >
            {{ product.quantity > 0 ? '直接購買' : '補貨中' }}
          </Button>
          <Button
            :disabled="product.quantity <= 0"
            class="w-full"
            :variant="product.quantity <= 0 ? 'secondary' : 'default'"
            @click="
              handleAddToCart();
              toast('成功加入購物車!', {
                action: {
                  label: '檢視購物車',
                  onClick: () => navigateTo('/shop'),
                },
              });
            "
          >
            {{ product.quantity > 0 ? '加入購物車' : '補貨中 / 已售完' }}
          </Button>
        </div>
      </div>

      <div
        v-if="product"
        class="mt-10"
      >
        <p class="text-orange-400 text-xl font-semibold">商品詳情</p>
        <div class="h-px flex bg-gray-200 my-2"></div>
        <div class="gap-4">
          <p class="text-sm leading-relaxed whitespace-pre-line">
            {{ product.description || '暫無商品描述。' }}
          </p>
        </div>
      </div>

      <div class="mt-10 mb-6">
        <p class="text-orange-400 text-xl font-semibold">其他書籍</p>
        <div class="h-px flex bg-gray-200 my-2"></div>

        <div
          v-if="loadingBooks"
          class="flex justify-center items-center h-64 text-gray-500"
        >
          載入中...
        </div>

        <div
          v-else-if="relatedBooks && relatedBooks.length > 0"
          class="w-full bg-white py-4"
        >
          <Carousel
            class="w-full"
            :opts="{ align: 'start' }"
          >
            <CarouselContent class="-ml-1 flex">
              <CarouselItem
                v-for="book in relatedBooks.filter(
                  (book) => book.id !== productId,
                )"
                :key="book.id"
                class="shrink-0 lg:basis-1/6"
              >
                <div class="p-1">
                  <cardModel
                    :id="book.id"
                    :description="book.name"
                    :path-test="book.coverId || 'https://picsum.photos/200/300'"
                    :price="book.price"
                    :discount-price="book.discountPrice"
                    :navigate-detail="goToDetail"
                  />
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <div
          v-else
          class="text-center py-10 text-gray-400"
        >
          目前沒有其他書籍
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
