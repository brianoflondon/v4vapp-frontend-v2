const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/LightningPage.vue") },
      { path: "/lnd", component: () => import("pages/LightningPage.vue") },
      { path: "/hive", component: () => import("pages/HivePage.vue") },
      {
        path: "/pos/@:hiveAccTo(.*)", // Allow any character including dots after '@'
        component: () => import("pages/POSPage.vue"),
      },
      { path: "/pos", component: () => import("pages/POSPage.vue") },
      { path: "/index", component: () => import("pages/IndexPage.vue") },
      { path: "/vote", component: () => import("pages/VoteNow.vue") },
      { path: "/status", component: () => import("pages/StatusPage.vue") },
      { path: "/transfer", component: () => import("pages/HiveTransfer.vue") },
      {
        path: "/selectdemo",
        component: () => import("pages/demo/HiveSelectDemoPage.vue"),
      },
      {
        path: "/selectdemo2",
        component: () => import("pages/demo/HiveSelectDemoPage2.vue"),
      },
      {
        path: "/qrdemo",
        component: () => import("pages/demo/QRDemo.vue"),
      },
      {
        path: "/backgrounds",
        component: () => import("pages/demo/CreditcardBackgrounds.vue"),
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
