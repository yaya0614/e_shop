<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { FetchError } from 'ofetch';

interface OrderProduct {
  id: string; // 購物車項目 ID
  quantity: number;
  product: {
    id: string; // 實際商品 ID
    name: string;
    price: number;
    discountPrice?: number;
    coverId?: string;
  };
}

const orderProducts = ref<OrderProduct[]>([]);
const isProcessing = ref(false);
const previewPrice = ref<number | null>(null);

// 新增：寄件詳情雙向綁定
const receiverData = ref({
  name: '',
  phone: '',
  address: '',
});

/* -----------------------------
 * API：載入購物車
 * ----------------------------- */
const loadCartData = async () => {
  try {
    const data = await $fetch<{ cartItems: OrderProduct[] }>('/api/cart', {
      method: 'GET',
      credentials: 'include',
    });
    orderProducts.value = data.cartItems;
    if (orderProducts.value.length === 0) navigateTo('/shop');
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      if (error.statusCode === 401) {
        toast.error('請先登入會員');
        return;
      }
      toast.error(error.data?.message || '讀取購物車資料失敗');
    }
  }
};

/* -----------------------------
 * API：試算金額 (修正金額為 0 的問題)
 * ----------------------------- */
const calculatePreviewPrice = async () => {
  if (orderProducts.value.length === 0) return;
  try {
    const data = await $fetch<number>('/api/order/preview/', {
      method: 'POST',
      credentials: 'include',
      body: {
        products: orderProducts.value.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      },
    });
    previewPrice.value = data;
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      if (error.statusCode === 404) {
        toast.error('試算失敗：找不到部分商品資料');
      } else if (error.statusCode === 422) {
        toast.error('試算失敗：訂單內容驗證失敗');
      } else {
        toast.error(error.data?.message || '金額計算發生錯誤');
      }
    }
  }
};

/* -----------------------------
 * API：建立訂單
 * ----------------------------- */
const handleCreateOrder = async () => {
  // 1. 前端必填欄位驗證
  if (!receiverData.value.name.trim()) {
    toast.error('請填寫收件人姓名');
    return;
  }
  if (!receiverData.value.phone.trim()) {
    toast.error('請填寫聯絡電話');
    return;
  }
  if (!receiverData.value.address.trim()) {
    toast.error('請填寫配送地址');
    return;
  }

  isProcessing.value = true;
  try {
    const response = await $fetch<{ status: string }>('/api/order', {
      method: 'POST',
      credentials: 'include',
      body: {
        products: orderProducts.value.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        // 若後端 API 需要收件資訊，可在此加入：
        // receiver: receiverData.value
      },
    });

    if (response.status === 'success') {
      toast.success('訂單已建立成功！');
      navigateTo('/order');
    }
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      const status = error.statusCode;
      const message = error.data?.message;

      switch (status) {
        case 401:
          toast.error('連線逾時，請重新登入');
          break;
        case 404:
          toast.error(`下單失敗：${message || '找不到指定的商品'}`);
          break;
        case 409:
          toast.error('下單失敗：商品庫存不足，請調整購買數量');
          break;
        case 422:
          toast.error('下單失敗：結帳商品必須來自同一位賣家');
          break;
        case 400:
          toast.error('訂單格式錯誤：' + (message || '請檢查輸入內容'));
          break;
        default:
          toast.error(message || '系統繁忙，請稍後再試');
      }
    }
  } finally {
    isProcessing.value = false;
  }
};

onMounted(async () => {
  await loadCartData();
  await calculatePreviewPrice();
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="bg-[#fcfcfc] w-full min-h-screen font-sans">
      <div class="w-full pl-10 pr-[420px] py-10 relative">
        <div class="max-w-[720px]">
          <h2 class="text-2xl font-bold text-gray-800 mb-8 tracking-tight">
            結帳確認
          </h2>

          <div class="mb-12">
            <h3
              class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1"
            >
              商品明細 ({{ orderProducts.length }})
            </h3>
            <div
              class="divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div
                v-for="item in orderProducts"
                :key="item.id"
                class="p-5 flex items-center gap-6 hover:bg-gray-50 transition-colors"
              >
                <img
                  :src="
                    item.product.coverId
                      ? `/api/image/${item.product.coverId}`
                      : 'https://picsum.photos/100/100'
                  "
                  class="w-16 h-16 object-cover rounded-lg bg-gray-50 border border-gray-100"
                />
                <div class="flex-1 min-w-0">
                  <h4
                    class="font-bold text-base text-gray-900 mb-1 line-clamp-1"
                  >
                    {{ item.product.name }}
                  </h4>
                  <p class="text-xs text-gray-400 font-medium">
                    數量 {{ item.quantity }} · 單價 ${{
                      (
                        item.product.discountPrice ?? item.product.price
                      ).toLocaleString()
                    }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-base text-gray-800">
                    ${{
                      (
                        (item.product.discountPrice ?? item.product.price) *
                        item.quantity
                      ).toLocaleString()
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-10">
            <h3
              class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1"
            >
              寄送資料 <span class="text-red-500 text-xs ml-1">*必填</span>
            </h3>
            <div
              class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label
                    class="text-[10px] font-bold text-gray-400 ml-1 uppercase"
                    >收件人姓名</label
                  >
                  <input
                    v-model="receiverData.name"
                    type="text"
                    placeholder="請輸入姓名"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label
                    class="text-[10px] font-bold text-gray-400 ml-1 uppercase"
                    >聯絡電話</label
                  >
                  <input
                    v-model="receiverData.phone"
                    type="text"
                    placeholder="手機號碼"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
                <div class="md:col-span-2 space-y-2">
                  <label
                    class="text-[10px] font-bold text-gray-400 ml-1 uppercase"
                    >配送地址</label
                  >
                  <input
                    v-model="receiverData.address"
                    type="text"
                    placeholder="請輸入收件地址"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="fixed top-50 right-10 w-[340px]">
          <div
            class="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6"
          >
            <h3 class="text-base font-bold text-gray-800 border-b pb-3">
              結帳明細
            </h3>
            <div class="space-y-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 font-medium">商品總計</span>
                <span class="font-bold text-gray-800"
                  >${{ previewPrice?.toLocaleString() ?? '0' }}</span
                >
              </div>
              <div
                class="pt-4 border-t border-gray-100 flex justify-between items-end"
              >
                <span class="text-gray-800 font-bold text-sm">應付總額</span>
                <div class="text-right">
                  <span class="text-xs text-red-600 font-bold mr-1">TWD</span>
                  <span
                    class="text-2xl font-black text-red-600 tracking-tighter"
                    >${{ previewPrice?.toLocaleString() ?? '0' }}</span
                  >
                </div>
              </div>
            </div>
            <button
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.98] disabled:bg-gray-300 shadow-lg shadow-red-100"
              :disabled="isProcessing"
              @click="handleCreateOrder"
            >
              {{ isProcessing ? '處理中...' : '確認下單' }}
            </button>
            <p class="text-center text-[10px] text-gray-400">
              下單即代表您同意本站之服務條款
            </p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
