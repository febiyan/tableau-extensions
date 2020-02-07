<template>
  <v-app>
    <v-content>
      <v-container
        pa-0
        fluid
        class="d-flex flex-column align-stretch"
        style="height: 100%;"
      >
        <v-row class="flex-grow-1 flex-shrink-0" dense>
          <v-col>
            <router-view :worksheetData="worksheetData"></router-view>
          </v-col>
        </v-row>
        <v-row
          v-if="status === 'ERROR'"
          dense
          class="flex-grow-0 flex-shrink-1"
        >
          <v-col>
            {{ statusMessage }}
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import "./utils/tableau.ext.js";
let tableau = window.tableau;

export default {
  name: "App",
  data: () => ({
    logMessages: [],
    // "", "LOADING", "ERROR", "COMPLETED"
    status: "",
    statusMessage: "",
    worksheetNames: [],
    worksheetData: []
    // expectedColumns: {}
  }),
  methods: {
    async loadWorksheetData(name) {
      try {
        // Get the underlying data from the worksheet
        this.worksheetData = await this.getWorksheetData(name);
        this.status = "COMPLETED";
        this.statusMessage = "Loaded data from Tableau";
      } catch (error) {
        // Error while loading data
        this.status = "ERROR";
        this.statusMessage =
          "Error while trying to load data from Tableau. (" + error + ")";
      }
    },
    /**
     * A simple wrapper to Tableau's initializeAsync function
     */
    async initialize() {
      return tableau.extensions.initializeAsync();
    },
    /**
     * A simple wrapper/helper function to find worksheet
     */
    findWorksheet(worksheetName) {
      const worksheet = tableau.extensions.dashboardContent.dashboard.worksheets.find(
        worksheet => worksheet.name === worksheetName
      );
      if (!worksheet)
        throw Error("Could not find worksheet with the given name.");
      return worksheet;
    },
    /**
     * A simple wrapper/helper function to load worksheet summary data
     */
    async getWorksheetSummaryData(worksheetName) {
      return this.findWorksheet(worksheetName).getSummaryDataAsync();
    },
    /**
     * A simple wrapper/helper function to load worksheet data
     */
    async getWorksheetData(worksheetName) {
      return this.findWorksheet(worksheetName).getSummaryDataAsync();
    },
    /**
     * Get a list of worksheet names
     */
    getWorksheetNames() {
      return tableau.extensions.dashboardContent.dashboard.worksheets.map(
        worksheet => worksheet.name
      );
    }
  },
  /**
   * This function will be called as soon as the whole app is mounted on the window
   */
  mounted: function() {
    this.status = "LOADING";
    // Connect to Tableau
    this.initialize()
      .then(() => {
        // Get the dashboard name and its list of worksheets
        // I can only copy the dashboard name for now, I cannot copy the whole dashboard object to Vue.
        // Why? Circular reference inside component data throws an error in Vue.
        this.worksheetNames = this.getWorksheetNames();
        this.statusMessage = this.worksheetNames;
        // If >1 worksheets, show a list of selectable worksheets to the user
        // If 0 worksheets, show "Please add a worksheet to the dashboard."
        // If 1 worksheet, proceed to grab the underlying data immediately
        if (this.worksheetNames.length == 0) {
          this.status = "";
          this.statusMessage = "Please add a worksheet to the dashboard.";
          return;
        } else if (this.worksheetNames.length > 1) {
          this.status = "";
          this.statusMessage = "Please choose a worksheet.";
          return;
        }
        // At this point, we're sure that there is only one worksheet.
        // Load worksheet data. This will be then passed reactively as Props to the child component
        this.loadWorksheetData(this.worksheetNames[0]);
      })
      .catch(error => {
        // Error while loading data
        this.status = "ERROR";
        this.statusMessage =
          "Error while trying to connect to Tableau. (" + error + ")";
      });
  }
};
</script>
