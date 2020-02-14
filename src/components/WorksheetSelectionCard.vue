<template>
  <v-card>
    <v-card-title>
      Select a Worksheet
    </v-card-title>
    <v-card-text>
      <v-autocomplete
        v-model="worksheetName"
        :items="worksheetNames"
        placeholder="Worksheet Name"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        text
        color="primary"
        @click="$emit('worksheet-selected', worksheetName)"
      >
        Select
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: ["worksheetNames"],
  data: () => ({
    worksheetName: null
  })
};
</script>
