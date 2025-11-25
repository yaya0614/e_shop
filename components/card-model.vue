<script setup lang="ts">
interface Props {
  id: number;
  description?: string;
  pathTest: string;
  price: number;
  navigate_detail: (id: number) => void;
}
const { pathTest } = defineProps<Props>();
</script>

<template>
  <div
    class="bg-white flex-1 rounded-xl border shadow-sm flex flex-col justify-between"
    @click="navigate_detail(id)"
  >
    <!-- CardContent -->

    <div class="flex flex-col items-center gap-2 px-2 pt-4">
      <div class="flex justify-center w-full">
        <img
          class="aspect-square"
          :src="pathTest"
          style="object-fit: contain"
        />
      </div>

      <p class="text-[12px] text-center line-clamp-1 overflow-hidden">
        {{ description }}
      </p>
    </div>
    <!-- Price-->
    <div class="pb-3">
      <p class="text-sm font-medium text-right mr-4 text-red-500">
        $ {{ price }}
      </p>
    </div>
  </div>
</template>
