<template>
  <v-card>
    <v-toolbar dark flat short color="primary">
      <v-btn icon dark @click="$emit('settings-close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn dark text @click="$emit('settings-close')">Save</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text>
      <p>
        Visualisation configurations will go here if makes sense and required.
      </p>
      <p>
        The Sankey chart library that this extension is using is from
        <a
          href="https://github.com/David-Desmaisons/Vue.D3.sunburst"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/David-Desmaisons/Vue.D3.sunburst
        </a>
      </p>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "Settings"
};
</script>
