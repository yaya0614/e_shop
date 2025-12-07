<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// 追蹤數量 (從下拉選單獲取)
const selectedQuantity = ref(1);

interface CartItem {
  id: number;
  description: string;
  price: number;
  imagePath: string;
  quantity?: number;
}
// 當前產品資料(模擬)
const currentProduct: CartItem = {
  id: 101,
  description: '【聲音課程】方序中生活設計提案 (有聲書)',
  price: 599,
  imagePath: 'https://picsum.photos/200/300',
};
// --- 加入購物車 ---
const handleAddToCart = () => {
  const quantity = Number(selectedQuantity.value); //使用者選取下拉選單的值
  // 讀取購物車
  const cartJson = localStorage.getItem('myCart') || '[]';
  const cartItems: CartItem[] = JSON.parse(cartJson) as CartItem[];
  // 看是否已存在
  const idx = cartItems.findIndex(
    (item: CartItem) => item.id === currentProduct.id,
  );

  if (idx > -1) {
    cartItems[idx].quantity = Number(cartItems[idx].quantity) + quantity; // 已存在= 增加數量
  } else {
    cartItems.push({ ...currentProduct, quantity }); // 不存在=新增至購物車
  }

  localStorage.setItem('myCart', JSON.stringify(cartItems)); //儲存回去
};
</script>

<template>
  <div class="flex flex-col h-screen max-w-full gap-2">
    <div class="flex flex-row mt-10 w-full px-40 gap-4">
      <div class="aspect-square bg-amber-600">
        <img
          src="https://picsum.photos/200/300"
          style="object-fit: contain"
        />
      </div>

      <div class="flex flex-col ml-10">
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

      <div class="flex flex-col gap-4 ml-auto w-[260px] mr-10">
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

        <Button class="bg-gray-600 w-[200px] mx-auto"> 直接購買 </Button>
        <Button
          @click="
            handleAddToCart(); //執行加入購物車
            // 2. 執行顯示提示訊息
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
    <p class="text-orange-400 mt-10 mx-40 text-xl font-semibold">作者介紹</p>

    <div class="h-px flex bg-gray-200 my-2 shrink-0 mx-24"></div>
    <div class="mx-40 gap-4">
      <p>杉井光</p>
      <p>
        一九七八年出生於東京。二○○六年以《火目的巫女》贏得第十二屆電擊大賞銀賞出道。其後出版的《神的記事本》系列大受好評，並改編為漫畫及動畫。活躍於輕小說及一般文學雜誌，二○二三年出版《世界上最透明的故事》，獲得多項推理大獎，日本銷量突破五十萬冊。二○二四年在臺出版後隨即引發話題，奪得同年誠品書店職人最想賣第一名、博客來年度翻譯類型小說第一名、金石堂年度十大影響力好書等大獎，並於出版一年內突破十萬冊。另著有《世界上最透明的故事2》、《離別的鋼琴奏鳴曲》、《學生會偵探桐香》、《樂園NOISE》等作品。
      </p>
    </div>
    <p class="text-orange-400 mt-10 mx-40 text-xl font-semibold">其他書籍</p>
    <div class="h-px flex bg-gray-200 my-2 shrink-0 mx-24"></div>
    <div class="flex flex-row justify-center max-w-full mx-40">
      <div class="w-full bg-white py-4">
        <div class="max-w-7xl mx-auto">
          <Carousel
            class="w-full"
            :opts="{ align: 'start' }"
          >
            <CarouselContent class="-ml-1 flex">
              <CarouselItem
                v-for="(_, index) in 20"
                :key="index"
                class="shrink-0 lg:basis-1/6"
              >
                <div class="p-1">
                  <Card>
                    <CardContent
                      class="flex aspect-3/4 items-center justify-center p-6"
                    >
                      <span class="text-xl font-semibold">{{ index + 1 }}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
      <!-- <Carousel
        class="flex-1 w-full max-w-xl"
        :opts="{
          align: 'start',
        }"
      >
        <CarouselContent class="-ml-1">
          <CarouselItem
            v-for="(_, index) in 20"
            :key="index"
            class="pl-1 md:basis-3/4 lg:basis-1/6"
          >
            <div class="p-1">
              <Card>
                <CardContent
                  class="flex aspect-square items-center justify-center p-6"
                >
                  <span class="text-2xl font-semibold">{{ index + 1 }}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel> -->
    </div>
  </div>
</template>
