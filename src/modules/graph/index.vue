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
          <ECharts :options="chartOptions" style="width: 100%; height: 100%" />
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
import ECharts from "vue-echarts"; // refers to components/ECharts.vue in webpack
import "echarts/lib/chart/graph";

export default {
  name: "SankeyPath",
  mixins: [vizMixins], // !Required!
  components: {
    FieldMappingCard,
    SettingsCard,
    ECharts
  },
  data: () => ({
    isDialogVisible: false,
    expectedFields: [
      {
        name: "From",
        description: "From node",
        type: "string",
        multiple: false
      },
      {
        name: "To",
        description: "To node",
        type: "string",
        multiple: false
      },
      {
        name: "Link Weight",
        description: "Values for the links",
        type: "float",
        multiple: false
      },
      {
        name: "Node Weight",
        description: "Values for Nodes",
        type: "int",
        multiple: false
      }
    ],
    chartOptions: {
      legend: [
        {
          data: []
        }
      ],
      tooltip: {},
      animationDuration: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          // name: "Les Miserables",
          type: "graph",
          layout: "force",
          data: [],
          links: [],
          // data: graph.nodes,
          // links: graph.links,
          categories: [],
          roam: true,
          focusNodeAdjacency: true,
          force: {
            edgeLength: 75,
            repulsion: 20,
            gravity: 0.25
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1,
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)"
          },
          label: {
            position: "right",
            formatter: "{b}"
          },
          lineStyle: {
            color: "source",
            curveness: 0.3
          },
          emphasis: {
            lineStyle: {
              opacity: 1
            }
          }
        }
      ]
    }
  }),
  methods: {
    async parseWorksheetData(tableauData) {
      // Don't process until it has a mapped field
      if (this.mappedFields == null) return;
      const fromIndex = this.mappedFields.filter(
        field => field.name === "From"
      )[0].index;
      const toIndex = this.mappedFields.filter(field => field.name === "To")[0]
        .index;
      const linkWeightIndex = this.mappedFields.filter(
        field => field.name === "Link Weight"
      )[0].index;
      const nodeWeightIndex = this.mappedFields.filter(
        field => field.name === "Node Weight"
      )[0].index;

      try {
        let nodes = {};
        let links = [];
        // For every row, loop through each element and add it to dictionary
        tableauData.forEach(record => {
          const from = record[fromIndex].value;
          const to = record[toIndex].value;
          const linkWeight = record[linkWeightIndex].value;
          const nodeWeight = record[nodeWeightIndex].value;

          // Calculate From-Node weight
          if (from in nodes) {
            nodes[from] = nodes[from] + nodeWeight;
          } else {
            nodes[from] = nodeWeight;
          }
          // Calculate From-To weight
          if (to in nodes) {
            nodes[to] = nodes[to] + nodeWeight;
          } else {
            nodes[to] = nodeWeight;
          }

          // Add links
          links.push({
            source: from,
            target: to,
            value: linkWeight,
            lineStyle: {
              normal: {
                width: Math.log2(linkWeight),
                opacity: 0.5
              }
            }
          });
        });

        this.$set(this.chartOptions.legend[0], "data", Object.keys(nodes));
        // Series
        this.$set(
          this.chartOptions.series[0],
          "categories",
          Object.keys(nodes).map(name => ({ name }))
        );
        this.$set(this.chartOptions.series[0], "links", links);
        this.$set(
          this.chartOptions.series[0],
          "data",
          Object.entries(nodes).map(record => ({
            name: record[0],
            category: record[0],
            value: record[1],
            x: null,
            y: null,
            symbolSize: Math.log2(record[1]),
            itemStyle: null,
            draggable: true
          }))
        );
        console.log(this.chartOptions);
        return;
      } catch (error) {
        throw new Error("Error while parsing data from Tableau. " + error);
      }
    }
  }
};
</script>
