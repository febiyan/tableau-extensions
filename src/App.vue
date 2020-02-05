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
          <v-col cols="12"> {{ dashboard }} - {{ selectedWorksheet.name }}</v-col>
          <v-col cols="12"> {{ selectedWorksheet.data.length }} Records of: {{ selectedWorksheet.fields }} </v-col>
          <v-col cols="12"> Sample {{ selectedWorksheet.data[0] }} </v-col>
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

let tableau = window.tableau;
export default {
  name: "App",

  components: {
    //    Sunburst
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
    expectedColumns: {}
  }),
  methods: {
    parse: () => {
      // This assumes that the fields have been mapped
      // Here we parse the data so that it conforms the visualisation
    }
  },
  mounted: function() {
    tableau.extensions
      .initializeAsync()
      .then(async () => {
        // Get dashboard name and the list
        // I cannot copy the whole dashboard object to Vue
        // Circular reference inside component data throws an error in Vue
        this.dashboard = tableau.extensions.dashboardContent.dashboard.name;
        tableau.extensions.dashboardContent.dashboard.worksheets.forEach(
          worksheet => {
            // Copy the worksheet data to be displayed
            // I need to copy manually because it contains a circular reference.
            this.worksheets.push({
              name: worksheet.name,
              dashboard: worksheet.parentDashboard.name,
              data: [],
              fields: {}
            });
          }
        );
        // If >1 worksheets, show a list of selectable worksheets to the user
        // If 0 worksheets, show "Please add a worksheet to the dashboard."
        // If 1 worksheet, proceed to grab the underlying data immediately
        if (this.worksheets.length != 1) {
          return;
        }
        // Assign the one worksheet
        this.selectedWorksheet = this.worksheets[0];

        // Get the underlying data from the worksheet
        // TODO: parse the data so that it works
        let data = await tableau.extensions.dashboardContent.dashboard.worksheets[0].getUnderlyingDataAsync();
        this.selectedWorksheet.fields = data.columns;
        this.selectedWorksheet.data = data.data;

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
