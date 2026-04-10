<template>
  <v-icon
    name="edit"
    small
    clickable
    title="Edit"
    @click.stop="navigateToEdit"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps<{
  value: string;
  collection: string;
}>();

const router = useRouter();

function navigateToEdit() {
  router.push(`/content/${props.collection}/${props.value}`);
}
</script>

<style scoped>
:deep(.v-icon) {
  color: var(--theme--foreground-subdued);
  transition: color 0.15s;
}
:deep(.v-icon:hover) {
  color: var(--theme--primary);
}
</style>
