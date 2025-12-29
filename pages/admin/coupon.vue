<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const form = ref({
  type: 'DISCOUNT' as const,
  discount: 0,
  couponPercentage: 0,
  maxPrice: 0,
  minPrice: 0,
  code: '',
});

const submit = async () => {
  errorMessage.value = null;
  successMessage.value = null;

  if (!form.value.code) {
    errorMessage.value = '請輸入 Coupon Code';
    return;
  }

  loading.value = true;

  await $fetch('/api/admin/coupon', {
    method: 'POST',
    body: {
      type: form.value.type,
      discount: Number(form.value.discount),
      couponPercentage: Number(form.value.couponPercentage),
      maxPrice: Number(form.value.maxPrice),
      minPrice: Number(form.value.minPrice),
      code: form.value.code,
    },
  });

  successMessage.value = 'Coupon 建立成功';
  setTimeout(() => {
    router.back();
  }, 800);
};
</script>

<template>
  <div class="max-w-fullmx-auto px-6 py-8 flex flex-col flex-1">
    <h1 class="text-2xl font-semibold mb-6 flex flex-1justify-start">
      Create Coupon
    </h1>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Coupon Code</label>
        <input
          v-model="form.code"
          type="text"
          class="w-full border rounded-md px-3 py-2"
          placeholder="EX: Test789"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1"> Discount（金額） </label>
        <input
          v-model.number="form.discount"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">
          Coupon Percentage（%）
        </label>
        <input
          v-model.number="form.couponPercentage"
          type="number"
          min="0"
          max="100"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1"> Minimum Price </label>
        <input
          v-model.number="form.minPrice"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">
          Maximum Discount Price
        </label>
        <input
          v-model.number="form.maxPrice"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="text-red-600 text-sm mt-4"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="successMessage"
      class="text-green-600 text-sm mt-4"
    >
      {{ successMessage }}
    </p>

    <div class="mt-6 flex gap-3">
      <button
        :disabled="loading"
        class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        @click="router.back()"
      >
        Cancel
      </button>

      <button
        :disabled="loading"
        class="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        @click="submit"
      >
        {{ loading ? '建立中...' : '建立優惠券' }}
      </button>
    </div>
  </div>
</template>
