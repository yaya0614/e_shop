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

// 1. 定義型別與介面 (新增 vendorId 與 vendor 資訊)
interface CartProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  coverId?: string;
  vendorId: string; // 新增
  vendor?: { name: string }; // 新增
}

interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct;
}

// 2. 狀態管理
const cartItems = ref<CartItem[]>([]);
const loading = ref(false);
const isDeleteDialogOpen = ref(false);
const itemToDelete = ref<CartItem | null>(null);

/* -----------------------------
 * 新增：廠商分組計算屬性
 * ----------------------------- */
const groupedCart = computed(() => {
  const groups: Record<string, { vendorName: string; items: CartItem[] }> = {};
  cartItems.value.forEach((item) => {
    const vId = item.product.vendorId || 'unknown';
    if (!groups[vId]) {
      groups[vId] = {
        vendorName:
          item.product.vendor?.name || `廠商 (${vId.substring(0, 5)})`,
        items: [],
      };
    }
    groups[vId].items.push(item);
  });
  return groups;
});

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
 * API：更新數量邏輯 (PUT) - 邏輯保持不變
 * ----------------------------- */
const updateQuantity = async (
  item: CartItem,
  newQuantity: number,
): Promise<void> => {
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
 * 處理刪除確認 (Alert Dialog) - 邏輯保持不變
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
 * 處理輸入框手動更改與驗證 - 邏輯保持不變
 * ----------------------------- */
const handleInputChange = (item: CartItem, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = parseInt(input.value);
  if (isNaN(value)) {
    updateQuantity(item, 1);
  } else if (value < 1) {
    toast.error('輸入錯誤的值（數量必須大於或等於 1）');
    input.value = item.quantity.toString();
  } else {
    updateQuantity(item, value);
  }
};

onMounted(() => {
  loadCart();
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 px-10 pb-10">
      <h1 class="text-3xl font-bold mb-6 mt-4">我的購物車</h1>

      <div
        v-if="loading"
        class="p-16 text-center text-gray-500"
      >
        載入中...
      </div>

      <div
        v-else-if="cartItems.length === 0"
        class="p-16 text-center text-gray-500 bg-white border rounded-lg"
      >
        <p class="text-xl font-medium">無商品資料</p>
      </div>

      <div
        v-else
        class="space-y-10"
      >
        <div
          v-for="(group, vendorId) in groupedCart"
          :key="vendorId"
        >
          <div class="flex items-center gap-2 mb-3 ml-1">
            <div class="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h2 class="text-lg font-bold text-gray-700">
              {{ group.vendorName }}
            </h2>
          </div>

          <div class="border rounded-lg shadow-md bg-white">
            <div
              class="grid grid-cols-[4fr_1fr_1.2fr_1.2fr_1fr_1fr] text-sm font-semibold text-gray-700 bg-gray-200 border-b rounded-t-lg"
            >
              <div class="p-3 text-center">商品明細</div>
              <div class="p-3 text-center border-l">單價</div>
              <div class="p-3 text-center border-l">數量</div>
              <div class="p-3 text-center border-l">小計</div>
              <div class="p-3 text-center border-l">庫存</div>
              <div class="p-3 text-center border-l">變更明細</div>
            </div>

            <div
              v-for="item in group.items"
              :key="item.id"
              class="grid grid-cols-[4fr_1fr_1.2fr_1.2fr_1fr_1fr] items-center border-b last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div class="p-3 flex items-center">
                <img
                  :src="'https://picsum.photos/200/200'"
                  class="w-16 h-16 object-cover rounded mr-4 bg-gray-100 flex-shrink-0"
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

            <div
              class="p-4 bg-gray-50 flex justify-end items-center border-t rounded-b-lg"
            >
              <div class="mr-6 text-right">
                <span class="text-sm text-gray-500">該店合計：</span>
                <span class="text-2xl font-extrabold text-red-700">
                  ${{
                    group.items
                      .reduce(
                        (total, i) =>
                          total +
                          (i.product.discountPrice ?? i.product.price) *
                            i.quantity,
                        0,
                      )
                      .toLocaleString()
                  }}
                </span>
              </div>
              <button
                class="bg-blue-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer"
                @click="go(`/checkout?vendorId=${vendorId}`)"
              >
                前往結帳
              </button>
            </div>
          </div>
        </div>
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
            >確認移除</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </NuxtLayout>
</template>
