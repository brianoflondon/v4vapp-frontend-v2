const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/LightningPage.vue") },
      {
        path: "@:hiveAccTo([a-z0-9-.]+)", // Allow any character including dots after '@'
        component: () => import("pages/HiveAccountPage.vue"),
      },
      { path: "/lnd", component: () => import("pages/LightningPage.vue") },
      { path: "/hive", component: () => import("pages/HivePage.vue") },

      {
        path: "/pos/sales/@:hiveAccTo(.*)", // Allow any character including dots after '@'
        component: () => import("pages/POSPage.vue"),
      },
      {
        path: "/pos/history/@:hiveAccTo(.*)", // Allow any character including dots after '@'
        component: () => import("pages/POSPage.vue"),
      },
      {
        path: "/pos/currency/@:hiveAccTo(.*)", // Allow any character including dots after '@'
        component: () => import("pages/POSPage.vue"),
      },
      { path: "/pos", component: () => import("pages/POSPage.vue") },
      { path: "/pos/sales", component: () => import("pages/POSPage.vue") },
      { path: "/pos/history", component: () => import("pages/POSPage.vue") },
      { path: "/pos/currency", component: () => import("pages/POSPage.vue") },
      {
        path: "/pos/@:hiveAccTo(.*)", // Allow any character including dots after '@'
        redirect: (to) => {
          // the function receives the target route as the argument
          // we return a redirect path here
          return "/pos/sales/@" + to.params.hiveAccTo
        },
      },

      // {
      //   path: "/pos/@:hiveAccTo(.*)", // Allow any character including dots after '@'
      //   component: () => import("pages/POSPage.vue"),
      // },
      // { path: "/pos", component: () => import("pages/POSPage.vue") },
      // { path: "/pos/sales", component: () => import("pages/POSPage.vue") },
      // { path: "/pos/history", component: () => import("pages/POSPage.vue") },
      // { path: "/pos/currency", component: () => import("pages/POSPage.vue") },
      { path: "/index", component: () => import("pages/IndexPage.vue") },
      { path: "/vote", component: () => import("pages/VoteNow.vue") },
      { path: "/status", component: () => import("pages/StatusPage.vue") },
      { path: "/transfer", component: () => import("pages/HiveTransfer.vue") },
      { path: "/alby", component: () => import("pages/AlbyPage.vue") },
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
