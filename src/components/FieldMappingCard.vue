<template>
  <v-card>
    <v-card-title>
      <v-btn icon small @click="$emit('fields-mapping-canceled')" class="mr-2">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      Map the Fields
    </v-card-title>
    <v-card-text>
      <v-autocomplete
        v-for="(field, index) in mappedFields"
        v-model="mappedFields[index].index"
        :key="field.name"
        :items="getSuitableFields(field)"
        :label="field.name + ' (' + field.type + ')'"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" text @click="$emit('fields-mapped', mappedFields)">
        Confirm
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    availableFields: {
      type: Array,
      default: () => [] // In Vue, default Array values need to be returned from a function
    },
    expectedFields: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    mappedFields: []
  }),
  methods: {
    getSuitableFields(expectedField) {
      return this.availableFields
        .filter(availableField => availableField.dataType == expectedField.type)
        .map(field => ({
          text: field.fieldName,
          value: field.index
        }));
    }
  },
  computed: {
    fieldSelections() {
      return this.availableFields.map(field => ({
        text: field.fieldName,
        value: field.index
      }));
    }
  },
  watch: {
    expectedFields: {
      immediate: true,
      handler: function(newExpectedFields) {
        this.mappedFields.slice(0);
        newExpectedFields.forEach(field => {
          this.mappedFields.push({
            name: field.name,
            type: field.type,
            index: null
          });
        });
      }
    }
  }
};
</script>
