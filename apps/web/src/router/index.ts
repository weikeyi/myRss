import { createRouter, createWebHistory } from "vue-router";

import ArticleDetailPage from "../pages/ArticleDetailPage.vue";
import ArticlesPage from "../pages/ArticlesPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/articles"
    },
    {
      path: "/articles",
      name: "articles",
      component: ArticlesPage
    },
    {
      path: "/articles/:articleId",
      name: "article-detail",
      component: ArticleDetailPage,
      props: false
    }
  ]
});
