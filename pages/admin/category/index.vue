<script setup lang="ts">
import { toast } from 'vue-sonner';
import { ref } from 'vue';
import { FetchError } from 'ofetch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

definePageMeta({
  layout: 'admin',
});

interface SubCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

const {
  data: categoriesData,
  pending,
  error,
  refresh,
} = await useFetch<{ categories: Category[] }>('/api/admin/category', {
  method: 'GET',
  credentials: 'include',
});

const categories = ref<Category[]>(categoriesData.value?.categories || []);

const expandedCategories = ref<Set<string>>(new Set());

const showCreateCategoryDialog = ref(false);
const newCategoryName = ref('');
const creatingCategory = ref(false);

const showEditCategoryDialog = ref(false);
const editingCategory = ref<Category | null>(null);
const editCategoryName = ref('');
const updatingCategory = ref(false);

const showCreateSubCategoryDialog = ref(false);
const selectedCategoryForSubCategory = ref<Category | null>(null);
const newSubCategoryName = ref('');
const creatingSubCategory = ref(false);

const showEditSubCategoryDialog = ref(false);
const editingSubCategory = ref<SubCategory | null>(null);
const editingSubCategoryParent = ref<Category | null>(null);
const editSubCategoryName = ref('');
const updatingSubCategory = ref(false);

const deletingCategory = ref<string | null>(null);
const deletingSubCategory = ref<string | null>(null);

const toggleCategory = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
};

const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) {
    toast.error('請輸入分類名稱');
    return;
  }

  creatingCategory.value = true;
  try {
    await $fetch('/api/admin/category', {
      method: 'POST',
      credentials: 'include',
      body: {
        categoryName: newCategoryName.value,
      },
    });

    await refresh();
    categories.value = categoriesData.value?.categories || [];
    showCreateCategoryDialog.value = false;
    newCategoryName.value = '';
    toast.success('分類創建成功！');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`創建失敗：${error.message}`);
    }
  } finally {
    creatingCategory.value = false;
  }
};

const openEditCategoryDialog = (category: Category) => {
  editingCategory.value = category;
  editCategoryName.value = category.name;
  showEditCategoryDialog.value = true;
};

const handleUpdateCategory = async () => {
  if (!editCategoryName.value.trim() || !editingCategory.value) {
    toast.error('請輸入分類名稱');
    return;
  }

  updatingCategory.value = true;
  try {
    await $fetch('/api/admin/category', {
      method: 'PUT',
      credentials: 'include',
      body: {
        originCategoryId: editingCategory.value.id,
        categoryName: editCategoryName.value,
      },
    });

    await refresh();
    categories.value = categoriesData.value?.categories || [];
    showEditCategoryDialog.value = false;
    editingCategory.value = null;
    toast.success('分類更新成功！');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`更新失敗：${error.message}`);
    }
  } finally {
    updatingCategory.value = false;
  }
};

const handleDeleteCategory = async (category: Category) => {
  if (deletingCategory.value) return;

  if (
    !confirm(
      `確定要刪除分類「${category.name}」嗎？這將同時刪除其下所有子分類。此操作無法復原。`,
    )
  ) {
    return;
  }

  deletingCategory.value = category.id;
  try {
    await $fetch('/api/admin/category', {
      method: 'DELETE',
      credentials: 'include',
      body: {
        categoryId: category.id,
      },
    });

    categories.value = categories.value.filter((c) => c.id !== category.id);
    toast.success(`分類「${category.name}」已刪除`);
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`刪除失敗：${error.message}`);
    }
  } finally {
    deletingCategory.value = null;
  }
};

const openCreateSubCategoryDialog = (category: Category) => {
  selectedCategoryForSubCategory.value = category;
  newSubCategoryName.value = '';
  showCreateSubCategoryDialog.value = true;
};

const handleCreateSubCategory = async () => {
  if (
    !newSubCategoryName.value.trim() ||
    !selectedCategoryForSubCategory.value
  ) {
    toast.error('請輸入子分類名稱');
    return;
  }

  creatingSubCategory.value = true;
  try {
    await $fetch(
      `/api/admin/category/${selectedCategoryForSubCategory.value.id}/subcategory`,
      {
        method: 'POST',
        credentials: 'include',
        body: {
          subCategoryName: newSubCategoryName.value,
        },
      },
    );

    await refresh();
    categories.value = categoriesData.value?.categories || [];
    showCreateSubCategoryDialog.value = false;
    newSubCategoryName.value = '';
    toast.success('子分類創建成功！');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`創建失敗：${error.message}`);
    }
  } finally {
    creatingSubCategory.value = false;
  }
};

const openEditSubCategoryDialog = (
  subCategory: SubCategory,
  parentCategory: Category,
) => {
  editingSubCategory.value = subCategory;
  editingSubCategoryParent.value = parentCategory;
  editSubCategoryName.value = subCategory.name;
  showEditSubCategoryDialog.value = true;
};

const handleUpdateSubCategory = async () => {
  if (
    !editSubCategoryName.value.trim() ||
    !editingSubCategory.value ||
    !editingSubCategoryParent.value
  ) {
    toast.error('請輸入子分類名稱');
    return;
  }

  updatingSubCategory.value = true;
  try {
    await $fetch(
      `/api/admin/category/${editingSubCategoryParent.value.id}/subcategory`,
      {
        method: 'PUT',
        credentials: 'include',
        body: {
          originsubCategoryId: editingSubCategory.value.id,
          subCategoryName: editSubCategoryName.value,
        },
      },
    );

    await refresh();
    categories.value = categoriesData.value?.categories || [];
    showEditSubCategoryDialog.value = false;
    editingSubCategory.value = null;
    toast.success('子分類更新成功！');
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`更新失敗：${error.message}`);
    }
  } finally {
    updatingSubCategory.value = false;
  }
};

const handleDeleteSubCategory = async (
  subCategory: SubCategory,
  parentCategory: Category,
) => {
  if (deletingSubCategory.value) return;

  if (!confirm(`確定要刪除子分類「${subCategory.name}」嗎？此操作無法復原。`)) {
    return;
  }

  deletingSubCategory.value = subCategory.id;
  try {
    await $fetch(`/api/admin/category/${parentCategory.id}/subcategory`, {
      method: 'DELETE',
      credentials: 'include',
      body: {
        subCategoryId: subCategory.id,
      },
    });

    const category = categories.value.find((c) => c.id === parentCategory.id);
    if (category) {
      category.subCategories = category.subCategories.filter(
        (sc) => sc.id !== subCategory.id,
      );
    }
    toast.success(`子分類「${subCategory.name}」已刪除`);
  } catch (error) {
    if (error instanceof FetchError) {
      toast.error(`刪除失敗：${error.message}`);
    }
  } finally {
    deletingSubCategory.value = null;
  }
};

watch(categoriesData, (newData) => {
  if (newData?.categories) {
    categories.value = newData.categories;
  }
});

watch(showCreateCategoryDialog, (newVal) => {
  if (!newVal) {
    newCategoryName.value = '';
  }
});

watch(showEditCategoryDialog, (newVal) => {
  if (!newVal) {
    editingCategory.value = null;
    editCategoryName.value = '';
  }
});

watch(showCreateSubCategoryDialog, (newVal) => {
  if (!newVal) {
    newSubCategoryName.value = '';
    selectedCategoryForSubCategory.value = null;
  }
});

watch(showEditSubCategoryDialog, (newVal) => {
  if (!newVal) {
    editingSubCategory.value = null;
    editingSubCategoryParent.value = null;
    editSubCategoryName.value = '';
  }
});
</script>

<template>
  <div class="mx-auto px-4 py-8 flex flex-col overflow-hidden h-full w-full">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">分類管理</h1>
        <p class="mt-2 text-sm text-gray-600">管理商品分類與子分類</p>
      </div>
      <div class="flex gap-3">
        <Button
          :disabled="pending"
          variant="outline"
          @click="refresh"
        >
          <span v-if="pending">重新整理中...</span>
          <span
            v-else
            class="text-black"
            >重新整理</span
          >
        </Button>
        <Button @click="showCreateCategoryDialog = true"> ＋ 新增分類 </Button>
      </div>
    </div>

    <div class="overflow-y-auto flex flex-col flex-1 min-h-0">
      <div
        v-if="pending"
        class="flex items-center justify-center py-12"
      >
        <UiSpinner class="h-8 w-8" />
        <span class="ml-3 text-gray-600">載入中...</span>
      </div>

      <div
        v-else-if="error"
        class="rounded-lg border border-red-200 bg-red-50 p-6"
      >
        <div class="flex items-center">
          <span class="text-2xl">⚠️</span>
          <div class="ml-3">
            <h3 class="text-lg font-semibold text-red-800">載入失敗</h3>
            <p class="mt-1 text-sm text-red-600">
              {{ error.message || '無法載入分類列表' }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else-if="categories.length === 0"
        class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center"
      >
        <span class="text-6xl">📁</span>
        <h3 class="mt-4 text-lg font-semibold text-gray-900">暫無分類</h3>
        <p class="mt-2 text-sm text-gray-600">
          點擊上方「新增分類」按鈕開始創建分類
        </p>
      </div>

      <div
        v-else
        class="space-y-4 mb-12"
      >
        <div
          v-for="category in categories"
          :key="category.id"
          class="rounded-lg border-2 border-blue-200 bg-blue-50 p-5 transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <button
                  class="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-blue-200"
                  @click="toggleCategory(category.id)"
                >
                  <span
                    v-if="expandedCategories.has(category.id)"
                    class="text-lg"
                    >▼</span
                  >
                  <span
                    v-else
                    class="text-lg"
                    >▶</span
                  >
                </button>
                <h3 class="text-lg font-bold text-gray-900">
                  {{ category.name }}
                </h3>
                <span
                  class="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white"
                >
                  {{ category.subCategories.length }} 個子分類
                </span>
              </div>
            </div>
            <div class="ml-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                @click="openCreateSubCategoryDialog(category)"
              >
                ＋ 子分類
              </Button>
              <Button
                size="sm"
                variant="outline"
                @click="openEditCategoryDialog(category)"
              >
                編輯
              </Button>
              <Button
                :disabled="deletingCategory === category.id"
                size="sm"
                variant="destructive"
                @click="handleDeleteCategory(category)"
              >
                <span v-if="deletingCategory === category.id">刪除中...</span>
                <span v-else>刪除</span>
              </Button>
            </div>
          </div>

          <!-- SubCategories -->
          <div
            v-if="expandedCategories.has(category.id)"
            class="ml-11 mt-4 space-y-2"
          >
            <div
              v-if="category.subCategories.length === 0"
              class="rounded-lg border border-gray-300 bg-white p-4 text-center text-sm text-gray-500"
            >
              暫無子分類
            </div>
            <div
              v-for="subCategory in category.subCategories"
              :key="subCategory.id"
              class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 transition-all hover:shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">📌</span>
                <span class="font-medium text-gray-800">{{
                  subCategory.name
                }}</span>
              </div>
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="openEditSubCategoryDialog(subCategory, category)"
                >
                  編輯
                </Button>
                <Button
                  :disabled="deletingSubCategory === subCategory.id"
                  size="sm"
                  variant="destructive"
                  @click="handleDeleteSubCategory(subCategory, category)"
                >
                  <span v-if="deletingSubCategory === subCategory.id"
                    >刪除中...</span
                  >
                  <span v-else>刪除</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:open="showCreateCategoryDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增分類</DialogTitle>
          <DialogDescription>
            請輸入新的分類名稱（2-8個字元）
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="newCategoryName"
            maxlength="8"
            placeholder="分類名稱"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showCreateCategoryDialog = false"
          >
            取消
          </Button>
          <Button
            :disabled="creatingCategory || !newCategoryName.trim()"
            @click="handleCreateCategory"
          >
            <span v-if="creatingCategory">創建中...</span>
            <span v-else>創建</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showEditCategoryDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯分類</DialogTitle>
          <DialogDescription> 修改分類名稱（2-8個字元） </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="editCategoryName"
            maxlength="8"
            placeholder="分類名稱"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showEditCategoryDialog = false"
          >
            取消
          </Button>
          <Button
            :disabled="updatingCategory || !editCategoryName.trim()"
            @click="handleUpdateCategory"
          >
            <span v-if="updatingCategory">更新中...</span>
            <span v-else>更新</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showCreateSubCategoryDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增子分類</DialogTitle>
          <DialogDescription>
            在「{{
              selectedCategoryForSubCategory?.name
            }}」下新增子分類（2-8個字元）
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="newSubCategoryName"
            maxlength="8"
            placeholder="子分類名稱"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showCreateSubCategoryDialog = false"
          >
            取消
          </Button>
          <Button
            :disabled="creatingSubCategory || !newSubCategoryName.trim()"
            @click="handleCreateSubCategory"
          >
            <span v-if="creatingSubCategory">創建中...</span>
            <span v-else>創建</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showEditSubCategoryDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯子分類</DialogTitle>
          <DialogDescription> 修改子分類名稱（2-8個字元） </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="editSubCategoryName"
            maxlength="8"
            placeholder="子分類名稱"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            @click="showEditSubCategoryDialog = false"
          >
            取消
          </Button>
          <Button
            :disabled="updatingSubCategory || !editSubCategoryName.trim()"
            @click="handleUpdateSubCategory"
          >
            <span v-if="updatingSubCategory">更新中...</span>
            <span v-else>更新</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
