<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface CartItem {
  id: number | string;
  description: string;
  price: number;
  quantity: number;
  imagePath: string;
}

const orderProducts = ref<CartItem[]>([]);

const loadProductsFromCart = () => {
  const cartJson = localStorage.getItem('myCart');
  if (cartJson) {
    const rawItems = JSON.parse(cartJson) as CartItem[];
    orderProducts.value = rawItems.map((item) => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));
  }
};

const subtotalPrice = computed(() => {
  return orderProducts.value.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
});

//const selectedCouponId = ref('');
const newCouponCode = ref('');
const selectedPaymentMethod = ref('credit_card');
const selectedShippingOption = ref('standard');
const shippingAddressDetail = ref({ name: '', phone: '', address: '' });

onMounted(() => {
  loadProductsFromCart();
});
</script>

<template>
  <div class="p-8 max-w-full mx-auto flex gap-32">
    <div class="flex-1 space-y-6">
      <h2 class="text-2xl font-bold border-b pb-2">
        訂單商品清單 ({{ orderProducts.length }} 項)
      </h2>

      <div
        v-if="orderProducts.length === 0"
        class="text-center py-10 text-gray-500 border rounded-lg"
      >
        購物車是空的，無法結帳。
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="item in orderProducts"
          :key="item.id"
          class="flex items-start border-b pb-3"
        >
          <img
            :src="item.imagePath"
            alt="商品圖"
            class="w-16 h-16 object-cover rounded mr-4 shrink-0"
          />

          <div class="flex-1">
            <p class="font-medium text-sm">{{ item.description }}</p>
            <p class="text-gray-500 text-xs">
              單價: ${{ item.price.toLocaleString() }}
            </p>
          </div>

          <div class="text-right w-32">
            <p class="font-semibold text-sm">x {{ item.quantity }}</p>
            <p class="font-bold text-red-600 text-md">
              ${{ (item.price * item.quantity).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold border-b pb-2 pt-4">配送與付款資訊</h2>
      <div class="border p-4 rounded-lg space-y-4">
        <h3 class="font-semibold text-lg">1. 配送資訊</h3>
        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="shippingAddressDetail.name"
            type="text"
            placeholder="收件人姓名"
            class="p-2 border rounded"
          />
          <input
            v-model="shippingAddressDetail.phone"
            type="tel"
            placeholder="聯絡電話"
            class="p-2 border rounded"
          />
        </div>
        <input
          v-model="shippingAddressDetail.address"
          type="text"
          placeholder="詳細地址"
          class="p-2 border rounded w-full"
        />
        <div class="flex items-center gap-4 pt-2">
          <label class="font-medium">物流方式:</label>
          <div class="flex gap-4">
            <label
              ><input
                v-model="selectedShippingOption"
                type="radio"
                value="standard"
                class="mr-1"
              />
              宅配</label
            >
            <label
              ><input
                v-model="selectedShippingOption"
                type="radio"
                value="store_pickup"
                class="mr-1"
              />
              超商取貨</label
            >
          </div>
        </div>
      </div>

      <div class="border p-4 rounded-lg space-y-4">
        <h3 class="font-semibold text-lg">2. 優惠券</h3>
        <div class="flex gap-2">
          <input
            v-model="newCouponCode"
            type="text"
            placeholder="輸入優惠代碼"
            class="p-2 border rounded flex-1"
          />
          <button
            class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
          >
            套用
          </button>
        </div>
      </div>

      <div class="border p-4 rounded-lg space-y-4">
        <h3 class="font-semibold text-lg">3. 付款方式</h3>
        <div class="flex gap-6">
          <label
            ><input
              v-model="selectedPaymentMethod"
              type="radio"
              value="credit_card"
              class="mr-1"
            />
            信用卡/金融卡</label
          >
          <label
            ><input
              v-model="selectedPaymentMethod"
              type="radio"
              value="cash_on_delivery"
              class="mr-1"
            />
            貨到付款</label
          >
          <label
            ><input
              v-model="selectedPaymentMethod"
              type="radio"
              value="mobile_pay"
              class="mr-1"
            />
            行動支付</label
          >
        </div>
      </div>
    </div>

    <div
      class="w-80 shrink-0 border p-5 rounded-lg shadow-md h-fit space-y-4 sticky top-20"
    >
      <h2 class="text-xl font-bold border-b pb-2">結帳明細</h2>

      <div class="flex justify-between text-sm">
        <span>商品總金額</span>
        <span>${{ subtotalPrice.toLocaleString() }}</span>
      </div>
      <div class="flex justify-between text-sm text-green-600">
        <span>折扣金額 (-)</span><span>$0</span>
      </div>
      <div class="flex justify-between text-sm">
        <span>運費 (+)</span><span>$60</span>
      </div>

      <div class="border-t pt-4 flex justify-between items-center">
        <span class="text-lg font-bold">應付總金額</span>
        <span class="text-2xl font-extrabold text-red-700"
          >${{ (subtotalPrice + 60).toLocaleString() }}</span
        >
      </div>

      <button
        class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
        :disabled="orderProducts.length === 0"
      >
        確認結帳
      </button>
    </div>
  </div>
</template>
