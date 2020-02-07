<template>
  <v-container
    fluid
    class="d-flex flex-column align-stretch"
    style="height: 100%;"
  >
    <v-row v-if="status === 'COMPLETED'">
      <v-col>
        <v-chart autoresize :options="vizOptions"></v-chart>
      </v-col>
    </v-row>
    <!-- Error messages will go in the row belo for developer debugging purposes -->
    <!-- To get your messages in the log, append logging messages to logMessages, like, 
    `this.logMessages.push("This line")` or `this.logMessages.push(someVariable)` -->
    <v-row v-else-if="status === 'ERROR'">
      <v-col>
        <h1>Error Encountered</h1>
        <p>
          {{ statusMessage }}
        </p>
        <h3>Error Log Messages</h3>
        <p>
          Since debugging can be tricky, use `logMessages` variable for
          debugging purposes. The contents of the variable are shown below.
        </p>
        <ul>
          <li v-for="message in logMessages" :key="message">
            {{ message }}
          </li>
        </ul>
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
.echarts {
  width: 100%;
  height: 100%;
}
</style>
<script>
import vizMixins from "@/mixins/vizMixins";
import ECharts from "vue-echarts"; // refers to components/ECharts.vue in webpack
import "echarts/lib/chart/sunburst"; // import ECharts modules manually to reduce bundle size

export default {
  name: "SunburstPath",
  mixins: [vizMixins],
  components: {
    "v-chart": ECharts // I am using ECharts component
  },
  data: () => {
    return {
      // The expectedFields is a variable that we will use in the dialog box where users
      // Can map the field they want. This way, they won't need to write their own UI.
      expectedTableauFields: [
        {
          name: "Path String",
          description: "Path string that is the output ",
          type: String,
          multiple: false
        },
        {
          name: "Path Count",
          description: "Count of path occurences",
          type: Number,
          multiple: false
        }
      ],
      // The following is library-specific. You may want to change the structure
      // if you have different visualisation library
      vizOptions: {
        series: {
          type: "sunburst",
          sort: null,
          highlightPolicy: "ancestor",
          data: [],
          label: {
            rotate: "radial"
          },
          levels: [],
          itemStyle: {
            color: "#ddd",
            borderWidth: 2
          }
        }
      }
    };
  },
  methods: {
    /**
     * You should edit this function and make it suitable for your visualisation,
     * but don't change the name or contract
     */
    parseWorksheetData: async function(worksheetData) {
      try {
        // This function assumes that the fields have been mapped.
        // Here we parse the data so that it conforms the visualisation data structure.
        // This function should be an asynchronous function / promise so that it does not block UI.
        // To-DO: make it dynamic so that users can
        // Get indices of the columns
        const stateIndex = this.tableauColumns.findIndex(
          record => record._fieldName === "State"
        );
        const cityIndex = this.tableauColumns.findIndex(
          record => record._fieldName === "City"
        );
        const postalCodeIndex = this.tableauColumns.findIndex(
          record => record._fieldName === "Postal Code"
        );
        const salesIndex = this.tableauColumns.findIndex(
          record => record._fieldName === "SUM(Sales)"
        );

        // See the indices of the keys
        // this.logMessages.push(stateIndex)
        // this.logMessages.push(cityIndex)
        // this.logMessages.push(postalCodeIndex)
        // this.logMessages.push(salesIndex)

        // Single pass through the data set.
        let stateCount = worksheetData.reduce((tally, currentRecord) => {
          tally = this.findOrCreate(tally, currentRecord[stateIndex].value);
          // Reference to the current state tally
          let stateTally = tally[currentRecord[stateIndex].value];
          stateTally.value = stateTally.value + currentRecord[salesIndex].value;

          // Create the city tally
          stateTally.children = this.findOrCreate(
            stateTally.children,
            currentRecord[cityIndex]._value
          );
          // Reference to the current city tally
          let cityTally = stateTally.children[currentRecord[cityIndex].value];
          cityTally.value = cityTally.value + currentRecord[salesIndex].value;
          // Create the postcode tally
          cityTally.children = this.findOrCreate(
            cityTally.children,
            currentRecord[postalCodeIndex]._value
          );
          // Reference to the postcode tally
          let postalCodeTally =
            cityTally.children[currentRecord[postalCodeIndex].value];
          postalCodeTally.value =
            postalCodeTally.value + currentRecord[salesIndex].value;
          return tally;
        }, {});
        // Assign to the resulting visualisation-specific object
        this.vizOptions.series.data = Object.values(stateCount).map(
          stateTally => {
            stateTally.children = Object.values(stateTally.children).map(
              cityTally => {
                cityTally.children = Object.values(cityTally.children);
                return cityTally;
              }
            );
            return stateTally;
          }
        );
        this.status = "COMPLETED";
        // this.logMessages.push(this.vizOptions.data[0]);
      } catch (error) {
        this.status = "ERROR";
        this.statusMessage = "Error while parsing data. " + error;
      }
    },
    /**
     * A helper function I specifically create for this Sunburst visualisation.
     */
    findOrCreate: function(object, key) {
      if (!(key in object)) {
        object[key] = {
          name: key,
          value: 0,
          children: {}
        };
      }
      return object;
    }
  }
};
</script>
