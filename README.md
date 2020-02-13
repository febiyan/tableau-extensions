# Tableau Extensions

A custom tableau extension made using Vue, and Vuetify. This is designed for developers to easily add new visualisation templates using different libraries.
With Vue and Vuetify, it will also be easy for them to create reactive visualisation with responsive or fluid layout.

Why Vue? Modern Javascript framework that eases development, testing, and deployment. Vue, to me, is the most natural way for developers who started from simple HTML/Javascript to a framework Javascript. The framework is relatively lightweight and blazing fast in reactivity. Like other frameworks, Vue supports routing, so we can host different custom visualisations in one application by routing the request to different URLs.

Why Vuetify? Well, Vuetify is optional here. I am using it for layout purposes and the extra component it gives. I really like the Material Design components that it provides.

There are a few visualisation libraries readily available in this repo, namely `echarts` (using `vue-echarts`). Those libraries should provide diverse set of possible visualisations. However, should you want to add your own visualisation, you can do so by installing a new one. 



## Overview

Tableau Extensions provide a way to send data to an web page. The web page can run on a local server or on a remote web server. 

## Starting Up


How?

First, 


* Change color theme: `src/plugins/vuetify.js`

* How to add a new visualisation:

* * Create a folder under `modules` with the following structure

viz-name/data-format like `sunburst/path`

¬

data transformation

* * Create unit tests for (1) data transformation


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
