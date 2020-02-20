# Tableau Extensions Server With Vue

![preview gif](docs/assets/preview.gif "Preview")


A custom Tableau Extensions API implementation with Vue, and Vuetify. This implementation is designed for developers to easily add new visualisation templates using different libraries. This is a small personal project during bench time in Teradata.

With Vue, you'll get easy-to-code, blazing fast reactivity. Vue also supports routing, so we can host different custom visualisations in one web application/code base by routing the extension request to different URLs. With Vuetify, you'll find it easy to create reactive visualisation with responsive or fluid layout. Vuetify also comes with lots of prebuilt Material Design components and animations which I like.

There are 3 visualisation libraries readily available in this repo, namely `echarts` (using `vue-echarts`), `google charts` and an open source sunburst charts. The libraries should provide diverse set of possible visualisations. However, should you want to add your own visualisation library, you can do so by installing a new one. 

See [here](https://madewithvuejs.com/blog/top-vue-js-chart-components) to see popular Vue chart libraries.


## Overview

Before continuing, if you don't know how Tableau Extensions API works, here is a picture that illustrates and overly-simplifies it:

![alt text](docs/assets/Slide6.jpeg "Image")

See more details on [Tableau Extensions API Github site](https://tableau.github.io/extensions-api/).

Currently, there are 3 visualisations set up:

* Sunburst - Path: Accepts `Path` string, e.g `[from, here, to, there]`, and the path `Count` field. The visualisation is served on the `http://<host>/sunburst-path` page, and the TREX file is available on `http://<host>/manifests/sunburst-path.trex`.
* Sankey - Path: Accepts the same fields as Sunburst - Path. The visualisation is served on the `http://<host>/sankey-path` page, and the TREX file is available on `http://<host>/manifests/sankey-path.trex`.
* Graph: Accepts `From` and `To` nodes, `Link Weight` and `Node Weight` fields. The visualisation is served on the `http://<host>/graph` page, and the TREX file is available on `http://<host>/manifests/graph.trex`.

## Adding New Visualisations

To add new visualisations, what you'll work on is the one on the Web Server side, and you'll also need to create a manifest file. Here is a picture of the tasks.

![](/docs/assets/Slide12.jpeg)


You don't need to take care of the handshake activities between Tableau and the web app. It has been taken care of by `App.vue`. You'll only need to focus on the data and visualisation.

To start, first, you will need to define your component manifest file. The file is stored under `/public/manifests`. There are other manifest files that you can copy and paste from.

Then you'll need to configure a Vue route in `/src/router/index.js`. See the source file and read [Vue's Router guide](https://router.vuejs.org/guide/#javascript) to learn how you can do that.

Next, create a Vue component to parse the data and display it in your selected visualisation library under `/src/modules`. This one requires coding. There are some visualisations that you can use as examples.


### What You Need to Do in The Component



* Implement the `async parseWorksheetData()` function in the component's `methods`
* Define the `expectedFields` in the component's `data`
* Import the visualisation library in the `<script></script>`
* Implement the HTML 

See the pre-made components for examples.


## Using The Visualisations

1. If you want to run locally, use `npm run serve`. If not, build the code with `npm run build` and serve it with any http server you want.
2. Download the manifest `*.trex` file from the previously run server, for the visualisation you need.
3. Create a dashboard and populate it with a worksheet.
4. Load the manifest file on the dashboard.

## Improvements / Known Issues

1. When parameters change, somehow the filtered data may not get reflected in the visualisation.
2. [IMPROVEMENT] Use Vue Slots to simplify HTML layouting.
3. [IMPROVEMENT] A way to configure the background color and the color scheme of the visualisations.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
