<script setup lang="ts">
import cardModel from '~/components/card-model.vue';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const selected = ref('');
const currentPage = ref(1);
const product_list = [
  {
    id: 1,
    descrition: 'BooksPad國寶（上下套書）優惠組｜閱讀器＋電子套書',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 2,
    descrition: '【限量精裝】世界經典文學全集（10冊）| 莎士比亞＋海明威',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 3,
    descrition: 'AI 時代的資料思維｜從 0 到 1 打造你的資料能力',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 4,
    descrition: '解憂雜貨店｜東野圭吾作品集（2024 全新封面）',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 5,
    descrition: '哈利波特套書（1–7）| 中英雙語版｜禮盒收藏組',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 6,
    descrition: '深夜食堂漫畫精選集（1–5）｜溫暖系療癒讀物',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 7,
    descrition: '投資最重要的事｜哈佛商學院指定閱讀',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 8,
    descrition: 'Before the Coffee Gets Cold｜咖啡冷掉之前（英文版）',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 9,
    descrition: '你的名字。小說版｜新海誠｜電影典藏封面',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 10,
    descrition: '島田莊司推理精選（3冊套書）｜御手洗潔系列',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
  {
    id: 11,
    descrition: '島田莊司推理精選（3冊套書）｜御手洗潔系列',
    pathtest: 'https://picsum.photos/200/300',
    price: 7802,
  },
];

const router = useRouter();

const callback = (id: number) => {
  router.push({
    name: 'product-productId',
    params: {
      productId: id,
    },
  });
};
</script>
<template>
  <div class="flex flex-col h-screen">
    <div class="w-full flex justify-end pr-10 z-3">
      <select
        v-model="selected"
        class="w-40 ml-10"
      >
        <option value="">預設排序</option>
        <option value="Low">價格：低至高</option>
        <option value="High">價格：高至低</option>
      </select>
    </div>
    <div class="h-px flex ml-10 mr-10 bg-gray-200 my-2"></div>

    <div class="flex-1 overflow-y-auto w-full">
      <div class="grid grid-cols-5 gap-8 pl-8 pr-8 mt-4">
        <div
          v-for="product in product_list"
          :key="product.id"
        >
          <cardModel
            :id="product.id"
            ,
            :description="product.descrition"
            :path-test="product.pathtest"
            :price="product.price"
            :navigate_detail="callback"
            triger_card()
          ></cardModel>
        </div>
      </div>
    </div>
    <div class="shrink-0 mb-2">
      <Pagination
        v-slot="{ page }"
        :items-per-page="10"
        :total="100"
        :default-page="1"
        @update:page="
          (value) => {
            currentPage = value;
          }
        "
      >
        <PaginationContent v-slot="{ items }">
          <PaginationPrevious />
          <template
            v-for="(item, index) in items"
            :key="index"
          >
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === page"
            >
              {{ item.value }}
            </PaginationItem>
          </template>
          <PaginationEllipsis :index="4" />
          <PaginationNext />
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
