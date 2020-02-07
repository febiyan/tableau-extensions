import Vue from "vue";
import VueRouter from "vue-router";

import Sunburst from "@/modules/sunburst";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "sunburst",
    component: Sunburst
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
