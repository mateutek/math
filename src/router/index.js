import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../pages/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/mnozenie/1",
    name: "Home",
    component: Home,
  },
  {
    path: "/dzielenie/:level",
    name: "divide",
    component: () => import(/* webpackChunkName: "divide" */ "@/pages/Divide"),
  },
  {
    path: "/mnozenie/:level",
    name: "multiply",
    component: () =>
      import(/* webpackChunkName: "multiply" */ "@/pages/Multiply"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
