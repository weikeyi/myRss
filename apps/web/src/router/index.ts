import { createRouter, createWebHistory } from "vue-router";

import BootstrapPage from "../pages/BootstrapPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "bootstrap",
      component: BootstrapPage
    }
  ]
});
