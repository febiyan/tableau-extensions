import Vue from "vue";
import VueRouter from "vue-router";

import Sunburst from "@/modules/sunburst/default";
import SunburstPath from "@/modules/sunburst/path";

Vue.use(VueRouter);

const routes = [
  {
    path: "/sunburst",
    name: "sunburst",
    component: Sunburst
  },
  {
    path: "/sunburst-path",
    name: "sunburst-path",
    component: SunburstPath
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
