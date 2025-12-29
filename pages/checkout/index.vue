<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { FetchError } from 'ofetch';

/* =====================
 * 型別定義
 * ===================== */
interface OrderProduct {
  id: string; // 購物車項 ID
  quantity: number;
  product: {
    id: string; // 實際產品 ID
    name: string;
    price: number;
    discountPrice?: number;
    coverId?: string;
    vendorId: string; // 新增：用於按廠商過濾結帳商品
  };
}
interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  coverId?: string;
  vendorId?: string;
}
interface Coupon {
  id: string;
  code: string;
  type: 'DISCOUNT' | 'COUPON';
  discountPrice?: number;
  couponPercentage?: number;
  maxPrice?: number;
  minPrice?: number;
}
const route = useRoute();
const orderProducts = ref<OrderProduct[]>([]);
const availableCoupons = ref<Coupon[]>([]);
const isProcessing = ref(false);

// API 試算回來的最終應付金額
const previewPrice = ref<number | null>(null);

// 優惠券選擇與領取狀態
const selectedCouponId = ref('');
const manualCouponCode = ref('');
const isApplyingCode = ref(false);

const receiverData = ref({
  name: '',
  phone: '',
  address: '',
});

/* =====================
 * Computed 計算屬性
 * ===================== */

// 互斥邏輯
const isUsingManual = computed(() => manualCouponCode.value.trim() !== '');
const isUsingSelect = computed(() => selectedCouponId.value !== '');

// 1. 商品小計 (完全不含優惠券的原始金額)
const originalSubtotal = computed(() => {
  return orderProducts.value.reduce((total, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return total + price * item.quantity;
  }, 0);
});

// 2. 優惠券折抵金額 (由商品小計減去 API 試算出的最終金額)
const discountAmount = computed(() => {
  if (!previewPrice.value) return 0;
  const diff = originalSubtotal.value - previewPrice.value;
  return diff > 0 ? diff : 0;
});

/* =====================
 * API 請求方法
 * ===================== */

// 載入購物車與過濾廠商
const loadCartData = async () => {
  // 檢查是否為「立即購買」模式
  if (route.query.buyNow === 'true' && route.query.productId) {
    try {
      const data = await $fetch<Product>(
        `/api/product/${route.query.productId}`,
      );

      orderProducts.value = [
        {
          id: 'buy-now-temp',
          quantity: Number(route.query.quantity) || 1,
          product: {
            id: data.id,
            name: data.name,
            price: data.price,
            discountPrice: data.discountPrice,
            coverId: data.coverId,
            vendorId: data.vendorId || '',
          },
        },
      ];
      return;
    } catch (error) {
      if (error instanceof FetchError) toast.error('讀取商品資料失敗');
    }
  }

  try {
    const data = await $fetch<{ cartItems: OrderProduct[] }>('/api/cart', {
      method: 'GET',
      credentials: 'include',
    });

    // 取得 URL 傳來的 vendorId 參數
    const targetVendorId = route.query.vendorId as string;

    // 如果有指定廠商，則進行過濾；否則帶入全部商品
    if (targetVendorId) {
      orderProducts.value = data.cartItems.filter(
        (item) => item.product.vendorId === targetVendorId,
      );
    } else {
      orderProducts.value = data.cartItems;
    }

    if (orderProducts.value.length === 0) navigateTo('/shop');
  } catch (error) {
    if (error instanceof FetchError) toast.error('讀取購物車失敗');
  }
};

// 載入可用優惠券
const loadAvailableCoupons = async () => {
  try {
    const data = await $fetch<Coupon[]>('/api/coupon', {
      method: 'GET',
      credentials: 'include',
    });
    availableCoupons.value = data;
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error('載入優惠券失敗');
    }
  }
};

// 領取優惠代碼
const applyManualCode = async () => {
  if (!manualCouponCode.value.trim()) return;
  isApplyingCode.value = true;
  try {
    await $fetch('/api/coupon/use-code', {
      method: 'POST',
      credentials: 'include',
      body: { code: manualCouponCode.value.trim() },
    });
    toast.success('領取成功！');
    await loadAvailableCoupons();
    manualCouponCode.value = '';
  } catch (error) {
    if (error instanceof FetchError) {
      const msg =
        error.statusCode === 404
          ? '代碼不存在'
          : error.statusCode === 409
            ? '您已領取過此代碼'
            : '領取失敗';
      toast.error(msg);
    }
  } finally {
    isApplyingCode.value = false;
  }
};

// 核心：API 金額預覽試算
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
        couponId: selectedCouponId.value || undefined,
      },
    });
    previewPrice.value = data;
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.statusCode === 422) {
        toast.error('此優惠券不符合使用門檻');
        selectedCouponId.value = '';
      }
    }
  }
};

// 監聽變動：當選中優惠券時，立即呼叫 API 同步價格
watch(selectedCouponId, () => calculatePreviewPrice());

// 建立訂單
const handleCreateOrder = async () => {
  if (
    !receiverData.value.name.trim() ||
    !receiverData.value.phone.trim() ||
    !receiverData.value.address.trim()
  ) {
    toast.error('請填寫完整收件資料');
    return;
  }

  isProcessing.value = true;
  try {
    const response = await $fetch<{ orderId: string }>('/api/order', {
      method: 'POST',
      credentials: 'include',
      body: {
        products: orderProducts.value.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        couponId: selectedCouponId.value || undefined,
      },
    });

    if (response.orderId) {
      toast.success('下單成功！');
      navigateTo(`/checkout/success?orderId=${response.orderId}`);
    }
  } catch (error) {
    if (error instanceof FetchError) {
      const status = error.statusCode;
      const message = error.data?.message;
      if (status === 409) toast.error('商品庫存不足，請調整數量');
      else if (status === 422) toast.error('訂單內包含不同賣家的商品');
      else toast.error(message || '訂單建立失敗');
    }
  } finally {
    isProcessing.value = false;
  }
};

onMounted(async () => {
  await loadCartData();
  await loadAvailableCoupons();
  await calculatePreviewPrice();
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="bg-[#fcfcfc] w-full min-h-screen font-sans text-gray-800">
      <div class="w-full pl-10 pr-[420px] py-10 relative">
        <div class="max-w-[720px]">
          <h2 class="text-2xl font-bold mb-8">結帳確認</h2>

          <div class="mb-12">
            <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 ml-1">
              商品明細 ({{ orderProducts.length }})
            </h3>
            <div
              class="divide-y divide-gray-100 bg-white rounded-xl border shadow-sm overflow-hidden"
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
                  class="w-16 h-16 object-cover rounded-lg border"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-base line-clamp-1">
                    {{ item.product.name }}
                  </h4>
                  <p class="text-xs text-gray-400">
                    數量 {{ item.quantity }} · 單價 ${{
                      (
                        item.product.discountPrice ?? item.product.price
                      ).toLocaleString()
                    }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-base">
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
            <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 ml-1">
              寄送資料 <span class="text-red-500 text-xs ml-1">*必填</span>
            </h3>
            <div class="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase"
                    >收件人姓名</label
                  >
                  <input
                    v-model="receiverData.name"
                    type="text"
                    placeholder="姓名"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase"
                    >聯絡電話</label
                  >
                  <input
                    v-model="receiverData.phone"
                    type="text"
                    placeholder="電話"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
                <div class="md:col-span-2 space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase"
                    >配送地址</label
                  >
                  <input
                    v-model="receiverData.address"
                    type="text"
                    placeholder="收件地址"
                    class="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="fixed top-[160px] right-10 w-[340px] space-y-4">
          <div class="bg-white p-6 rounded-2xl border shadow-lg space-y-6">
            <h3 class="text-base font-bold border-b pb-3">結帳明細</h3>

            <div class="space-y-3 border-b pb-6">
              <label class="text-[10px] font-bold text-gray-400 uppercase ml-1"
                >優惠方式</label
              >

              <select
                v-model="selectedCouponId"
                :disabled="isUsingManual"
                class="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-xs outline-none focus:border-black disabled:opacity-50 transition-all cursor-pointer"
              >
                <option value="">-- 選擇可用優惠券 --</option>
                <option
                  v-for="coupon in availableCoupons"
                  :key="coupon.id"
                  :value="coupon.id"
                >
                  {{ coupon.code }}
                  ({{
                    coupon.type === 'DISCOUNT'
                      ? `現折$${coupon.discountPrice}`
                      : `${coupon.couponPercentage}折`
                  }})
                  {{ coupon.minPrice ? ` 滿$${coupon.minPrice}` : '' }}
                  {{
                    coupon.type === 'COUPON' && coupon.maxPrice
                      ? ` 最高折$${coupon.maxPrice}`
                      : ''
                  }}
                </option>
              </select>

              <div class="flex gap-2">
                <input
                  v-model="manualCouponCode"
                  :disabled="isUsingSelect"
                  type="text"
                  placeholder="輸入代碼領取"
                  class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-black disabled:opacity-50 uppercase"
                />
                <button
                  :disabled="
                    isUsingSelect || isApplyingCode || !manualCouponCode
                  "
                  class="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black disabled:bg-gray-200"
                  @click="applyManualCode"
                >
                  領取
                </button>
              </div>
              <button
                v-if="isUsingSelect"
                class="w-full text-[10px] text-red-500 font-bold hover:underline"
                @click="selectedCouponId = ''"
              >
                取消使用優惠券
              </button>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 font-medium">商品小計</span>
                <span class="font-bold"
                  >${{ originalSubtotal.toLocaleString() }}</span
                >
              </div>

              <div
                v-if="selectedCouponId && discountAmount > 0"
                class="flex justify-between text-sm text-red-600"
              >
                <span class="font-medium">優惠券折抵</span>
                <span class="font-bold"
                  >- ${{ discountAmount.toLocaleString() }}</span
                >
              </div>

              <div
                class="pt-4 border-t border-gray-100 flex justify-between items-end"
              >
                <span class="font-bold text-sm">應付總額</span>
                <div class="text-right">
                  <span class="text-xs text-red-600 font-bold mr-1">TWD</span>
                  <span
                    class="text-2xl font-black text-red-600 tracking-tighter"
                  >
                    ${{ (previewPrice ?? originalSubtotal).toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>

            <button
              :disabled="isProcessing"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.98] disabled:bg-gray-300"
              @click="handleCreateOrder"
            >
              {{ isProcessing ? '處理中...' : '確認下單' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
