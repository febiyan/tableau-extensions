export default {
  props: ["worksheetData"],
  data: () => {
    return {
      logMessages: [],
      status: "", // "", "LOADING", "USER_PENDING", "ERROR", "COMPLETED"
      statusMessage: "",
      data: null,
      availableFields: null,
      mappedFields: null,
      rowCount: null
    };
  },
  methods: {
    /**
     * Event handler from the FieldMappingCard component event
     */
    onFieldsMapped(mappedFields) {
      this.status = "LOADING";
      this.mappedFields = mappedFields;
      this.parseWorksheetData(this.data)
        .then(() => {
          setTimeout(() => {
            this.status = "COMPLETED";
          }, 500);
        })
        .catch(error => {
          this.status = "ERROR";
          this.statusMessage = "Error during parsing. (" + error + ")";
        });
    },
    /**
     * Event handler from the FieldMappingCard component event
     */
    onFieldsMappingCanceled() {
      this.mappedFields = null;
      this.$emit("fields-mapping-canceled");
    }
  },
  watch: {
    /**
     * This function will be invoked automatically once there is fresh new data from Tableau Extensions.
     * It is watching `tableauData` props we define in this component -- which the App.vue component passes.
     * I'm using this instead of computed properties so that I can put a more complex functionality inside async
     * Don't change this function unless it is imminently necessary.
     */
    worksheetData: {
      immediate: true,
      handler: function(newWorksheetData) {
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
        this.availableFields = newWorksheetData.columns;
        this.rowCount = newWorksheetData.totalRowCount;
        this.tableauDataName = newWorksheetData.name;
        this.data = newWorksheetData.data;
        console.log("what");
        if (this.mappedFields == null) {
          this.status = "USER_PENDING";
        } else {
          this.status = "LOADING";
          // Parse the worksheet data. This function is async so it should not block.
          this.parseWorksheetData(this.data)
            .then(() => {
              setTimeout(() => {
                this.status = "COMPLETED";
              }, 500);
            })
            .catch(error => {
              this.status = "ERROR";
              this.statusMessage = "Error during parsing. (" + error + ")";
            });
        }
      }
    }
  }
};
