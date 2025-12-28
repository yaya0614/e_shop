<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({
  layout: 'vendor-bar',
});

const route = useRoute('vendor-vendorId-product-productId');
const router = useRouter();

const vendorId = route.params.vendorId;
const productId = route.params.productId;

const form = ref({
  productName: '',
  productDescription: '',
  price: 0,
  discountPrice: undefined as number | undefined,
  quantity: 0,
  coverId: '',
});

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const currentStatus = ref<'ACTIVE' | 'INACTIVE' | null>(null);

const fetchProductStatus = async () => {
  const data = await $fetch(`/api/product/${productId}`);
  currentStatus.value = data.status;
};

const submit = async () => {
  errorMessage.value = null;
  successMessage.value = null;

  if (!form.value.productName || form.value.price <= 0) {
    errorMessage.value = '請填寫正確的商品名稱與價格';
    return;
  }

  loading.value = true;
  await $fetch(`/api/vendor/${vendorId}/product/${productId}`, {
    method: 'PUT',
    body: {
      productName: form.value.productName,
      productDescription: form.value.productDescription || undefined,
      price: Number(form.value.price),
      discountPrice:
        form.value.discountPrice !== undefined
          ? Number(form.value.discountPrice)
          : undefined,
      quantity: Number(form.value.quantity),
      coverId: form.value.coverId || undefined,
    },
  });

  successMessage.value = '商品資訊已成功更新';
};

const updateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  await $fetch(`/api/vendor/${vendorId}/product/status`, {
    method: 'PUT',
    body: {
      productId: productId,
      productStatus: status,
    },
    credentials: 'include',
  });

  const product = await $fetch(`/api/product/${productId}`);
  currentStatus.value = product.status;

  successMessage.value =
    product.status === 'ACTIVE' ? '商品已成功上架' : '商品已成功下架';
};

const deleteProduct = async () => {
  const confirmed = confirm('確定要刪除此商品嗎？刪除後將無法復原');
  if (!confirmed) return;

  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    await $fetch(`/api/vendor/${vendorId}/product`, {
      method: 'DELETE',
      body: {
        productId: productId,
      },
      credentials: 'include',
    });

    successMessage.value = '商品已成功刪除';
  } catch (error) {
    errorMessage.value = '刪除商品失敗' + error;
  }

  // 刪除成功後返回商品列表頁（依你的路由結構自行調整）
  setTimeout(() => {
    router.push(`/vendor/${vendorId}/product`);
  }, 800);
};

onMounted(() => {
  fetchProductStatus();
});
</script>

<template>
  <div class="flex flex-1 w-full flex-col mx-auto px-8 py-8">
    <h1 class="text-2xl font-semibold mb-6">更新商品資訊</h1>

    <div
      v-if="currentStatus"
      class="mb-6 border rounded-lg p-4 bg-gray-50 flex items-center gap-4"
    >
      <span class="text-sm font-medium text-gray-700">
        商品狀態：
        <b>
          {{ currentStatus === 'ACTIVE' ? '上架中' : '已下架' }}
        </b>
      </span>

      <button
        v-if="currentStatus === 'INACTIVE'"
        class="px-4 py-2 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300"
        :disabled="loading"
        @click="updateStatus('ACTIVE')"
      >
        上架
      </button>

      <button
        v-if="currentStatus === 'ACTIVE'"
        class="px-4 py-2 rounded-md text-sm bg-gray-700 text-white hover:bg-gray-800 disabled:bg-gray-400"
        :disabled="loading"
        @click="updateStatus('INACTIVE')"
      >
        下架
      </button>
    </div>

    <div class="space-y-4 bg-white border rounded-lg p-6">
      <div>
        <label class="block text-sm font-medium mb-1"> 商品名稱 </label>
        <input
          v-model="form.productName"
          type="text"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1"> 商品描述 </label>
        <textarea
          v-model="form.productDescription"
          rows="3"
          class="w-full border rounded-md px-3 py-2"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1"> 價格 (TWD) </label>
          <input
            v-model.number="form.price"
            type="number"
            min="0"
            class="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1"> 折扣價 (選填) </label>
          <input
            v-model.number="form.discountPrice"
            type="number"
            min="0"
            class="w-full border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1"> 庫存數量 </label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="0"
            class="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1"> 封面圖片 ID </label>
          <input
            v-model="form.coverId"
            type="text"
            class="w-full border rounded-md px-3 py-2"
            placeholder="uuid"
          />
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="text-red-600 text-sm"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="text-green-600 text-sm"
      >
        {{ successMessage }}
      </div>

      <div class="flex justify-end gap-3 pt-4 space-x-4">
        <button
          class="px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
          :disabled="loading"
          @click="deleteProduct"
        >
          刪除商品
        </button>
        <button
          class="px-4 py-2 border rounded-md"
          @click="router.back()"
        >
          取消
        </button>

        <button
          class="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? '更新中...' : '更新商品' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
