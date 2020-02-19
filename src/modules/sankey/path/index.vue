<template>
  <v-container
    fluid
    class="d-flex flex-column align-stretch"
    style="height: 100%;"
  >
    <v-slide-x-transition>
      <!-- This will display once the visualisation data preparation is complete -->
      <v-row v-if="status === 'COMPLETED'" class="flex-grow-1 flex-shrink-0">
        <v-col>
          <GChart
            style="height: 95%"
            :settings="gChartPackages"
            type="Sankey"
            :data="chartData"
          />
          <v-btn
            fixed
            dark
            bottom
            primary
            right
            x-small
            fab
            @click="isDialogVisible = true"
          >
            <v-icon>mdi-cogs</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-row
        v-else-if="status === 'LOADING'"
        class="align-center justify-center"
      >
        <v-overlay>
          <v-progress-circular indeterminate size="64" />
        </v-overlay>
      </v-row>
      <!-- This will display if we need user inputs -->
      <v-row
        v-else-if="status === 'USER_PENDING'"
        class="align-center justify-center"
      >
        <v-col cols="12" sm="6">
          <FieldMappingCard
            :expectedFields="expectedFields"
            :availableFields="availableFields"
            @fields-mapped="onFieldsMapped"
            @fields-mapping-canceled="onFieldsMappingCanceled"
          />
        </v-col>
      </v-row>
      <!-- Error messages will go in the row below for developer debugging purposes -->
      <!-- To get your messages in the log, append logging messages to logMessages, like, 
      `this.logMessages.push("This line")` or `this.logMessages.push(someVariable)` -->
      <v-row v-else-if="status === 'ERROR'">
        <v-col>
          <v-card></v-card>
          <h2>Error Encountered</h2>
          <p class="caption">
            {{ statusMessage }}
          </p>
          <h4>Error Log Messages</h4>
          <p class="caption">
            Debugging can be tricky. Push logging text to `this.logMessages`
            variable for debugging purposes. The contents of the variable are
            shown below.
          </p>
          <ul>
            <li v-for="message in logMessages" :key="message">
              {{ message }}
            </li>
          </ul>
        </v-col>
      </v-row>
    </v-slide-x-transition>
    <v-dialog
      v-model="isDialogVisible"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <SettingsCard @settings-close="isDialogVisible = false" />
    </v-dialog>
  </v-container>
</template>
<script>
// Required imports for every kind of visualisation
import vizMixins from "@/mixins/vizMixins";
import FieldMappingCard from "@/components/FieldMappingCard";

import SettingsCard from "./SettingsCard";

/**
 * Imports below are visualisation-specific.
 * https://github.com/devstark-com/vue-google-charts#readme
 * https://developers.google.com/chart/interactive/docs/gallery/sankey
 */
import { GChart } from "vue-google-charts";

export default {
  name: "SankeyPath",
  mixins: [vizMixins], // !Required!
  components: {
    GChart,
    FieldMappingCard,
    SettingsCard
  },
  data: () => ({
    seen: {}, // Dictionary of seen values,
    align: "right",
    delay: 1000, // Overrides draw delay in Mixins
    isDialogVisible: false,
    chartData: [["From", "To", "Weight"]],
    gChartPackages: { version: "current", packages: ["sankey"] },
    expectedFields: [
      {
        name: "Path",
        description: "NPath function output, with [] enclosure and , separator",
        type: "string",
        multiple: false
      },
      {
        name: "Count",
        description: "The count value of each path",
        type: "int",
        multiple: false
      }
    ]
  }),
  methods: {
    async parseWorksheetData(tableauData) {
      console.log(this.mappedFields);
      // Don't process until it has a mapped field
      if (this.mappedFields == null) return;
      const pathIndex = this.mappedFields.filter(
        field => field.name === "Path"
      )[0].index;
      const countIndex = this.mappedFields.filter(
        field => field.name === "Count"
      )[0].index;
      try {
        // For every row, loop through each element and add it to dictionary
        tableauData.forEach(record => {
          this.logMessages.push(record[pathIndex]);
          this.logMessages.push(record[countIndex]);
          this.parseAndPairUp(
            record[pathIndex].value,
            record[countIndex].value
          );
        });
        // Parse the dictionary
        await Object.entries(this.seen).forEach(record => {
          this.chartData.push([...record[0].split("$^$"), record[1]]);
        });
        return;
      } catch (error) {
        throw new Error("Error while parsing data from Tableau. " + error);
      }
    },
    parseAndPairUp(path, count) {
      // Parse the path string into an array of events/pages
      const events = path.substring(1, path.length - 1).split(", ");

      // Use align props to find the direction of traversal.
      if (this.align == "left") {
        // If left-aligned, traverse from index[0] until index[length - 2].
        for (let i = 0; i <= events.length - 2; i++) {
          this.setSeenPairs(events, i, i + 1, count);
        }
      } else {
        // If right-aligned, traverse from index[length - 1] until index [1]
        for (let i = events.length - 1; i >= 1; i--) {
          this.setSeenPairs(events, i - 1, i, count);
        }
      }
    },
    setSeenPairs(events, indexA, indexB, count) {
      // Take 2 elements at a time.
      let index =
        events[indexA] +
        ` (${indexA})` +
        "$^$" +
        events[indexB] +
        ` (${indexB})`;
      // Rename the elements to "element-iteration_index" and "element-iteration_index + 1 / - 1",
      if (index in this.seen) {
        this.seen[index] = this.seen[index] + count;
      } else {
        this.$set(this.seen, index, count);
      }
    }
  }
};
</script>
