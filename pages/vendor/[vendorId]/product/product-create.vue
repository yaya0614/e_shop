<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

definePageMeta({
  layout: 'vendor-bar',
});

const {
  params: { vendorId },
} = route;

const productName = ref('');
const productDescription = ref('');
const price = ref<number | null>(null);
const quantity = ref<number | null>(null);

const coverId = ref<string | undefined>(undefined);

const coverPreview = ref<string | null>(null);

const onCoverChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0]) return;

  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    alert('請上傳圖片檔案');
    return;
  }

  coverPreview.value = URL.createObjectURL(file);
  coverId.value = 'a1b2c3d4-e5f6-7890-abcd-ef1234567009';
};
const onSubmit = async () => {
  if (!productName.value || price.value === null || quantity.value === null) {
    alert('請填寫完整商品資訊');
    return;
  }

  await $fetch(`/api/vendor/${vendorId}/product`, {
    method: 'POST',
    body: {
      productName: productName.value,
      productDescription: productDescription.value || undefined,
      price: price.value,
      quantity: quantity.value,
      coverId: coverId.value,
    },
    credentials: 'include',
  });

  alert('商品新增成功');

  productName.value = '';
  productDescription.value = '';
  price.value = null;
  quantity.value = null;
  coverId.value = undefined;
  coverPreview.value = null;
};
</script>

<template>
  <div class="flex flex-col px-8 py-8 h-screen w-screen">
    <h1 class="font-semibold mb-6 text-2xl">新增商品</h1>
    <div class="flex flex-1 gap-20 flex-row justify-between">
      <form
        class="space-y-6 lg:col-span-2 max-w-xl flex flex-col flex-1"
        @submit.prevent="onSubmit"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            商品名稱
          </label>
          <input
            v-model="productName"
            type="text"
            required
            placeholder="請輸入商品名稱"
            class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            商品描述
          </label>
          <textarea
            v-model="productDescription"
            rows="4"
            placeholder="請輸入商品描述"
            class="w-full p-2 border rounded-lg resize-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            價格
          </label>
          <input
            v-model.number="price"
            type="number"
            min="0"
            required
            placeholder="請輸入價格"
            class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            庫存數量
          </label>
          <input
            v-model.number="quantity"
            type="number"
            min="0"
            required
            placeholder="請輸入庫存數量"
            class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="submit"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            新增商品
          </button>

          <button
            type="button"
            class="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
            @click="router.back()"
          >
            取消
          </button>
        </div>
      </form>

      <div class="ml-10 flex flex-1 flex-col max-w-md">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          商品封面
        </label>

        <label
          class="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        >
          <img
            v-if="coverPreview"
            :src="coverPreview"
            class="object-cover w-full h-full rounded-lg"
            alt="封面預覽"
          />

          <div
            v-else
            class="flex flex-col items-center text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12m-4 4l-4-4m0 0l-4 4m4-4v12"
              />
            </svg>
            <p class="text-sm">點擊上傳圖片</p>
            <p class="text-xs mt-1">PNG / JPG</p>
          </div>

          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="onCoverChange"
          />
        </label>
      </div>
    </div>
  </div>
</template>
