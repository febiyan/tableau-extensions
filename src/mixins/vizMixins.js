export default {
  props: ["worksheetData"],
  data: () => {
    return {
      logMessages: [],
      status: "",
      statusMessage: "",
      tableauColumns: null,
      tableauRowCount: null,
      tableauMarksInfo: null
    };
  },
  watch: {
    /**
     * This function will be invoked automatically once there is fresh new data from Tableau Extensions.
     * It is watching `tableauData` props we define in this component -- which the App.vue component passes.
     * Don't change this function unless it is imminently necessary.
     */
    worksheetData: {
      immediate: true,
      handler: function(newWorksheetData) {
        this.status = "LOADING";
        // Check keys -- the validity of Tableau data table
        if (
          !("_data" in newWorksheetData) ||
          !("_columns" in newWorksheetData) ||
          !("_totalRowCount" in newWorksheetData) ||
          !("_isSummaryData" in newWorksheetData) ||
          !("_marksInfo" in newWorksheetData) ||
          !("_name" in newWorksheetData)
        ) {
          this.status = "ERROR";
          this.statusMessage = "Invalid Tableau data set.";
        }

        // Assign properties to their specific variables
        this.tableauColumns = newWorksheetData.columns;
        this.tableauRowCount = newWorksheetData.totalRowCount;
        this.tableauMarksInfo = newWorksheetData.marksInfo;
        this.tableauDataName = newWorksheetData.name;
        // Parse the worksheet data. This function is async.
        this.parseWorksheetData(newWorksheetData.data);
      }
    }
  }
};
