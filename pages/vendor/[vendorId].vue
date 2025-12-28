<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { useRoute } from 'vue-router';

definePageMeta({
  layout: 'header-all',
});

// 定義明確介面
interface VendorDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ApiError {
  statusCode?: number;
  message?: string;
  data?: { message?: string };
}

const route = useRoute();
const vendorId = route.params.vendorId as string;
const loading = ref(true);
const vendorInfo = ref<VendorDetail | null>(null);

// 錯誤訊息映射邏輯
const mapVendorErrorToUserMessage = (
  e: ApiError,
): { title: string; description: string } => {
  let title = '進入後台失敗';
  let description = '無法連線到伺服器，請檢查您的網路。';

  if (e.statusCode) {
    title = `錯誤碼 ${e.statusCode}`;
    switch (e.statusCode) {
      case 401:
        description = '您尚未登入或登入已過期，請重新登入。';
        break;
      case 403:
        description = '您不是此商家的員工，無法進入管理後台。';
        break;
      case 404:
        description = '伺服器找不到該商家資料。';
        break;
      case 500:
        description = '伺服器發生未預期的錯誤，請稍後再試。';
        break;
      default:
        description =
          e.data?.message || e.message || '伺服器返回一個未知的錯誤。';
        break;
    }
  }
  return { title, description };
};

// 封裝詳細資訊以便循環渲染
const vendorDetails = computed(() => [
  { label: '聯絡電話', value: vendorInfo.value?.phone },
  { label: '電子郵件', value: vendorInfo.value?.email },
  { label: '商家地址', value: vendorInfo.value?.address },
]);

const dashboardNav = [
  { title: '商品管理', icon: '📦', desc: '上架、編輯或刪除圖書商品。' },
  { title: '訂單處理', icon: '📑', desc: '查看並管理顧客的購買訂單。' },
  { title: '銷售數據', icon: '📊', desc: '分析商家的營收與銷售趨勢。' },
];

const handleBack = () => navigateTo('/profile/overview');

const initVendorDashboard = async () => {
  loading.value = true;
  try {
    // 根據 README 說明，調用此 API 觸發 Token Exchange
    await $fetch<VendorDetail>(`/api/vendor/${vendorId}`, {
      credentials: 'include', // 確保包含 Cookie 以進行身分驗證
    });

    const data = await $fetch<VendorDetail>(`/api/vendor/${vendorId}/info`, {
      credentials: 'include', // 確保包含 Cookie 以進行身分驗證
    });

    vendorInfo.value = data;
    toast.success(`歡迎回來，${data.name} 管理員`);
  } catch (e: unknown) {
    const err = e as ApiError;
    const { title, description } = mapVendorErrorToUserMessage(err);

    toast.error(title, {
      description: description,
      duration: 5000,
    });

    // 驗證失敗則自動退回個人概覽頁面
    await handleBack();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initVendorDashboard();
});
</script>

<template>
  <div class="flex flex-col h-screen px-8 py-8 mb-2 overflow-y-scroll w-screen">
    <div class="flex items-center justify-between mb-8">
      <Button
        variant="ghost"
        @click="handleBack"
      >
        ← 返回個人檔案
      </Button>
    </div>

    <div
      v-if="loading"
      class="flex flex-col items-center py-20"
    >
      <Spinner class="w-10 h-10 mb-4" />
      <p class="text-muted-foreground animate-pulse">
        正在切換至商家後台並驗證權限...
      </p>
    </div>

    <div
      v-else-if="vendorInfo"
      class="space-y-6 animate-in fade-in"
    >
      <Card>
        <CardHeader>
          <CardTitle class="text-3xl">{{ vendorInfo.name }}</CardTitle>
          <p class="text-sm text-muted-foreground">商家 ID: {{ vendorId }}</p>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div
              v-for="item in vendorDetails"
              :key="item.label"
              class="p-4 bg-secondary/30 rounded-lg"
            >
              <p class="text-xs text-muted-foreground mb-1">{{ item.label }}</p>
              <p class="font-medium text-sm">{{ item.value || '未提供' }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          v-for="nav in dashboardNav"
          :key="nav.title"
          class="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <CardTitle class="text-lg"
              >{{ nav.icon }} {{ nav.title }}</CardTitle
            >
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{{ nav.desc }}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
