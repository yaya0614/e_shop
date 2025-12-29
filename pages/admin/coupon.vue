<script setup lang="ts">
import { ref } from 'vue';
import { FetchError } from 'ofetch';
import Select from '~/components/ui/select/Select.vue';
import SelectContent from '~/components/ui/select/SelectContent.vue';
import SelectItem from '~/components/ui/select/SelectItem.vue';
import SelectTrigger from '~/components/ui/select/SelectTrigger.vue';
import SelectValue from '~/components/ui/select/SelectValue.vue';
import type { CouponType } from '~/prisma/generated/enums';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'admin',
});

const router = useRouter();
const loading = ref(false);

const form = ref<{
  type: CouponType;
  discount: number;
  couponPercentage: number;
  maxPrice: number;
  minPrice: number;
  code: string;
}>({
  type: 'DISCOUNT',
  discount: 0,
  couponPercentage: 0,
  maxPrice: 0,
  minPrice: 0,
  code: '',
});

const submit = async () => {
  loading.value = true;

  try {
    const response = await $fetch('/api/admin/coupon', {
      method: 'POST',
      body: {
        type: form.value.type,
        discount:
          form.value.type === 'DISCOUNT'
            ? Number(form.value.discount)
            : undefined,
        couponPercentage:
          form.value.type === 'COUPON'
            ? Number(form.value.couponPercentage)
            : undefined,
        maxPrice:
          Number(form.value.maxPrice) > 0
            ? Number(form.value.maxPrice)
            : undefined,
        minPrice:
          Number(form.value.minPrice) > 0
            ? Number(form.value.minPrice)
            : undefined,
        code: form.value.code,
      },
    });

    toast.success(`Coupon: ${response.code} 建立成功`);

    form.value = {
      type: 'DISCOUNT',
      discount: 0,
      couponPercentage: 0,
      maxPrice: 0,
      minPrice: 0,
      code: '',
    };
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="max-w-fullmx-auto px-6 py-8 flex flex-col flex-1 max-w-4/6">
    <h1 class="text-2xl font-semibold mb-6 flex flex-1justify-start">
      Create Coupon
    </h1>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Coupon Type</label>
        <Select v-model="form.type">
          <SelectTrigger>
            <SelectValue placeholder="Select a coupon type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DISCOUNT">折價卷</SelectItem>
            <SelectItem value="COUPON">優惠卷</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Coupon Code</label>
        <input
          v-model="form.code"
          type="text"
          class="w-full border rounded-md px-3 py-2"
          placeholder="EX: Test789"
        />
      </div>

      <div v-if="form.type === 'DISCOUNT'">
        <label class="block text-sm font-medium mb-1"> Discount（金額） </label>
        <input
          v-model.number="form.discount"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div v-if="form.type === 'COUPON'">
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
        <label class="block text-sm font-medium mb-1">
          Minimum Price (optional )
        </label>
        <input
          v-model.number="form.minPrice"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">
          Maximum Discount Price (optional)
        </label>
        <input
          v-model.number="form.maxPrice"
          type="number"
          class="w-full border rounded-md px-3 py-2"
        />
      </div>
    </div>

    <div class="mt-6 flex gap-3 items-end justify-end">
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
