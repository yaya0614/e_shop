<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { FetchError } from 'ofetch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
const router = useRouter();
function go(path: string) {
  router.push(path);
}
// 1. 定義型別與介面
interface CartProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number; // 庫存
  coverId?: string;
}

interface CartItem {
  id: string; // cartItemId
  quantity: number;
  product: CartProduct;
}

// 2. 狀態管理
const cartItems = ref<CartItem[]>([]);
const loading = ref(false);
const isDeleteDialogOpen = ref(false);
const itemToDelete = ref<CartItem | null>(null);

/* -----------------------------
 * API：取得購物車 (GET)
 * ----------------------------- */
const loadCart = async (): Promise<void> => {
  loading.value = true;
  try {
    const data = await $fetch<{ cartItems: CartItem[] }>('/api/cart', {
      method: 'GET',
      credentials: 'include',
    });
    cartItems.value = data.cartItems.sort((a, b) => {
      return a.id.localeCompare(b.id);
    });
  } catch (error: unknown) {
    if (error instanceof FetchError && error.statusCode === 401) {
      toast.error('請先登入');
    } else {
      toast.error('載入購物車失敗');
    }
  } finally {
    loading.value = false;
  }
};

/* -----------------------------
 * API：更新數量邏輯 (PUT)
 * ----------------------------- */
const updateQuantity = async (
  item: CartItem,
  newQuantity: number,
): Promise<void> => {
  // 如果新數量 <= 0，觸發 Alert Dialog 詢問是否刪除
  if (newQuantity <= 0) {
    itemToDelete.value = item;
    isDeleteDialogOpen.value = true;
    return;
  }

  const originalQuantity = item.quantity;

  try {
    item.quantity = newQuantity;

    await $fetch('/api/cart', {
      method: 'PUT',
      credentials: 'include',
      body: {
        cartItemId: item.id,
        quantity: newQuantity,
      },
    });
  } catch (error: unknown) {
    item.quantity = originalQuantity;

    if (error instanceof FetchError) {
      if (error.statusCode === 409) {
        toast.error('庫存不足');
      } else {
        toast.error('更新失敗');
      }
    }
  }
};

/* -----------------------------
 * 處理刪除確認 (Alert Dialog)
 * ----------------------------- */
const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  const itemId = itemToDelete.value.id;

  try {
    await $fetch('/api/cart', {
      method: 'PUT',
      credentials: 'include',
      body: {
        cartItemId: itemId,
        quantity: 0,
      },
    });

    cartItems.value = cartItems.value.filter((item) => item.id !== itemId);

    toast.success('商品已移除');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error('移除失敗');
    }
  } finally {
    isDeleteDialogOpen.value = false;
    itemToDelete.value = null;
  }
};

/* -----------------------------
 * 處理輸入框手動更改與驗證
 * ----------------------------- */
const handleInputChange = (item: CartItem, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = parseInt(input.value);

  if (isNaN(value)) {
    updateQuantity(item, 1);
  } else if (value < 1) {
    // 依需求：輸入小於 1 顯示錯誤訊息
    toast.error('輸入錯誤的值（數量必須大於或等於 1）');
    // 強制將輸入框顯示回復為目前的正確數量
    input.value = item.quantity.toString();
  } else {
    updateQuantity(item, value);
  }
};

/* -----------------------------
 * 計算總金額
 * ----------------------------- */
const totalAmount = computed<number>(() =>
  cartItems.value.reduce((total, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return total + price * item.quantity;
  }, 0),
);

onMounted(() => {
  loadCart();
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 px-10">
      <h1 class="text-3xl font-bold mb-6 mt-4">我的購物車</h1>

      <div class="border rounded-lg shadow-md overflow-hidden bg-white">
        <div
          class="grid grid-cols-[3.5fr_1fr_1fr_1.2fr_1fr_1fr] text-sm font-semibold text-gray-700 bg-gray-200 border-b"
        >
          <div class="p-3 text-center">商品明細</div>
          <div class="p-3 text-center border-l">單價</div>
          <div class="p-3 text-center border-l">數量</div>
          <div class="p-3 text-center border-l">小計</div>
          <div class="p-3 text-center border-l">庫存</div>
          <div class="p-3 text-center border-l">變更明細</div>
        </div>

        <div
          v-if="!loading && cartItems.length === 0"
          class="p-16 text-center text-gray-500 bg-white"
        >
          <p class="text-xl font-medium">無商品資料</p>
        </div>

        <div v-else>
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="grid grid-cols-[3.5fr_1fr_1fr_1.2fr_1fr_1fr] items-center border-b hover:bg-gray-50 transition-colors"
          >
            <div class="p-3 flex items-center">
              <img
                :src="
                  item.product.coverId
                    ? `/api/image/${item.product.coverId}`
                    : 'https://picsum.photos/200/200'
                "
                class="w-16 h-16 object-cover rounded mr-4 bg-gray-100"
              />
              <span class="font-medium text-sm text-gray-800 line-clamp-2">{{
                item.product.name
              }}</span>
            </div>

            <div class="p-3 text-center border-l text-gray-600">
              ${{
                (
                  item.product.discountPrice ?? item.product.price
                ).toLocaleString()
              }}
            </div>

            <div class="p-3 text-center border-l flex justify-center">
              <div
                class="flex items-center border rounded-md bg-white overflow-hidden"
              >
                <button
                  class="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                  @click="updateQuantity(item, item.quantity - 1)"
                >
                  -
                </button>
                <input
                  type="number"
                  :value="item.quantity"
                  class="w-10 text-center text-sm border-l border-r outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  @change="handleInputChange(item, $event)"
                />
                <button
                  class="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                  @click="updateQuantity(item, item.quantity + 1)"
                >
                  +
                </button>
              </div>
            </div>

            <div class="p-3 text-center border-l font-bold text-red-600">
              ${{
                (
                  (item.product.discountPrice ?? item.product.price) *
                  item.quantity
                ).toLocaleString()
              }}
            </div>

            <div
              class="p-3 text-center border-l text-sm"
              :class="
                item.product.quantity > 0 ? 'text-green-600' : 'text-red-500'
              "
            >
              {{ item.product.quantity > 0 ? '充足' : '缺貨' }}
            </div>

            <div class="p-3 text-center border-l">
              <button
                class="text-sm text-blue-500 hover:text-red-500 cursor-pointer font-medium"
                @click="updateQuantity(item, 0)"
              >
                移除
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="cartItems.length > 0"
        class="mt-8 flex justify-end items-center"
      >
        <div class="text-lg font-bold mr-4 text-gray-700">合計金額：</div>
        <div class="text-3xl font-extrabold text-red-700">
          ${{ totalAmount.toLocaleString() }}
        </div>
      </div>

      <div
        v-if="cartItems.length > 0"
        class="mt-4 flex justify-end mb-10"
      >
        <button
          class="bg-blue-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer"
          @click="go('/checkout')"
        >
          前往結帳
        </button>
      </div>
    </div>

    <AlertDialog
      :open="isDeleteDialogOpen"
      @update:open="isDeleteDialogOpen = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確定要移除商品嗎？</AlertDialogTitle>
          <AlertDialogDescription>
            您是否要將 【{{ itemToDelete?.product.name }}】
            從購物車中移除？此動作無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="itemToDelete = null"
            >取消</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
          >
            確認移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </NuxtLayout>
</template>
