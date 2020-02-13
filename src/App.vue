<template>
  <v-app>
    <v-content>
      <v-container
        pa-0
        fluid
        class="d-flex flex-column align-stretch"
        style="height: 100%"
      >
        <v-slide-x-transition>
          <!-- This will be displayed if visualisation data has been loaded -->
          <v-row
            v-if="status === 'COMPLETED'"
            class="flex-grow-1 flex-shrink-0 d-flex align-stretch justify-start"
            dense
          >
            <v-col>
              <router-view
                :worksheetData="worksheetData"
                @fields-mapping-canceled="displayWorksheetSelection"
              ></router-view>
            </v-col>
          </v-row>
          <!-- This will be displayed we need some input from users -->
          <v-row
            v-else-if="status === 'USER_PENDING'"
            class="flex-grow-1 flex-shrink-0 align-center justify-center"
            dense
          >
            <v-col cols="6">
              <!-- Display the worksheet selection -->
              <WorksheetSelectionCard
                :worksheetNames="worksheetNames"
                @worksheet-selected="onWorksheetSelected"
              />
            </v-col>
          </v-row>
          <!-- This will be displayed during loading -->
          <v-row
            v-else-if="status === 'LOADING'"
            class="flex-grow-1 flex-shrink-0 align-center justify-stretch"
          >
            <v-overlay>
              <v-progress-circular
                indeterminate
                size="64"
              ></v-progress-circular>
            </v-overlay>
          </v-row>
          <!-- This will be displayed in case of errors -->
          <v-row
            v-else-if="status === 'ERROR'"
            dense
            class="flex-grow-0 flex-shrink-1"
          >
            <v-col>
              {{ statusMessage }}
            </v-col>
          </v-row>
        </v-slide-x-transition>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import WorksheetSelectionCard from "@/components/WorksheetSelectionCard";
import "@/utils/tableau.ext.js";

let tableau = window.tableau;

export default {
  name: "App",
  components: {
    WorksheetSelectionCard
  },
  data: () => ({
    status: "", // "", "LOADING", "USER_PENDING", "ERROR", "COMPLETED"
    statusMessage: "",
    worksheetNames: [],
    worksheetData: [],
    worksheetFilterUnregisterers: [],
    worksheetMarks: [],
    selectedWorksheetName: null
  }),
  methods: {
    onWorksheetSelected(worksheetName) {
      this.status = "LOADING";
      // Unregister every Filter event handlers
      this.unregisterFilterEventHandlers();
      // Register a new filter event handler for the particular worksheet
      this.registerFilterEventHandler(worksheetName);
      // Register a new parameter for the dashboard
      this.registerParamEventHandler(worksheetName);
      // At this point, we're sure that there is only one worksheet.
      // We can now load worksheet data annd marks.
      // Both will be then passed reactively as Props to the child component
      this.loadWorksheet(worksheetName);
    },
    async loadWorksheet(worksheetName) {
      try {
        // Get the underlying data from the worksheet
        this.worksheetData = await this.getWorksheetData(worksheetName);
        this.worksheetMarks = await this.getWorksheetMarks(worksheetName);
        this.status = "COMPLETED";
        this.statusMessage = "Loaded data from Tableau.";
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
      try {
        return this.findWorksheet(worksheetName).getSummaryDataAsync();
      } catch (error) {
        throw error;
      }
    },
    /**
     * A simple wrapper/helper function to load worksheet data
     */
    async getWorksheetData(worksheetName) {
      try {
        return this.findWorksheet(worksheetName).getSummaryDataAsync();
      } catch (error) {
        throw error;
      }
    },
    /**
     * A simple wrapper/helper function to load the marks
     */
    async getWorksheetMarks(worksheetName) {
      try {
        return this.findWorksheet(worksheetName).getSelectedMarksAsync();
      } catch (error) {
        throw error;
      }
    },
    /**
     * Get a list of worksheet names
     */
    getWorksheetNames() {
      return tableau.extensions.dashboardContent.dashboard.worksheets.map(
        worksheet => worksheet.name
      );
    },
    displayWorksheetSelection() {
      // If 0 worksheets, show "Please add a worksheet to the dashboard."
      // If >1 worksheets, show a list of selectable worksheets to the user
      // If 1 worksheet, proceed to grab the underlying data immediately
      if (this.worksheetNames.length == 0) {
        this.status = "ERROR";
        this.statusMessage = "Please add a worksheet to the dashboard.";
        return;
      } else if (this.worksheetNames.length > 1) {
        this.status = "USER_PENDING";
        this.statusMessage = "Please choose a worksheet.";
        return;
      } else {
        this.onWorksheetSelected(this.worksheetNames[0]);
      }
    },
    /**
     * Register filter event handler
     */

    registerFilterEventHandler(worksheetName) {
      this.worksheetFilterUnregisterers.push(
        this.findWorksheet(worksheetName).addEventListener(
          tableau.TableauEventType.FilterChanged,
          () => {
            this.loadWorksheet(worksheetName);
          }
        )
      );
      this.worksheetFilterUnregisterers.push(
        this.findWorksheet(worksheetName).addEventListener(
          tableau.TableauEventType.MarkSelectionChanged,
          () => {
            this.loadWorksheet(worksheetName);
          }
        )
      );
    },
    /**
     * Unregister all Filter Event Handlers
     */
    unregisterFilterEventHandlers() {
      this.worksheetFilterUnregisterers.forEach(unregister => unregister());
    },
    /**
     *
     */
    registerParamEventHandler(worksheetName) {
      // Register parameter-changed event function handlers
      tableau.extensions.dashboardContent.dashboard
        .getParametersAsync()
        .then(params => {
          params.forEach(param => {
            param.addEventListener(
              tableau.TableauEventType.ParameterChanged,
              () => {
                // We don't get parameter value here, but we can trigger data reload
                // console.log("Params changed: ", param);
                this.loadWorksheet(worksheetName);
              }
            );
          });
        });
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
        // I cannot copy the whole dashboard object to Vue -- Circular reference inside component data throws an error in Vue.
        this.worksheetNames = this.getWorksheetNames();
        this.displayWorksheetSelection();
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
