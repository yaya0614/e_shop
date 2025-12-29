<script setup lang="ts">
import { toast } from 'vue-sonner';
import { computed, ref } from 'vue';
import ChartModel from '~/components/chart-model.vue';
import OrderModel from '~/components/order-model.vue';

definePageMeta({
  layout: 'vendor-bar',
});

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

const {
  params: { vendorId },
} = useRoute('vendor-vendorId');

const selectedMonth = ref<string>('');
const loading = ref(true);
const vendorInfo = ref<VendorDetail | null>(null);
const router = useRouter();

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

const initVendorDashboard = async () => {
  loading.value = true;
  try {
    await $fetch<VendorDetail>(`/api/vendor/${vendorId}`, {
      credentials: 'include',
    });

    const data = await $fetch<VendorDetail>(`/api/vendor/${vendorId}/info`, {
      credentials: 'include',
    });

    vendorInfo.value = data;
  } catch (e: unknown) {
    const err = e as ApiError;
    const { title, description } = mapVendorErrorToUserMessage(err);

    toast.error(title, {
      description: description,
      duration: 5000,
    });
    router.push('/user/profile/overview');
    navigateTo('/user/profile/overview');
  } finally {
    loading.value = false;
  }
};

const exportReport = () => {
  if (!selectedMonth.value) {
    alert('請選擇月份');
    return;
  }
  const url = `/api/vendor/${vendorId}/revenue?specificMonth=${selectedMonth.value}`;
  window.open(url, '_blank');
};

export interface PreviewOrder {
  orderId: string;
  price: number;
  status: 'RECEIVED' | 'PROCESSING' | 'TRANSPORT' | 'FINISH' | 'CANCELED';
  userName: string;
  products: {
    productId: string;
    quantity: number;
  }[];
}

export interface ApiMonthStat {
  month: string;
  totalPrice: number;
}

export interface VendorDashboardResponse {
  previewOrders: PreviewOrder[];
  monthPrice: ApiMonthStat[];
}

export interface YearChartPoint {
  date: Date;
  value: number;
}

const MONTH_INDEX_MAP: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function mapMonthStatsToChart(
  stats: ApiMonthStat[],
  year = new Date().getFullYear(),
): YearChartPoint[] {
  if (!stats || stats.length === 0) return [];
  return stats.map((item) => ({
    date: new Date(year, MONTH_INDEX_MAP[item.month]),
    value: item.totalPrice ?? 0,
  }));
}

const { data: dashboard } = await useFetch<VendorDashboardResponse>(
  () => `/api/vendor/${vendorId}/dashboard`,
  {
    method: 'GET',
    credentials: 'include',
    lazy: true,
    default: () => null,
  },
);

const chartData = computed<YearChartPoint[]>(() => {
  if (!dashboard.value) return [];
  return mapMonthStatsToChart(dashboard.value.monthPrice);
});

const previewOrders = computed(() => {
  return dashboard.value?.previewOrders ?? [];
});

onMounted(() => {
  initVendorDashboard();
});
</script>

<template>
  <div class="flex flex-col p-8 flex-1 w-full">
    <h1 class="font-semibold mb-6 text-2xl">Dashboard</h1>
    <div class="flex flex-col space-y-4 min-h-0 overflow-y-scroll">
      <div class="flex flex-row gap-6 w-full">
        <div class="flex flex-col basis-4/5">
          <div class="basis-4/5">
            <div class="w-full aspect-video">
              <ClientOnly>
                <ChartModel
                  class="w-full h-full"
                  :data="chartData"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
        <div
          class="basis-1/5 flex flex-col justify-center gap-4 border rounded-lg p-6 bg-white"
        >
          <div class="flex flex-1 flex-col py-4 gap-2">
            <p class="text-2xl text-gray-700">{{ vendorInfo?.name }}</p>
            <p class="text-gray-700">{{ vendorInfo?.address }}</p>
            <p class="text-gray-700">{{ vendorInfo?.phone }}</p>
            <p class="text-gray-700">{{ vendorInfo?.email }}</p>
          </div>

          <div class="text-sm font-medium text-gray-700">指定報表時間</div>

          <input
            v-model="selectedMonth"
            type="month"
            class="border rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          <button
            :disabled="!selectedMonth"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition"
            @click="exportReport"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16"
              />
            </svg>

            匯出報表
          </button>
        </div>
      </div>

      <h1 class="text-xl font-semibold mt-10 mb-4">近期訂單</h1>

      <div class="flex w-full flex-col">
        <OrderModel
          class="w-full"
          :vendor-id="vendorId"
          :orders="previewOrders"
        />
      </div>
    </div>
  </div>
</template>
