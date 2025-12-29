<script setup lang="ts">
import { useUser } from '~/lib/useUser';
import { useVendor, type VendorInfo } from '~/lib/useVendor';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Alert } from '~/components/ui/alert';
import { Spinner } from '~/components/ui/spinner';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'header-all',
});

const router = useRouter();
const { userProfile, isLoading, fetchUserProfile } = useUser();
const {
  vendors,
  loading: vendorLoading,
  fetchVendors,
  createVendor,
} = useVendor();

const activeView = ref<'none' | 'create' | 'apply'>('none');

const foundVendor = ref<VendorInfo | null>(null);
const newVendor = ref({ name: '', phone: '', email: '', address: '' });

// 💡 狀態映射邏輯 (根據 MiiiYang 的要求)
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: '可用',
    PENDING: '等待審查',
    INACTIVE: '不可用',
  };
  return map[status] || status;
};

const getStatusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'default';
  if (status === 'PENDING') return 'outline';
  return 'destructive';
};

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(newVendor.value.email);
});

const isFormValid = computed(() => {
  const { name, phone, address } = newVendor.value;
  return (
    name.trim() !== '' &&
    phone.trim() !== '' &&
    isEmailValid.value &&
    address.trim() !== ''
  );
});

const profileItems = computed(() => [
  { label: '名稱', value: userProfile.value.name || '未設定' },
  { label: 'Email', value: userProfile.value.email },
]);

const toggleView = (view: 'create') => {
  activeView.value = activeView.value === view ? 'none' : view;
  foundVendor.value = null;
};

const handleCreate = async () => {
  if (!isFormValid.value) return;
  const ok = await createVendor(newVendor.value);
  if (ok) {
    activeView.value = 'none';
    newVendor.value = { name: '', phone: '', email: '', address: '' };
    await fetchVendors();
  }
};

const enterDashboard = (id: string) => {
  router.push(`/vendor/${id}`);
};

onMounted(() => {
  Promise.all([fetchUserProfile(), fetchVendors()]);
});
</script>

<template>
  <div
    class="flex flex-col h-screen px-8 py-8 mb-2 overflow-y-scroll w-screen space-y-4"
  >
    <Card>
      <CardHeader>
        <CardTitle>👤 個人檔案概覽</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          v-if="isLoading"
          class="flex justify-center py-6"
        >
          <Spinner />
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div
            v-for="item in profileItems"
            :key="item.label"
            class="space-y-1"
          >
            <span class="text-sm text-muted-foreground">{{ item.label }}</span>
            <p class="font-medium">{{ item.value }}</p>
          </div>
          <div class="md:col-span-2 pt-4 border-t mt-2">
            <NuxtLink
              to="/profile/edit"
              class="text-blue-600 hover:underline text-sm"
            >
              編輯資料 →
            </NuxtLink>
          </div>
        </div>
      </CardContent>
    </Card>

    <section class="p-8 border border-gray-200 rounded-xl shadow-lg bg-white">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🏪 我的商家
        </h2>
        <div class="flex gap-2">
          <Button
            size="sm"
            @click="toggleView('create')"
          >
            {{ activeView === 'create' ? '取消' : '+ 註冊新商家' }}
          </Button>
        </div>
      </div>

      <transition name="fade">
        <div
          v-if="activeView === 'create'"
          class="mb-8 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300"
        >
          <h3 class="font-bold mb-4 text-gray-800">填寫新商家註冊資訊</h3>
          <div class="grid grid-cols-1 gap-5">
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1"
                >商家名稱 <span class="text-red-500">*</span></label
              >
              <Input
                v-model="newVendor.name"
                placeholder="請輸入商家正式名稱"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1"
                >聯絡電話 <span class="text-red-500">*</span></label
              >
              <Input
                v-model="newVendor.phone"
                placeholder="例如：0912345678"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1"
                >商家 Email <span class="text-red-500">*</span></label
              >
              <Input
                v-model="newVendor.email"
                type="email"
                placeholder="例如：contact@shop.com"
              />
              <p
                v-if="newVendor.email && !isEmailValid"
                class="text-xs text-red-500"
              >
                請輸入有效的 Email 格式
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1"
                >商家地址 <span class="text-red-500">*</span></label
              >
              <textarea
                v-model="newVendor.address"
                placeholder="請輸入商家的完整地址"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows="3"
              ></textarea>
            </div>
            <div class="pt-2">
              <Button
                class="w-full"
                :disabled="vendorLoading || !isFormValid"
                @click="handleCreate"
              >
                {{ vendorLoading ? '處理中...' : '確認建立商家' }}
              </Button>
              <p
                v-if="!isFormValid"
                class="text-[10px] text-center mt-2 text-gray-400"
              >
                請填寫所有必填欄位並確保 Email 格式正確
              </p>
            </div>
          </div>
        </div>
      </transition>

      <div
        v-if="vendorLoading && !vendors.length"
        class="text-center py-4"
      >
        <Spinner />
      </div>
      <Alert
        v-else-if="vendors.length === 0"
        title="無管理商家"
        >您目前沒有管理任何商家。</Alert
      >
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="v in vendors as any[]"
          :key="v.id"
          class="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 group transition-all"
        >
          <div>
            <h4 class="font-bold text-gray-800">{{ v.name }}</h4>
            <div
              class="flex flex-wrap gap-2 text-xs mt-1 text-muted-foreground uppercase items-center"
            >
              <Badge variant="secondary">{{ v.role }}</Badge>
              <Badge :variant="getStatusVariant(v.status)">
                {{ getStatusText(v.status) }}
              </Badge>
              <span>{{ v.email }}</span>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-100">
            <strong class="block text-sm font-medium mb-2 text-gray-700"
              >付款方式:</strong
            >
            <div
              class="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 group hover:border-blue-400 transition duration-200"
            >
              <div class="flex items-center space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-gray-400 group-hover:text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span class="text-sm font-medium text-gray-600"
                  >管理已儲存的卡片</span
                >
              </div>

              <NuxtLink
                to="/user/payment"
                class="text-sm text-blue-600 font-bold hover:underline"
              >
                前往管理 →
              </NuxtLink>
            </div>
          </div>

          <NuxtLink
            to="/user/profile/edit"
            class="mt-6 block text-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
          >
             ✏️ 編輯基本資料
          </NuxtLink>
          <Button
            variant="ghost"
            size="sm"
            :disabled="v.status !== 'ACTIVE'"
            class="opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            @click="enterDashboard(v.id)"
          >
           
            進入後台
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
