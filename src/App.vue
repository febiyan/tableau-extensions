<template>
  <v-app>
    <v-content>
      <v-container fluid="">
        <v-row v-if="error">
          <v-col cols="12">
            <v-alert type="error" outlined>
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12">
            {{ dashboard }} - {{ selectedWorksheet.name }}</v-col
          >
          <v-col cols="12">
            {{ selectedWorksheet.data.length }} Records of:
            {{ selectedWorksheet.fields }}
          </v-col>
          <v-col cols="12">
            Sample Data: {{ selectedWorksheet.data[0] }}
          </v-col>
          <v-col cols="12">
            <v-chart autoResize :options="vizOption"> </v-chart>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
    <!-- <v-content>
      <Sunburst />
    </v-content> -->
  </v-app>
</template>

<script>
// import Sunburst from "./modules/sunburst/path";
import "./utils/tableau.ext.js";
import ECharts from "vue-echarts"; // refers to components/ECharts.vue in webpack
// import ECharts modules manually to reduce bundle size
import "echarts/lib/chart/sunburst";

let tableau = window.tableau;
export default {
  name: "App",

  components: {
    //    Sunburst
    "v-chart": ECharts
  },

  data: () => ({
    error: null,
    dashboard: "",
    worksheets: [],
    selectedWorksheet: {
      name: "",
      dashboard: "",
      data: [],
      fields: {}
    },
    vizOption: {
      series: {
        radius: ["15%", "80%"],
        type: "sunburst",
        sort: null,
        highlightPolicy: "ancestor",
        data: [],
        label: {
          rotate: "radial"
        },
        levels: []
      }
    }
    // expectedColumns: {}
  }),
  methods: {
    findOrCreate: function(object, key) {
      if (!(key in object)) {
        object[key] = {
          name: key,
          value: 0,
          children: {}
        };
      }
      return object;
    },
    parse: function() {
      // This function assumes that the fields have been mapped.
      // Here we parse the data so that it conforms the visualisation data structure.
      // This function should be an asynchronous function / promise so that it does not block UI.

      // Get indices of the columns
      const stateIndex = this.selectedWorksheet.fields.findIndex(
        record => record.fieldName === "State"
      );
      const cityIndex = this.selectedWorksheet.fields.findIndex(
        record => record.fieldName === "City"
      );
      const postalCodeIndex = this.selectedWorksheet.fields.findIndex(
        record => record.fieldName === "Postal Code"
      );
      const salesIndex = this.selectedWorksheet.fields.findIndex(
        record => record.fieldName === "Sales"
      );

      // ---------- LINES BELOW ARE SUNBURST SPECIFIC ----------
      // Single pass through the data set
      let stateCount = this.selectedWorksheet.data.reduce(
        (tally, currentRecord) => {
          tally = this.findOrCreate(tally, currentRecord[stateIndex].value);
          // Reference to the current state tally
          let stateTally = tally[currentRecord[stateIndex].value];
          stateTally.value = stateTally.value + currentRecord[salesIndex].value;

          // Create the city tally
          stateTally.children = this.findOrCreate(
            stateTally.children,
            currentRecord[cityIndex].value
          );
          // Reference to the current city tally
          let cityTally = stateTally.children[currentRecord[cityIndex].value];
          cityTally.value = cityTally.value + currentRecord[salesIndex].value;

          // Create the postcode tally
          cityTally.children = this.findOrCreate(
            cityTally.children,
            currentRecord[postalCodeIndex].value
          );
          // Reference to the postcode tally
          let postalCodeTally =
            cityTally.children[currentRecord[postalCodeIndex].value];
          postalCodeTally.value =
            postalCodeTally.value + currentRecord[salesIndex].value;
          return tally;
        },
        {}
      );

      // Change into object
      this.vizOption.series.data = Object.values(stateCount).map(stateTally => {
        stateTally.children = Object.values(stateTally.children).map(
          cityTally => {
            cityTally.children = Object.values(cityTally.children);
            return cityTally;
          }
        );
        return stateTally;
      });
    }
  },
  mounted: function() {
    tableau.extensions
      .initializeAsync()
      .then(async () => {
        // Get the dashboard name and its list of worksheets
        // I can only copy the dashboard name for now, I cannot copy the whole dashboard object to Vue.
        // Why? Circular reference inside component data throws an error in Vue.
        this.dashboard = tableau.extensions.dashboardContent.dashboard.name;
        tableau.extensions.dashboardContent.dashboard.worksheets.forEach(
          worksheet => {
            // Copy the worksheet data to be displayed
            // I need to copy manually because it contains a circular reference.
            this.worksheets.push({
              name: worksheet.name,
              dashboard: worksheet.parentDashboard.name,
              data: [],
              fields: []
            });
          }
        );
        // If >1 worksheets, show a list of selectable worksheets to the user
        // If 0 worksheets, show "Please add a worksheet to the dashboard."
        // If 1 worksheet, proceed to grab the underlying data immediately
        if (this.worksheets.length != 1) {
          this.error = "Please add a worksheet to the dashboard.";
          return;
        }
        // Assign the one worksheet
        this.selectedWorksheet = this.worksheets[0];

        // Get the underlying data from the worksheet
        // TODO: parse the data so that it works
        let data = await tableau.extensions.dashboardContent.dashboard.worksheets[0].getUnderlyingDataAsync();
        this.selectedWorksheet.fields = data.columns;
        this.selectedWorksheet.data = data.data;

        // Parse data
        this.parse();
        // FUTURE: First, check whether the expected field names are there
        // If they are there, map the fields and parse the individual data
        // If the expected field names are not there, then let the users map the field
      })
      .catch(error => {
        this.error = error;
      });
  }
};
</script>
