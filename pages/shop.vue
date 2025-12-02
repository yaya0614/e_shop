<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface CartItem {
  id: number;
  description: string;
  price: number;
  quantity: number;
  imagePath: string;
}

const cartItems = ref<CartItem[]>([]);

// --- LocalStorage 功能 ---
const saveCartToLocalStorage = () => {
  localStorage.setItem('myCart', JSON.stringify(cartItems.value));
};

const loadCartFromLocalStorage = () => {
  const cartJson = localStorage.getItem('myCart');
  if (cartJson) {
    cartItems.value = JSON.parse(cartJson);
  }
};

onMounted(() => {
  loadCartFromLocalStorage();
});

// --- 計算總金額 ---
const totalAmount = computed(() =>
  cartItems.value.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0),
);

// --- 更新數量 (+ / -) ---
const updateQuantity = (id: number, change: 1 | -1) => {
  const item = cartItems.value.find((i) => i.id === id);
  if (!item) return;

  const currentQuantity = Number(item.quantity);
  const newQuantity = currentQuantity + change;

  if (newQuantity >= 1) {
    item.quantity = newQuantity;
    saveCartToLocalStorage();
  }
};

// --- 移除商品 ---
const removeItem = (id: number) => {
  cartItems.value = cartItems.value.filter((i) => i.id !== id);
  saveCartToLocalStorage();
};
</script>

<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto bg-white">
    <h1 class="text-3xl font-bold mb-6">我的購物車</h1>

    <div class="border rounded-lg shadow-md overflow-hidden">
      <!-- 表頭 -->
      <div
        class="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr] text-sm font-semibold text-gray-700 bg-gray-200 border-b"
      >
        <div class="p-3 text-center">商品明細</div>
        <div class="p-3 text-center border-l">數量</div>
        <div class="p-3 text-center border-l">小計</div>
        <div class="p-3 text-center border-l">庫存</div>
        <div class="p-3 text-center border-l">變更明細</div>
      </div>

      <!-- 無商品 -->
      <div
        v-if="cartItems.length === 0"
        class="p-16 text-center text-gray-500 bg-white"
      >
        <p class="text-xl font-medium">無商品資料</p>
      </div>

      <!-- 商品列表 -->
      <div v-else>
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr] items-center border-b hover:bg-gray-50"
        >
          <!-- 商品明細 -->
          <div class="p-3 flex items-center">
            <img
              :src="item.imagePath"
              alt="商品圖"
              class="w-16 h-16 object-cover rounded mr-4"
            />
            <span class="font-medium text-sm">{{ item.description }}</span>
          </div>

          <!-- 數量調整 -->
          <div class="p-3 text-center border-l flex justify-center">
            <div class="flex items-center border rounded-md">
              <button
                :disabled="item.quantity <= 1"
                class="px-2 py-1 text-gray-600 cursor-pointer"
                @click="updateQuantity(item.id, -1)"
              >
                -
              </button>

              <span class="px-3 border-l border-r text-sm w-8">
                {{ item.quantity }}
              </span>

              <button
                class="px-2 py-1 text-gray-600 cursor-pointer"
                @click="updateQuantity(item.id, 1)"
              >
                +
              </button>
            </div>
          </div>

          <!-- 小計 -->
          <div class="p-3 text-center border-l font-semibold text-red-600">
            ${{ (item.price * item.quantity).toLocaleString() }}
          </div>

          <!-- 庫存 -->
          <div class="p-3 text-center border-l text-green-600">充足</div>

          <!-- 移除 -->
          <div class="p-3 text-center border-l">
            <button
              class="text-sm text-blue-500 hover:text-red-500 cursor-pointer"
              @click="removeItem(item.id)"
            >
              移除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 合計金額 -->
    <div
      v-if="cartItems.length > 0"
      class="mt-8 flex justify-end items-center"
    >
      <div class="text-lg font-bold mr-4">合計金額：</div>
      <div class="text-2xl font-extrabold text-red-700">
        ${{ totalAmount.toLocaleString() }}
      </div>
    </div>

    <!-- 前往結帳 -->
    <div
      v-if="cartItems.length > 0"
      class="mt-4 flex justify-end"
    >
      <button
        class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition cursor-pointer"
      >
        前往結帳
      </button>
    </div>
  </div>
</template>
