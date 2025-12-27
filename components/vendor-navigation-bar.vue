<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

interface MenuItem {
  label: string;
  path?: string;

  danger?: boolean;
}

const router = useRouter();
const route = useRoute();

const mainMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/vendor' },
  { label: '商品', path: '/vendor/product' },
  { label: '建立商品', path: '/vendor/inventory' },
  { label: '訂單', path: '/vendor/order' },
];

const bottomMenu: MenuItem[] = [
  {
    label: 'Logout',
    danger: true,
  },
];

const isActive = (path?: string): boolean => {
  if (!path) return false;
  return route.path === path || route.path.startsWith(path + '/vendor');
};
</script>
<template>
  <aside class="w-64 h-screen bg-white border-r flex flex-col justify-between">
    <nav class="px-3 py-4 space-y-1">
      <button
        v-for="item in mainMenu"
        :key="item.label"
        type="button"
        class="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition text-left text-gray-600 hover:bg-green-50 hover:text-green-600"
        :class="{
          'bg-green-100 text-green-600 font-medium': isActive(item.path),
        }"
        @click="router.push(item.path!)"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- Bottom menu -->
    <div class="px-3 pb-4 space-y-1">
      <button
        v-for="item in bottomMenu"
        :key="item.label"
        type="button"
        class="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm text-left transition"
        :class="[
          item.danger
            ? 'text-red-500 hover:bg-red-50'
            : 'text-gray-600 hover:bg-green-50 hover:text-green-600',
          isActive(item.path) ? 'bg-green-100 text-green-600 font-medium' : '',
        ]"
        @click="router.push(item.path!)"
      >
        <span>{{ item.label }}</span>
      </button>
    </div>
  </aside>
</template>
