import { defineRouter } from "#q-app"
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router"
import routes from "./routes"

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.VUE_ROUTER_BASE),
  })

  // Navigation guard to handle @ and . in URLs
  Router.beforeEach((to) => {
    // Check if the URL contains @ and has a .
    if (to.path.includes("@") && to.path.includes(".")) {
      // Implement logic based on your requirement
      // For example, redirecting to a specific route or handling as a non-file request
      // return { path: '/someRoute' }; // Redirect to a specific route
      return true // Proceed with the navigation as usual
    }
    return true // Proceed with the navigation as usual
  })

  return Router
})
