import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
  id: 'edit-icon',
  name: 'Edit Icon',
  icon: 'edit',
  description: 'Renders an edit icon button that navigates to the item edit drawer',
  component: DisplayComponent,
  options: null,
  types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
});
