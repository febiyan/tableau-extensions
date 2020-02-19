import Vue from "vue";
import VueRouter from "vue-router";

import SunburstPath from "@/modules/sunburst/path";
import SankeyPath from "@/modules/sankey/path";
import Graph from "@/modules/graph";

Vue.use(VueRouter);

const routes = [
  {
    path: "/sunburst-path",
    name: "sunburst-path",
    component: SunburstPath
  },
  {
    path: "/sankey-path",
    name: "sankey-path",
    component: SankeyPath
  },
  {
    path: "/graph",
    name: "graph",
    component: Graph
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
