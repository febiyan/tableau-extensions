# Tableau Extensions

A custom tableau extension made using Vue, Vuetify, and Echarts.

Why Vue? Modern Javascript framework that eases development, testing, and deployment. Vue, to me, is the most natural way for developers who started from simple HTML/Javascript to a framework Javascript. The framework is relatively lightweight and blazing fast in reactivity.

Like other frameworks, Vue supports routing, so we can host different custom visualisations in one application by routing the request to different URLs.

Vuetify is optional here. I am using it for layout purposes and the extra component it gives. I really like the Material Design components that it provides.


Why 

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
