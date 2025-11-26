<script setup lang="ts">
import headerBar from '~/components/header-bar.vue';
import { SearchIcon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';

const category_name = [
  { id: 1, title: '商業理財' },
  { id: 2, title: '心理勵志' },
  { id: 3, title: '文學故事' },
  { id: 4, title: '人文社會' },
  { id: 5, title: '醫療保健' },
  { id: 6, title: '生活風格' },
  { id: 7, title: '宗教命理' },
];
</script>

<template>
  <div class="flex flex-col h-screen w-screen">
    <headerBar />
    <div class="flex flex-row justify-between w-full mt-4">
      <p class="text-muted-foreground text-4xl leading-tight ml-10 flex-1"></p>
      <ButtonGroup class="mr-10 flex-1 text-3xl">
        <Input placeholder="Search..." />
        <Button
          variant="outline"
          aria-label="Search"
        >
          <SearchIcon />
        </Button>
      </ButtonGroup>
    </div>
    <div class="flex justify-center-safe w-full mt-2 mb-2">
      <NavigationMenu :viewport="false">
        <div class="gap 50 z-4">
          <NavigationMenuList class="gap-12">
            <div
              v-for="value in category_name"
              :key="value.id"
            >
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {{ value.title }}</NavigationMenuTrigger
                >
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </div></NavigationMenu
      >
    </div>
    <slot />
  </div>
</template>
