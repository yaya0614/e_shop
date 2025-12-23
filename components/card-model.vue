<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  id: string;
  description: string; // 接收 API 的 product.name
  pathTest: string;
  price: number;
  discountPrice?: number | null;
  navigateDetail: (id: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  description: '未命名書籍',
  discountPrice: null,
});

// 判斷是否有折扣邏輯
const hasDiscount = computed(() => {
  return (
    props.discountPrice !== null &&
    props.discountPrice !== undefined &&
    props.discountPrice < props.price
  );
});
</script>

<template>
  <div
    class="group bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden max-w-[220px] w-full mx-auto"
    @click="navigateDetail(id)"
  >
    <div
      class="aspect-[3/4] w-full bg-gray-50 flex items-center justify-center p-6"
    >
      <img
        :src="pathTest"
        class="max-h-full max-w-full object-contain shadow-sm group-hover:scale-105 transition-transform duration-300"
        alt="Book Cover"
      />
    </div>

    <div class="flex flex-col p-4 pt-2 flex-1">
      <h3
        class="text-sm font-bold text-gray-700 text-center line-clamp-2 leading-snug mb-3 min-h-[2.5rem] flex items-center justify-center px-1"
      >
        {{ description }}
      </h3>

      <div class="flex flex-col items-end w-full mt-auto">
        <div
          v-if="hasDiscount"
          class="flex items-baseline gap-1.5"
        >
          <span
            class="text-[11px] text-gray-400 line-through decoration-gray-300"
          >
            ${{ price.toLocaleString() }}
          </span>
          <span class="text-lg font-bold text-red-500">
            ${{ discountPrice?.toLocaleString() }}
          </span>
        </div>

        <div v-else>
          <span class="text-lg font-bold text-gray-800">
            ${{ price.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
