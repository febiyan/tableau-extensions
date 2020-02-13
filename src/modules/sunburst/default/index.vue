<template>
  <v-container
    fluid
    class="d-flex flex-column align-stretch"
    style="height: 100%;"
  >
    <!-- This will display once the visualisation data preparation is complete -->
    <v-row v-if="status === 'COMPLETED'" class="flex-grow-1 flex-shrink-0">
      <v-col>
        <sunburst :data="tree">
          <!-- Add behaviors -->
          <template slot-scope="{ on, actions }">
            <highlightOnHover v-bind="{ on, actions }" />
            <zoomOnClick v-bind="{ on, actions }" />
          </template>

          <!-- Add information to be displayed on top the graph -->
          <nodeInfoDisplayer
            slot="top"
            slot-scope="{ nodes }"
            :current="nodes.mouseOver"
            :root="nodes.root"
            description="of visits begin with this sequence of pages"
          />

          <!-- Add bottom legend -->
          <breadcrumbTrail
            slot="legend"
            slot-scope="{ nodes, colorGetter, width }"
            :current="nodes.mouseOver"
            :root="nodes.root"
            :colorGetter="colorGetter"
            :from="nodes.clicked"
            :width="width"
          />
        </sunburst>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'LOADING'">
      <v-col>
        Loading
      </v-col>
    </v-row>
    <!-- This will display if we need user inputs -->
    <v-row
      v-else-if="status === 'USER_PENDING'"
      class="align-center justify-center"
    >
      <v-col cols="6">
        <FieldMappingCard
          :expectedFields="expectedFields"
          :availableFields="availableFields"
          @fields-mapped="onFieldsMapped"
        />
      </v-col>
    </v-row>
    <!-- Error messages will go in the row below for developer debugging purposes -->
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
  </v-container>
</template>

<script>
// Required imports for every kind of visualisation
import vizMixins from "@/mixins/vizMixins";
import FieldMappingCard from "@/components/FieldMappingCard";

/**
 * Imports below are visualisation-specific
 */
// From https://github.com/David-Desmaisons/Vue.D3.sunburst
import {
  breadcrumbTrail,
  highlightOnHover,
  nodeInfoDisplayer,
  sunburst,
  zoomOnClick
} from "vue-d3-sunburst";
import "vue-d3-sunburst/dist/vue-d3-sunburst.css";

export default {
  name: "Sunburst",
  mixins: [vizMixins], //
  components: {
    breadcrumbTrail,
    highlightOnHover,
    nodeInfoDisplayer,
    sunburst,
    zoomOnClick,
    FieldMappingCard
  },
  data: () => {
    return {
      tree: {
        name: "flare",
        children: [
          {
            name: "analytics",
            children: [
              {
                name: "cluster",
                children: [
                  { name: "AgglomerativeCluster", size: 3938 },
                  { name: "CommunityStructure", size: 3812 },
                  { name: "HierarchicalCluster", size: 6714 },
                  { name: "MergeEdge", size: 743 }
                ]
              },
              {
                name: "graph",
                children: [
                  { name: "BetweennessCentrality", size: 3534 },
                  { name: "LinkDistance", size: 5731 },
                  { name: "MaxFlowMinCut", size: 7840 },
                  { name: "ShortestPaths", size: 5914 },
                  { name: "SpanningTree", size: 3416 }
                ]
              },
              {
                name: "optimization",
                children: [{ name: "AspectRatioBanker", size: 7074 }]
              }
            ]
          }
        ]
      },
      // The expectedFields is a variable that we will use in the dialog box where users
      // Can map the field they want. This way, they won't need to write their own UI.
      expectedFields: [
        {
          name: "City",
          description: "Sales city",
          type: "string",
          multiple: false
        },
        {
          name: "Postal Code",
          description: "The sales postal code",
          type: "int",
          multiple: false
        },
        {
          name: "State",
          description: "Umm. State!",
          type: "string",
          multiple: false
        },
        {
          name: "SUM(Sales)",
          description: "Total sales",
          type: "float",
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
     * You should edit the content of function and make it suitable for your visualisation,
     * but don't change the name or contract.
     * @params worksheetData : An array containing rows
     */
    async parseWorksheetData(worksheetData) {
      try {
        if (this.mappedFields == null) return;

        // This function assumes that the fields have been mapped.
        // Here we parse the data so that it conforms the visualisation data structure.
        // This function should be an asynchronous function / promise so that it does not block UI.
        const stateIndex = this.mappedFields.filter(
          field => field.name === "State"
        )[0].index;
        const cityIndex = this.mappedFields.filter(
          field => field.name === "City"
        )[0].index;
        const postalCodeIndex = this.mappedFields.filter(
          field => field.name === "Postal Code"
        )[0].index;
        const salesIndex = this.mappedFields.filter(
          field => field.name === "SUM(Sales)"
        )[0].index;

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
        // map array to promises
        const promises = Object.values(stateCount).map(async stateTally => {
          stateTally.children = Object.values(stateTally.children).map(
            cityTally => {
              cityTally.children = Object.values(cityTally.children);
              return cityTally;
            }
          );
          return stateTally;
        });
        // Set the data
        this.vizOptions.series.data = await Promise.all(promises);
      } catch (error) {
        this.status = "ERROR";
        this.statusMessage = "Error while parsing data. " + error;
      }
    },
    /**
     * A helper function I specifically create for this Sunburst visualisation.
     * This function will create an object inside the passed `object` parameter,
     * with the key to that created object is the name of the object
     */
    findOrCreate(object, key) {
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
