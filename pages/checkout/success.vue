<script setup lang="ts">
const route = useRoute();
// 從網址參數取得由結帳頁傳過來的 orderId
const orderId = computed(() => route.query.orderId as string);

// 安全檢查：如果沒有 orderId，導回商店首頁
onMounted(() => {
  if (!orderId.value) {
    navigateTo('/shop');
  }
});
</script>

<template>
  <NuxtLayout name="header-all">
    <div
      class="flex flex-col items-center justify-center min-h-[60vh] w-full px-10 py-12"
    >
      <div
        class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <div class="i-lucide-check text-4xl text-green-600" />
      </div>

      <h1 class="text-3xl font-bold mb-2 text-center">訂單已成立！</h1>
      <p class="text-gray-500 mb-8 text-center">
        感謝您的購買，我們已收到您的訂單。
      </p>

      <div
        class="bg-white border rounded-xl p-6 w-full max-w-md shadow-sm mb-8"
      >
        <div class="flex justify-between items-center mb-4">
          <span
            class="text-gray-400 text-sm font-medium uppercase tracking-wider"
            >訂單編號</span
          >
          <span
            class="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-bold"
            >已確認</span
          >
        </div>
        <p
          class="text-xl font-mono font-bold text-gray-800 break-all text-center"
        >
          {{ orderId }}
        </p>
      </div>

      <div class="flex flex-col gap-3 w-full max-w-md">
        <Button
          class="w-full h-12 bg-gray-900 text-white hover:bg-black font-bold rounded-lg transition-transform active:scale-[0.98]"
          @click="navigateTo(`/order/${orderId}`)"
        >
          查看訂單詳情
        </Button>
        <Button
          variant="outline"
          class="w-full h-12 font-bold rounded-lg border-2"
          @click="navigateTo('/')"
        >
          繼續購物
        </Button>
      </div>
    </div>
  </NuxtLayout>
</template>
