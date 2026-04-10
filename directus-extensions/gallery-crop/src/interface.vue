<template>
  <div class="gallery-crop-interface">
    <!-- Existing images grid -->
    <div v-if="photos.length" ref="gridEl" class="gc-grid">
      <div v-for="uuid in photos" :key="uuid" class="gc-thumb-wrap">
        <img :src="thumbUrl(uuid)" class="gc-thumb" />
        <button
          class="gc-remove"
          type="button"
          title="Remove"
          @click="removePhoto(uuid)"
        >✕</button>
      </div>
    </div>

    <!-- Add button -->
    <button
      class="ci-btn ci-btn-secondary gc-add-btn"
      type="button"
      :disabled="disabled"
      @click="!disabled && fileInputEl?.click()"
    >
      <span class="material-icons" style="font-size:18px;vertical-align:-4px;margin-right:4px">add_photo_alternate</span>
      Add photo
    </button>

    <!-- Crop modal -->
    <Teleport to="body">
      <div v-if="showModal" class="ci-overlay">
        <div class="ci-modal" @click.stop>
          <div class="ci-modal-header">
            <span class="ci-modal-title">CROP PHOTO — {{ aspectRatioLabel }}</span>
            <span v-if="errorMsg" class="ci-error">{{ errorMsg }}</span>
          </div>
          <div class="ci-modal-body">
            <img
              ref="cropImgEl"
              :src="imgSrc"
              class="ci-source-img"
              @load="initCropper"
            />
          </div>
          <div class="ci-modal-footer">
            <div class="ci-zoom">
              <button class="ci-btn ci-btn-icon" type="button" @click="zoomIn">＋</button>
              <button class="ci-btn ci-btn-icon" type="button" @click="zoomOut">－</button>
              <button class="ci-btn ci-btn-icon" type="button" @click="resetCrop">⊡ Fit</button>
            </div>
            <div class="ci-actions">
              <button class="ci-btn ci-btn-outline-danger" type="button" @click="closeModal">✕ Cancel</button>
              <button
                class="ci-btn ci-btn-primary"
                type="button"
                :disabled="uploading || !cropperReady"
                @click="cropAndUpload"
              >{{ uploading ? 'Saving…' : '✓ Crop & Add' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Hidden file input -->
    <input
      ref="fileInputEl"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style="display:none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import Cropper from 'cropperjs';
import Sortable from 'sortablejs';
import 'cropperjs/dist/cropper.css';

const DIRECTUS_URL = 'http://localhost:8155';

const props = defineProps<{
  value: string[] | null;
  disabled?: boolean;
  aspectRatio?: string;
}>();

const emit = defineEmits<{
  (e: 'input', value: string[] | null): void;
}>();

const api = useApi();

// ── Computed photos list ──────────────────────────────────────────────────────

const photos = computed<string[]>(() => {
  const v = props.value;
  return Array.isArray(v) ? v.filter(Boolean) : [];
});

const aspectRatioLabel = computed(() => (props.aspectRatio ?? '3:2').replace(/[:/]/, ':'));

function getAspectRatioNumber(): number {
  const [w, h] = (props.aspectRatio ?? '3:2').split(/[:/]/).map(Number);
  return w / h;
}

function thumbUrl(uuid: string): string {
  return `${DIRECTUS_URL}/assets/${uuid}?width=160&height=107&fit=cover`;
}

// ── Remove ────────────────────────────────────────────────────────────────────

function removePhoto(uuid: string) {
  const next = photos.value.filter((u) => u !== uuid);
  emit('input', next.length ? next : null);
}

// ── SortableJS drag-to-reorder ────────────────────────────────────────────────

const gridEl = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

// We watch the grid element with a template ref callback via nextTick after mount
import { watch } from 'vue';

watch(gridEl, (el) => {
  if (sortable) {
    sortable.destroy();
    sortable = null;
  }
  if (el) {
    sortable = Sortable.create(el, {
      animation: 150,
      ghostClass: 'gc-ghost',
      onEnd(evt) {
        const newOrder = [...photos.value];
        const [moved] = newOrder.splice(evt.oldIndex!, 1);
        newOrder.splice(evt.newIndex!, 0, moved);
        emit('input', newOrder);
      },
    });
  }
});

onUnmounted(() => {
  sortable?.destroy();
});

// ── File input ────────────────────────────────────────────────────────────────

const fileInputEl = ref<HTMLInputElement | null>(null);
const showModal = ref(false);
const imgSrc = ref('');
const cropImgEl = ref<HTMLImageElement | null>(null);
const cropperReady = ref(false);
const uploading = ref(false);
const errorMsg = ref('');

let cropper: Cropper | null = null;

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    imgSrc.value = ev.target!.result as string;
    cropperReady.value = false;
    errorMsg.value = '';
    showModal.value = true;
  };
  reader.readAsDataURL(file);
}

function initCropper() {
  if (cropper) {
    cropper.destroy();
  }
  if (!cropImgEl.value) {
    errorMsg.value = 'Image element not found';
    return;
  }
  try {
    cropper = new Cropper(cropImgEl.value, {
      aspectRatio: getAspectRatioNumber(),
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      movable: true,
      zoomable: true,
      zoomOnWheel: true,
      wheelZoomRatio: 0.1,
      rotatable: false,
      scalable: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      minContainerHeight: 480,
      responsive: true,
      background: true,
      ready() {
        cropperReady.value = true;
      },
    });
  } catch (err: any) {
    errorMsg.value = `Cropper init failed: ${err?.message}`;
  }
}

function zoomIn() { cropper?.zoom(0.15); }
function zoomOut() { cropper?.zoom(-0.15); }
function resetCrop() { cropper?.reset(); }

function closeModal() {
  cropper?.destroy();
  cropper = null;
  showModal.value = false;
  imgSrc.value = '';
  cropperReady.value = false;
  uploading.value = false;
  errorMsg.value = '';
  if (fileInputEl.value) fileInputEl.value.value = '';
}

async function cropAndUpload() {
  if (!cropper || uploading.value) return;
  uploading.value = true;
  try {
    const canvas = cropper.getCroppedCanvas({ maxWidth: 3840, maxHeight: 3840, imageSmoothingQuality: 'high' });
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.82));
    const form = new FormData();
    form.append('file', blob, 'photo.jpg');
    const { data } = await api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const uuid = data.data.id;
    emit('input', [...photos.value, uuid]);
    closeModal();
  } catch (err) {
    console.error('[gallery-crop] Upload failed', err);
    uploading.value = false;
  }
}
</script>

<style scoped>
.gallery-crop-interface {
  width: 100%;
}
.gc-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.gc-thumb-wrap {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: grab;
}
.gc-thumb-wrap:active {
  cursor: grabbing;
}
.gc-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gc-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gc-ghost {
  opacity: 0.4;
}
.gc-add-btn {
  margin-top: 4px;
}

/* ── Modal ─────────────────────────────────────────────── */
.ci-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.ci-modal {
  background: #1e1e2e;
  border-radius: 8px;
  width: min(90vw, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ci-modal-header {
  padding: 12px 16px;
  background: #2a2a3e;
  display: flex;
  align-items: center;
  gap: 12px;
}
.ci-modal-title {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0f0;
  letter-spacing: 0.05em;
}
.ci-error {
  font-size: 12px;
  color: #ff6b6b;
}
.ci-modal-body {
  max-height: 60vh;
  overflow: hidden;
  background: #111;
}
.ci-source-img {
  display: block;
  max-width: 100%;
}
.ci-modal-footer {
  padding: 10px 16px;
  background: #2a2a3e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ci-zoom {
  display: flex;
  gap: 6px;
}
.ci-actions {
  display: flex;
  gap: 8px;
}

/* ── Buttons ───────────────────────────────────────────── */
.ci-btn {
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.ci-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ci-btn-primary {
  background: #6644ff;
  color: #fff;
}
.ci-btn-secondary {
  background: #3a3a50;
  color: #c0c0d8;
}
.ci-btn-outline-danger {
  background: transparent;
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
}
.ci-btn-icon {
  background: #3a3a50;
  color: #c0c0d8;
  padding: 4px 10px;
}
</style>
