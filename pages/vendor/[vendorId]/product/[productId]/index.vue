<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { FetchError } from 'ofetch';

definePageMeta({
  layout: 'vendor-bar',
});

const route = useRoute('vendor-vendorId-product-productId');
const router = useRouter();

const vendorId = route.params.vendorId;
const productId = route.params.productId;
const goToLog = () => {
  router.push(`/vendor/${vendorId}/product/${productId}/log`);
};

const form = ref({
  productName: '',
  productDescription: '',
  price: 0,
  discountPrice: undefined as number | undefined,
  quantity: 0,
  coverId: '',
});

const loading = ref(false);
const categoryLoading = ref(false);

const currentStatus = ref<'ACTIVE' | 'INACTIVE' | undefined>(undefined);

// 獲取所有分類
const { data: categoriesData } = await useFetch('/api/category', {
  method: 'GET',
});
const categories = computed(() => categoriesData.value?.categories || []);

// 選中的子分類 IDs

const { data, refresh } = await useFetch(`/api/product/${productId}`, {
  method: 'GET',
  credentials: 'include',
});
currentStatus.value = data?.value?.status;
form.value = {
  productName: data?.value?.name ?? '',
  productDescription: data?.value?.description ?? '',
  price: data?.value?.price ?? 0,
  discountPrice: data?.value?.discountPrice ?? undefined,
  quantity: data?.value?.quantity ?? 0,
  coverId: data?.value?.coverId ?? '',
};

const selectedSubCategoryIds = ref<string[]>(
  data.value?.subCategorys?.map((sub) => sub.id) ?? [],
);

// 監聽數據變化，更新選中的子分類
watch(data, (newData) => {
  if (newData?.subCategorys) {
    selectedSubCategoryIds.value = newData.subCategorys.map((sub) => sub.id);
  }
});

const submit = async () => {
  if (!form.value.productName || form.value.price <= 0) {
    toast.error('請填寫正確的商品名稱與價格');
    return;
  }

  loading.value = true;
  try {
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
    toast.success('商品資訊已成功更新');
    await refresh();
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`更新商品資訊失敗：${error.message}`);
    }
  }
  loading.value = false;
};

const updateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
  loading.value = true;

  try {
    await $fetch(`/api/vendor/${vendorId}/product/status`, {
      method: 'PUT',
      body: {
        productId: productId,
        productStatus: status,
      },
      credentials: 'include',
    });
    currentStatus.value = status;
    toast.success(status === 'ACTIVE' ? '商品已成功上架' : '商品已成功下架');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`更新商品狀態失敗：${error.message}`);
    }
  }

  loading.value = false;
};

const deleteProduct = async () => {
  const confirmed = confirm('確定要刪除此商品嗎？刪除後將無法復原');
  if (!confirmed) return;

  loading.value = true;

  try {
    await $fetch(`/api/vendor/${vendorId}/product`, {
      method: 'DELETE',
      body: {
        productId: productId,
      },
      credentials: 'include',
    });

    toast.success('商品已成功刪除');
  } catch (error) {
    toast.error('刪除商品失敗' + error);
  }

  router.push(`/vendor/${vendorId}/product`);
};

const toggleSubCategory = (subCategoryId: string) => {
  if (selectedSubCategoryIds.value.includes(subCategoryId)) {
    selectedSubCategoryIds.value = selectedSubCategoryIds.value.filter(
      (id) => id !== subCategoryId,
    );
  } else {
    selectedSubCategoryIds.value.push(subCategoryId);
  }
};

const updateCategories = async () => {
  categoryLoading.value = true;

  try {
    await $fetch(`/api/vendor/${vendorId}/product/${productId}/category`, {
      method: 'PUT',
      body: {
        subCategoryIds: selectedSubCategoryIds.value,
      },
      credentials: 'include',
    });

    toast.success('商品分類已成功更新');
    await refresh();
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`更新商品分類失敗：${error.message}`);
    }
  }

  categoryLoading.value = false;
};
</script>

<template>
  <div class="flex flex-1 w-full flex-col mx-auto pt-8">
    <div class="flex items-center justify-between mb-6 px-8">
      <h1 class="text-2xl font-semibold text-gray-800">更新商品資訊</h1>

      <button
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 shadow-sm active:scale-95"
        @click="goToLog"
      >
        <span class="text-lg">📋</span>
        查看異動紀錄
      </button>
    </div>

    <div class="flex flex-col space-y-4 overflow-y-scroll min-h-0 pb-8 px-8">
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
            <label class="block text-sm font-medium mb-1">
              折扣價 (選填)
            </label>
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

      <div class="mt-6 space-y-4 bg-white border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">商品分類</h2>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
            :disabled="categoryLoading"
            @click="updateCategories"
          >
            {{ categoryLoading ? '更新中...' : '更新分類' }}
          </button>
        </div>

        <div
          v-if="categories.length === 0"
          class="text-gray-500 text-center py-8"
        >
          目前沒有可用的分類
        </div>

        <div
          v-for="category in categories.filter(
            (c) => c.subCategories.length > 0,
          )"
          :key="category.id"
          class="border rounded-lg p-4 mb-4"
        >
          <h3 class="font-medium text-lg mb-3">{{ category.name }}</h3>

          <div
            v-if="category.subCategories.length === 0"
            class="text-gray-400 text-sm"
          >
            此分類下沒有子分類
          </div>

          <div
            v-else
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
          >
            <label
              v-for="subCategory in category.subCategories"
              :key="subCategory.id"
              class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="selectedSubCategoryIds.includes(subCategory.id)"
                class="w-4 h-4"
                @change="toggleSubCategory(subCategory.id)"
              />
              <span class="text-sm">{{ subCategory.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
