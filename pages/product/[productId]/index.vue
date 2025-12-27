<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
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
  subCategory?: {
    name: string;
  };
}

interface CartItem {
  id: number;
  description: string;
  price: number;
  imagePath: string;
  quantity?: number;
}

const router = useRouter();
const selectedQuantity = ref(1);
const {
  params: { productId },
} = useRoute('product-productId');

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

const currentProduct: CartItem = {
  id: 101,
  description: '【聲音課程】方序中生活設計提案 (有聲書)',
  price: 599,
  imagePath: 'https://picsum.photos/200/300',
};

const handleAddToCart = () => {
  const quantity = Number(selectedQuantity.value);

  // 讀取購物車
  const cartJson = localStorage.getItem('myCart') || '[]';
  const cartItems: CartItem[] = JSON.parse(cartJson) as CartItem[];

  // 看是否已存在
  const idx = cartItems.findIndex(
    (item: CartItem) => item.id === currentProduct.id,
  );

  if (idx > -1) {
    cartItems[idx].quantity = Number(cartItems[idx].quantity) + quantity;
  } else {
    cartItems.push({ ...currentProduct, quantity });
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
      <!-- 商品資訊區塊 -->
      <div class="flex flex-row mt-6 w-full gap-4">
        <!-- 商品圖片 -->
        <div
          class="aspect-square border border-gray-200 rounded-lg"
          style="width: 400px; height: 400px"
        >
          <img
            src="https://picsum.photos/200/300"
            class="w-full h-full object-contain"
          />
        </div>

        <!-- 商品描述 -->
        <div class="flex flex-col ml-10 flex-1">
          <p class="text-xl font-semibold">
            【聲音課程】方序中生活設計提案 (有聲書)
          </p>
          <div class="h-px bg-gray-300 my-3"></div>
          <p>作者：</p>
          <p>朗讀者：</p>
          <p>出版公司：</p>
          <p>出版時間：</p>
          <p>語言：</p>
          <div class="h-px bg-gray-300 my-3"></div>
          <p>定價：元</p>
        </div>

        <!-- 購買區塊 -->
        <div class="flex flex-col gap-4 ml-auto w-[260px]">
          <div class="flex flex-col gap-1">
            <p class="">結帳方式:</p>
            <p class="text-sm leading-snug">
              信用卡、無卡分期、貨到付款、行動支付、超商付款、ATM銀聯卡
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <p>數量:</p>
            <select
              v-model="selectedQuantity"
              class="bg-gray-200 border-2 rounded-lg border-gray-300 h-10 px-2"
            >
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
            </select>
          </div>

          <Button class="bg-gray-600 w-full"> 直接購買 </Button>
          <Button
            class="w-full"
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
            加入購物車
          </Button>
        </div>
      </div>

      <!-- 作者介紹 -->
      <div class="mt-10">
        <p class="text-orange-400 text-xl font-semibold">作者介紹</p>
        <div class="h-px flex bg-gray-200 my-2"></div>
        <div class="gap-4">
          <p>杉井光</p>
          <p class="text-sm leading-relaxed">
            一九七八年出生於東京。二○○六年以《火目的巫女》贏得第十二屆電擊大賞銀賞出道。其後出版的《神的記事本》系列大受好評，並改編為漫畫及動畫。活躍於輕小說及一般文學雜誌，二○二三年出版《世界上最透明的故事》，獲得多項推理大獎，日本銷量突破五十萬冊。二○二四年在臺出版後隨即引發話題，奪得同年誠品書店職人最想賣第一名、博客來年度翻譯類型小說第一名、金石堂年度十大影響力好書等大獎，並於出版一年內突破十萬冊。另著有《世界上最透明的故事2》、《離別的鋼琴奏鳴曲》、《學生會偵探桐香》、《樂園NOISE》等作品。
          </p>
        </div>
      </div>

      <!-- 其他書籍 -->
      <div class="mt-10 mb-6">
        <p class="text-orange-400 text-xl font-semibold">其他書籍</p>
        <div class="h-px flex bg-gray-200 my-2"></div>

        <!-- 載入中 -->
        <div
          v-if="loadingBooks"
          class="flex justify-center items-center h-64 text-gray-500"
        >
          載入中...
        </div>

        <!-- 書籍輪播 -->
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

        <!-- 無資料 -->
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
