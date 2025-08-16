<script setup lang="ts">

</script>

<template>
  <div class="layout-menu">
    <app-menu-item
      v-for="(item, index) in layoutState.menuItems"
      :key="index"
      :item="item"
      :index="index"
      :root="true"
    />
  </div>
</template>
