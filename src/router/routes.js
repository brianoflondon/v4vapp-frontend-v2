const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      { path: "/lnd", component: () => import("pages/LightningPage.vue") },
      { path: "/status", component: () => import("pages/StatusPage.vue") },
      {
        path: "/selectdemo",
        component: () => import("pages/HiveSelectDemoPage.vue"),
      },
      {
        path: "/selectdemo2",
        component: () => import("pages/HiveSelectDemoPage2.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
]

export default routes
