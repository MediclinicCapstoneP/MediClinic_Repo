<template>
  <div class="card">
    <Menubar :model="items" />
  </div>
</template>

<script>
import Menubar from 'primevue/menubar';
export default {
  components: {
    Menubar
  },
  data() {
    return {
      items: [
        {
          label: 'Home',
          icon: 'pi pi-home',
          routerLink: '/' // 👈 this navigates to "/"
        },
        {
          label: 'Features',
          icon: 'pi pi-star',
          routerLink: '/features' // 👈 make sure this route exists
        },
        {
          label: 'Projects',
          icon: 'pi pi-search',
          items: [
            {
              label: 'Components',
              icon: 'pi pi-bolt',
              routerLink: '/projects/components'
            },
            {
              label: 'Blocks',
              icon: 'pi pi-server',
              routerLink: '/projects/blocks'
            },
            {
              label: 'UI Kit',
              icon: 'pi pi-pencil',
              routerLink: '/projects/uikit'
            },
            {
              label: 'Templates',
              icon: 'pi pi-palette',
              items: [
                {
                  label: 'Apollo',
                  icon: 'pi pi-palette',
                  routerLink: '/projects/templates/apollo'
                },
                {
                  label: 'Ultima',
                  icon: 'pi pi-palette',
                  routerLink: '/projects/templates/ultima'
                }
              ]
            }
          ]
        },
        {
          label: 'Contact',
          icon: 'pi pi-envelope',
          routerLink: '/contact'
        }
      ]
    };
  }
};
</script>
