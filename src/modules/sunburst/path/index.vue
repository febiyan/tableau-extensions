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
          <!-- https://github.com/David-Desmaisons/Vue.D3.sunburst -->
          <sunburst :data="tree">
            <!-- Add behaviors -->
            <template slot-scope="{ on, actions }">
              <highlightOnHover v-bind="{ on, actions }" />
              <zoomOnClick v-bind="{ on, actions }" />
            </template>

            <!-- Add information to be displayed on top the graph -->
            <nodeInfoDisplayer
              class="caption"
              slot="top"
              slot-scope="{ nodes }"
              :current="nodes.mouseOver"
              :root="nodes.root"
              description="of Visited Path"
            />

            <!-- Add bottom legend -->
            <breadcrumbTrail
              class="small-text"
              slot="legend"
              slot-scope="{ nodes, colorGetter }"
              :current="nodes.mouseOver"
              :root="nodes.root"
              :colorGetter="colorGetter"
              :from="nodes.clicked"
              :itemWidth="trailWidth"
            />
          </sunburst>
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

<style>
/* Visualisation specific */
.small-text {
  font-size: 6pt;
}
</style>

<script>
// Required imports for every kind of visualisation
import vizMixins from "@/mixins/vizMixins";
import FieldMappingCard from "@/components/FieldMappingCard";

/**
 * Imports below are visualisation-specific.
 * https://github.com/David-Desmaisons/Vue.D3.sunburst
 */
import {
  breadcrumbTrail,
  highlightOnHover,
  nodeInfoDisplayer,
  sunburst,
  zoomOnClick
} from "vue-d3-sunburst";
import "vue-d3-sunburst/dist/vue-d3-sunburst.css";

// Dialog Box
import SettingsCard from "./SettingsCard";

export default {
  name: "SunburstPath",
  mixins: [vizMixins], // !Required!
  components: {
    FieldMappingCard,
    breadcrumbTrail, // D3 Vue Sunburst
    highlightOnHover,
    nodeInfoDisplayer,
    sunburst,
    zoomOnClick,
    SettingsCard
  },
  data: () => {
    return {
      // Width of the trail
      trailWidth: 100,
      // The expectedFields is a variable that we will use in the dialog box where users
      // Can map the field they want. This way, they won't need to write their own UI.
      expectedFields: [
        {
          name: "Path",
          description:
            "NPath function output, with [] enclosure and , separator",
          type: "string",
          multiple: false
        },
        {
          name: "Count",
          description: "The count value of each path",
          type: "int",
          multiple: false
        }
      ],
      // The following is library-specific. You may want to change the structure
      // if you have different visualisation library
      tree: null,
      // Dialog box
      isDialogVisible: false
    };
  },
  methods: {
    /**
     * You should edit the content of function and make it suitable for your visualisation,
     * but don't change the name or contract.
     * @params worksheetData : An array containing rows with Tableau's Data Set format
     */
    async parseWorksheetData(worksheetData) {
      try {
        // Don't process until it has a mapped field
        if (this.mappedFields == null) return;
        // This function assumes that the fields have been mapped.
        // Here we parse the data so that it conforms the visualisation data structure.
        // This function should be an asynchronous function / promise so that it does not block UI.
        const pathIndex = this.mappedFields.filter(
          field => field.name === "Path"
        )[0].index;
        const countIndex = this.mappedFields.filter(
          field => field.name === "Count"
        )[0].index;
        // Single pass loop through the data set.
        const tree = worksheetData.reduce(
          (temp, currentRecord) => {
            const path = currentRecord[pathIndex].value.substring(
              1,
              currentRecord[pathIndex].value.length - 1
            );
            // console.log(path);
            temp.children = this.expand(
              temp.children,
              path.split(", "),
              currentRecord[countIndex].value,
              1 // Logging purposes
            );
            return temp;
          },
          // The initial temp value
          {
            name: "",
            size: 0,
            children: []
          }
        );
        // Assign to the resulting visualisation-specific object
        this.$set(this, "tree", tree);
      } catch (error) {
        throw new Error("Error while parsing data. " + error);
      }
    },
    /**
     * A helper function that I use to parse the path into a tree
     */
    expand(array, keys, count, level) {
      // console.log(`Expand() ${level}. Array`, array);
      // console.log(`Expand() ${level}. Keys`, keys);
      // console.log(`Expand() ${level}. Count`, count);
      let node = array.find(node => node.name == keys[0]);
      if (node == null) {
        // Node is null, create a new one
        node = {
          name: keys[0],
          size: 0,
          children: []
        };
        array.push(node);
      }

      if (keys.length == 1) {
        // console.log(`Expand() ${level}. Leaf node`, node);
        // This is the last key (the leaf), increment the value
        node.size = node.size + count;
      } else {
        // console.log(`Expand() ${level}. Branch node`, node);
        // This is not the last key, continue expanding the children with the next set of keys
        node.children = this.expand(
          node.children,
          keys.slice(1),
          count,
          level + 1
        );
      }

      // console.log(`Expand called() ${level}. Node processed`, node);
      return array;
    }
  }
};
</script>
