<template>
  <span
    class="name-link"
    @click.stop="navigateToEdit"
  >{{ value }}</span>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  value: string | null;
  collection: string;
}>();

// Directus provides the full item via inject in list context
const item = inject<Record<string, any>>('item', {});
const router = useRouter();

function navigateToEdit() {
  // Find the primary key — try common field names
  const pk = item?.id ?? item?.ID;
  if (pk) {
    router.push(`/content/${props.collection}/${pk}`);
  }
}
</script>

<style scoped>
.name-link {
  color: var(--theme--primary);
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.name-link:hover {
  color: var(--theme--primary-accent, var(--theme--primary));
  opacity: 0.85;
}
</style>
