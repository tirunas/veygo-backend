import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'gallery-crop',
  name: 'Gallery (Crop on Upload)',
  icon: 'photo_library',
  description: 'Photo gallery — each upload goes through the crop dialog',
  component: InterfaceComponent,
  options: [
    {
      field: 'aspectRatio',
      name: 'Aspect Ratio',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '3:2  — Landscape', value: '3:2' },
            { text: '1:1  — Square',    value: '1:1' },
            { text: '16:9 — Wide',      value: '16:9' },
            { text: '4:3  — Standard',  value: '4:3' },
          ],
        },
      },
      schema: { default_value: '3:2' },
    },
  ],
  types: ['json'],
  localTypes: ['standard'],
});
