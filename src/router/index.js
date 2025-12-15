import { route } from "quasar/wrappers"
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router"
import routes from "./routes"

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Navigation guard to handle @ and . in URLs
  Router.beforeEach((to, from, next) => {
    // Check if the URL contains @ and has a .
    if (to.path.includes("@") && to.path.includes(".")) {
      // Implement logic based on your requirement
      // For example, redirecting to a specific route or handling as a non-file request
      // next({ path: '/someRoute' }); // Redirect to a specific route
      next() // Proceed with the navigation as usual
    } else {
      next() // Proceed with the navigation as usual
    }
  })

  return Router
})
