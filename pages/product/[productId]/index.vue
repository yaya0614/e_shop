<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { FetchError } from 'ofetch';

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

interface CartAPIResponse {
  cartItems: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      discountPrice?: number;
      quantity: number;
      coverId?: string;
    };
  }>;
}

const router = useRouter();
const route = useRoute();
const selectedQuantity = ref(1);
const productId = route.params.productId as string;

/* -----------------------------
 * 商品詳情 (GET /api/product/{productId})
 * ----------------------------- */
const { data: product, pending: loadingDetail } = await useFetch<Product>(
  `/api/product/${productId}`,
  {
    method: 'GET',
    credentials: 'include',
  },
);

/* -----------------------------
 * 其他書籍 (GET /api/product)
 * ----------------------------- */
const { data: relatedBooks, pending: loadingBooks } = await useFetch<Product[]>(
  '/api/product',
  {
    method: 'GET',
    credentials: 'include',
    default: () => [],
    query: {
      page: 1,
      limit: 11,
      Filter: 'NEWEST',
    },
  },
);

/* -----------------------------
 * 加入購物車邏輯 (整合 API)
 * ----------------------------- */
const handleAddToCart = async () => {
  if (!product.value) return;

  try {
    // 1. 嘗試執行「新增」 (POST)
    await $fetch('/api/cart', {
      method: 'POST',
      credentials: 'include',
      body: {
        productId: product.value.id,
        quantity: selectedQuantity.value,
      },
    });

    toast.success('成功加入購物車', {
      action: {
        label: '查看購物車',
        onClick: () => navigateTo('/shop'),
      },
    });
  } catch (error: unknown) {
    // 2. 如果報 409，代表商品已在購物車，改用 PUT 更新數量
    if (error instanceof FetchError && error.statusCode === 409) {
      try {
        const data = await $fetch<CartAPIResponse>('/api/cart', {
          method: 'GET',
          credentials: 'include',
        });

        const existingItem = data.cartItems.find(
          (item) => item.product.id === productId,
        );

        if (!existingItem) return;

        // 3. 執行「更新」 (PUT)
        await $fetch('/api/cart', {
          method: 'PUT',
          credentials: 'include',
          body: {
            cartItemId: existingItem.id,
            quantity: existingItem.quantity + selectedQuantity.value,
          },
        });

        toast.success('已更新購物車商品數量', {
          action: {
            label: '查看購物車',
            onClick: () => navigateTo('/shop'),
          },
        });
      } catch (putError: unknown) {
        if (putError instanceof FetchError && putError.statusCode === 409) {
          toast.error('庫存不足，無法加入更多');
        } else {
          toast.error('更新購物車失敗');
        }
      }
      return;
    }

    if (error instanceof FetchError && error.statusCode === 401) {
      toast.error('請先登入');
      return;
    }

    toast.error('加入購物車失敗');
  }
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
            @click="handleAddToCart"
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
