<script setup lang="ts">
const router = useRouter();

function go(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="flex flex-row sticky top-0 z-10 bg-gray-300 py-2 w-full">
    <div class="ml-10">
      <Button
        class="text-3xl"
        variant="link"
        @click="go('/home')"
        >閱森書店</Button
      >
    </div>

    <div class="flex ml-auto mr-10 space-x-2">
      <Button
        variant="link"
        @click="go('/auth/login')"
        >登入</Button
      >
      <Button
        variant="link"
        @click="go('/auth/register')"
        >註冊</Button
      >
      <Button
        variant="link"
        @click="go('/coupon')"
        >折價券</Button
      >
      <Button
        variant="link"
        @click="go('/member')"
        >會員中心</Button
      >
      <Button
        variant="link"
        @click="go('/shop')"
        >購物中心</Button
      >
    </div>
  </div>
</template>
