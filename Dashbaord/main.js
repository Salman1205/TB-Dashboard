// Function to load an HTML file into the main content area
function loadPage(page) {
  const mainContent = document.getElementById("main-content");
  fetch(page)
    .then((response) => response.text())
    .then((data) => {
      mainContent.innerHTML = data;

      // Directly execute JavaScript needed for each graph after loading the content
      if (page === "timeline.html") {
        setTimeout(initTimelineGraph, 0);
      } else if (page === "treemap.html") {
        setTimeout(initTreemap, 0);
      } else if (page === "map.html") {
        setTimeout(initMapGraph, 0);
      } else if (page === "force.html") {
        setTimeout(initForceGraph, 0);
      } else if (page === "sunburst.html") {
        setTimeout(initSunburst, 0);
      }
    })
    .catch((error) => {
      mainContent.innerHTML = "<p>Page not found.</p>";
      console.error("Error loading page:", error);
    });
}
function initTimelineGraph() {
  console.log("Initializing Timeline Graph");
  // JavaScript code for Timeline graph
  const svgTimeline = d3.select("#svgTimeline");
  if (!svgTimeline.empty()) {
    const timelineWidth = +svgTimeline.node().getBoundingClientRect().width;
    const timelineHeight = 300;
    svgTimeline.attr("height", timelineHeight);

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const innerWidth = timelineWidth - margin.left - margin.right;
    const innerHeight = timelineHeight - margin.top - margin.bottom;

    const g = svgTimeline
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const zoom = d3
      .zoom()
      .scaleExtent([1, 5])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("zoom", zoomed);

    svgTimeline.call(zoom);

    function zoomed(event) {
      const transform = event.transform;
      g.attr("transform", transform);
      g.select(".x-axis").call(xAxis.scale(transform.rescaleX(xScale)));
      g.select(".y-axis").call(yAxis.scale(transform.rescaleY(yScale)));
    }

    const xScale = d3.scaleLinear().domain([2000, 2023]).range([0, innerWidth]);

    let yScale = d3.scaleLinear().range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(12);

    let yAxis = d3.axisLeft(yScale).tickFormat((d) => d3.format(",")(d));

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "x-axis");

    g.append("g").attr("class", "y-axis");

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.e_inc_100k))
      .curve(d3.curveCardinal);

    const tooltip = d3.select("#tooltip");

    d3.json("preprocessed_data.json")
      .then(function (tbData) {
        tbData.forEach((d) => {
          d.year = +d.year;
          d.e_inc_100k = +d.e_inc_100k * 1000;
        });

        const countries = Array.from(new Set(tbData.map((d) => d.country)));
        const filterDropdown = d3.select("#filterDropdown");

        countries.forEach((country) => {
          filterDropdown
            .append("label")
            .html(`<input type="checkbox" value="${country}"> ${country}`);
        });

        d3.select(".filter-label").on("click", function () {
          const dropdown = document.getElementById("filterDropdown");
          dropdown.style.display =
            dropdown.style.display === "block" ? "none" : "block";
        });

        d3.select("#selectAll").on("change", function () {
          const checked = this.checked;
          d3.selectAll("#filterDropdown input[type='checkbox']").property(
            "checked",
            checked
          );
          updateChart(currentYear);
        });

        d3.selectAll("#filterDropdown input[type='checkbox']").on(
          "change",
          function () {
            updateChart(currentYear);
          }
        );

        const colorScale = d3
          .scaleOrdinal(d3.schemeCategory10)
          .domain(countries);

        let currentYear = 2000;
        let isPlaying = false;
        let timer;

        function updateChart(year) {
          const selectedCheckboxes = d3
            .selectAll("#filterDropdown input[type='checkbox']:checked")
            .nodes()
            .map((n) => n.value);
          const selectedCountries = selectedCheckboxes.includes("all")
            ? countries
            : selectedCheckboxes;

          const filteredData =
            selectedCountries.length > 0
              ? tbData.filter(
                  (d) => d.year <= year && selectedCountries.includes(d.country)
                )
              : tbData.filter((d) => d.year <= year);

          yScale.domain([
            Math.max(1, d3.min(filteredData, (d) => d.e_inc_100k) * 0.95),
            d3.max(filteredData, (d) => d.e_inc_100k) * 1.05,
          ]);

          g.select(".y-axis").call(yAxis);
          g.select(".x-axis").call(xAxis);

          const nestedData = d3.group(filteredData, (d) => d.country);

          const lines = g
            .selectAll(".line-country")
            .data(Array.from(nestedData.entries()), (d) => d[0]);

          lines
            .enter()
            .append("path")
            .attr("class", "line-country")
            .attr("fill", "none")
            .attr("stroke", (d) => colorScale(d[0]))
            .attr("stroke-width", 2.5)
            .merge(lines)
            .attr("d", (d) => line(d[1]))
            .on("mousemove", function (event) {
              const year = Math.round(
                xScale.invert(d3.pointer(event, this)[0])
              );
              const dataAtYear = filteredData.filter((d) => d.year === year);
              const tooltipData = dataAtYear
                .map(
                  (d) =>
                    `<strong>${d.country}:</strong> ${d3.format(",")(
                      d.e_inc_100k
                    )}`
                )
                .join("<br>");
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip
                .html(`<strong>Year:</strong> ${year}<br>${tooltipData}`)
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout", function () {
              tooltip.transition().duration(500).style("opacity", 0);
            });

          lines.exit().remove();

          d3.select("#currentYear").text(year);

          // Update legend
          const legend = d3.select("#legend");
          legend.selectAll("*").remove();
          selectedCountries.forEach((country) => {
            const legendItem = legend
              .append("div")
              .attr("class", "legend-item")
              .on("click", function () {
                const line = g
                  .selectAll(".line-country")
                  .filter((d) => d[0] === country);
                const isActive = line.classed("inactive");
                line.classed("inactive", !isActive);
                line.attr("stroke-opacity", isActive ? 1 : 0.1);
              });

            legendItem
              .append("div")
              .attr("class", "legend-color")
              .style("background-color", colorScale(country));

            legendItem.append("span").text(country);
          });
        }

        function playAnimation() {
          if (!isPlaying) {
            isPlaying = true;
            timer = d3.interval(() => {
              if (currentYear < 2023) {
                currentYear++;
                updateChart(currentYear);
                d3.select("#dateRange").property("value", currentYear);
              } else {
                timer.stop();
                isPlaying = false;
              }
            }, 300);
          }
        }

        function pauseAnimation() {
          if (isPlaying) {
            timer.stop();
            isPlaying = false;
          }
        }

        d3.select("#playButton").on("click", playAnimation);
        d3.select("#pauseButton").on("click", pauseAnimation);
        d3.select("#dateRange").on("input", function () {
          currentYear = +this.value;
          updateChart(currentYear);
        });

        updateChart(currentYear);
      })
      .catch(function (error) {
        console.error("Error loading TB data:", error);
      });
  }
}

function initTreemap() {
  const treemapWidth = 980;
  const treemapHeight = 650;

  // Function to preprocess data into hierarchical format
  function convertToHierarchicalFormat(data) {
    const countryData = d3.rollup(
      data,
      (records) => d3.sum(records, (d) => d.e_mort_num || 0),
      (d) => d.country
    );

    const topCountries = Array.from(countryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map((d) => d[0]);

    const filteredData = data.filter(
      (d) =>
        topCountries.includes(d.country) && d.year >= 2010 && d.year <= 2023
    );

    const hierarchy = {
      name: "Global_TB_Mortality",
      children: [],
    };

    const regionGroups = d3.group(filteredData, (d) => d.g_whoregion);
    regionGroups.forEach((countries, region) => {
      const regionNode = {
        name: region,
        children: [],
      };

      const countryGroups = d3.group(countries, (d) => d.country);
      countryGroups.forEach((records, country) => {
        const yearNodes = records.map((record) => ({
          name: record.year.toString(),
          e_mort_num: record.e_mort_num,
          e_mort_100k: record.e_mort_100k,
        }));

        regionNode.children.push({
          name: country,
          children: yearNodes,
        });
      });

      hierarchy.children.push(regionNode);
    });

    return hierarchy;
  }

  const tooltip = d3.select("body").append("div").attr("class", "tooltip");
  d3.json("preprocessed_data.json").then((treeData) => {
    const hierarchicalData = convertToHierarchicalFormat(treeData);
    const tree_root = d3
      .hierarchy(hierarchicalData)
      .sum((d) => d.e_mort_num || 0)
      .sort((a, b) => b.value - a.value);
    const treemap = d3.treemap().size([treemapWidth, treemapHeight]).padding(2)(
      tree_root
    );

    const regionColorScale = d3.scaleOrdinal(d3.schemeSet2);
    const countryBaseColorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const svg = d3
      .select("#treemap")
      .append("svg")
      .attr("width", treemapWidth)
      .attr("height", treemapHeight);

    function renderTreemap(node) {
      svg.selectAll("*").remove();
      const nodes = svg
        .selectAll("g")
        .data(node.children || [node])
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

      nodes
        .append("rect")
        .attr("class", "block")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d) => {
          if (d.depth === 1) {
            // Region level
            return regionColorScale(d.data.name); // Assign region color
          } else if (d.depth === 2) {
            // Country level
            return countryBaseColorScale(d.data.name);
          } else if (d.depth === 3) {
            // Year level
            const countryMortalityValues = d.parent.children.map(
              (c) => c.data.e_mort_num || 0
            );
            const intensityScale = d3
              .scaleLinear()
              .domain([
                Math.min(...countryMortalityValues),
                Math.max(...countryMortalityValues),
              ])
              .range([
                countryBaseColorScale(d.parent.data.name),
                d3.color(countryBaseColorScale(d.parent.data.name)).darker(2),
              ]);

            return intensityScale(d.data.e_mort_num || 0);
          }
          return "#ccc";
        })
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1).html(`Region: ${
            d.parent?.parent?.data?.name || "Global"
          }<br>
                                   Country: ${
                                     d.parent?.data?.name || "Unknown"
                                   }<br>
                                   Year: ${d.data.name || "Unknown"}<br>
                                   TB Mortality: ${d.data.e_mort_num || 0}<br>
                                   Rate per 100k: ${d.data.e_mort_100k || 0}`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
          if (d.children) {
            updateBreadcrumb(d);
            renderTreemap(d);
            renderColorLegend(d);
          }
        });

      nodes
        .append("text")
        .attr("x", 5)
        .attr("y", 20)
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("fill", "white");
    }

    const breadcrumb = d3.select("#breadcrumb");

    function updateBreadcrumb(node) {
      const sequence = node
        .ancestors()
        .reverse()
        .map((d) => d.data.name);
      breadcrumb.html(
        sequence.map((d, i) => `<a data-index="${i}">${d}</a>`).join(" > ")
      );
      breadcrumb.selectAll("a").on("click", (event, d) => {
        const targetNode = node.ancestors().reverse()[
          event.target.dataset.index
        ];
        renderTreemap(targetNode);
        updateBreadcrumb(targetNode);
        renderColorLegend(targetNode);
      });
    }

    // Region, Country, and Year color legend
    function renderColorLegend(node) {
      const legendContainer = d3.select("#legend");
      legendContainer.html(""); // Clear existing legend

      if (node.depth === 0) {
        // Region-level legend
        const legendItems = regionColorScale.domain();
        legendItems.forEach((region) => {
          const legendItem = legendContainer
            .append("div")
            .attr("class", "item");
          legendItem
            .append("div")
            .style("background-color", regionColorScale(region));
          legendItem.append("span").text(region);
        });
      } else if (node.depth === 1) {
        // Country-level legend
        const legendItems = node.children.map((c) => c.data.name);
        legendItems.forEach((country) => {
          const legendItem = legendContainer
            .append("div")
            .attr("class", "item");
          legendItem
            .append("div")
            .style("background-color", countryBaseColorScale(country));
          legendItem.append("span").text(country);
        });
      } else if (node.depth === 2) {
        // Year-level legend based on mortality value intensity
        const yearMortalityValues = node.children.map(
          (c) => c.data.e_mort_num || 0
        );
        const yearIntensityScale = d3
          .scaleLinear()
          .domain([
            Math.min(...yearMortalityValues),
            Math.max(...yearMortalityValues),
          ])
          .range([d3.rgb("#f0f0f0"), d3.rgb("#ff0000")]);

        // Generate a gradient color box for intensity
        const legendItem = legendContainer.append("div").attr("class", "item");
        const gradient = legendItem
          .append("div")
          .style("width", "100px")
          .style("height", "20px")
          .style(
            "background",
            `linear-gradient(to right, ${yearIntensityScale(
              0
            )}, ${yearIntensityScale(1)})`
          );

        legendItem.append("span").text("Mortality Intensity (Year)");
      }
    }

    renderTreemap(tree_root);
    updateBreadcrumb(tree_root);
    renderColorLegend(tree_root);
  });
}
function clearSunburstVisualization() {
  // Remove the previous SVG or reset the container
  d3.select("svg").remove();
}

function initSunburst() {
  const width = 960;
  const height = 700;
  const radius = Math.min(width, height) / 2;

  // Create an SVG element with an inner group for transformation
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const tooltip = d3.select("#tooltip");

  // Load the TB data from JSON
  d3.json("preprocessed_data.json")
    .then(function (data) {
      console.log("TB Data Loaded:", data); // Debugging log to ensure data is loaded

      // Transform data to create a hierarchy suitable for the sunburst chart
      const nestedData = d3.group(data, (d) => d.country);
      let hierarchyData = {
        name: "Global TB Data",
        children: Array.from(nestedData, ([key, value]) => ({
          name: key,
          children: value.map((d) => ({
            name: `${d.year} - Incidence: ${d.e_inc_100k} per 100k`,
            value: d.e_inc_num,
          })),
        })),
      };

      // Limit to top 10 countries by total incidence rate
      hierarchyData.children = hierarchyData.children
        .sort(
          (a, b) =>
            d3.sum(b.children, (d) => d.value) -
            d3.sum(a.children, (d) => d.value)
        )
        .slice(0, 10);

      // Prepare the hierarchy of the data
      const root = d3
        .hierarchy(hierarchyData)
        .sum((d) => d.value) // Use the 'e_inc_num' field to represent the value
        .sort((a, b) => b.value - a.value);

      // Create a partition layout
      const partition = d3.partition().size([2 * Math.PI, radius])(root);

      // Color scale for categories
      const color = d3.scaleOrdinal(d3.schemeTableau10);

      // Create arc generator for sunburst chart
      const arc = d3
        .arc()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => d.y1);

      // Draw each arc segment
      const paths = g
        .selectAll("path")
        .data(root.descendants().filter((d) => d.depth))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color((d.children ? d : d.parent).data.name))
        .attr("stroke", "#fff")
        .style("cursor", "pointer")
        .each(function (d) {
          this._current = d;
        })
        .on("click", function (event, d) {
          if (d.children) {
            zoom(d);
          }
        })
        .on("mousemove", function (event, d) {
          tooltip.transition().duration(100).style("opacity", 0.9);
          tooltip
            .html(`<strong>${d.data.name}</strong><br>Cases: ${d.value}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(300).style("opacity", 0);
        });

      // Add zoom and pan functionality for the entire SVG element
      const zoomPan = d3
        .zoom()
        .scaleExtent([1, 5])
        .translateExtent([
          [-width, -height],
          [width * 2, height * 2],
        ])
        .on("zoom", function (event) {
          g.attr(
            "transform",
            `translate(${event.transform.x + width / 2}, ${
              event.transform.y + height / 2
            }) scale(${event.transform.k})`
          );
        });

      svg.call(zoomPan);

      // Zoom function for drill-down interactivity
      function zoom(d) {
        const zoomArc = d3
          .arc()
          .startAngle((d) => d.x0)
          .endAngle((d) => d.x1)
          .innerRadius((d) => (d.depth ? radius / d.depth : 0))
          .outerRadius((d) => radius);

        paths
          .transition()
          .duration(1000)
          .attrTween("d", function (d) {
            const i = d3.interpolate(this._current, d);
            this._current = i(1);
            return function (t) {
              return zoomArc(i(t));
            };
          });
      }

      // Add a legend for better understanding of categories
      const legend = d3.select("#legend");
      root.children.forEach((d) => {
        const legendItem = legend.append("div").attr("class", "legend-item");
        legendItem
          .append("div")
          .attr("class", "legend-color")
          .style("background-color", color(d.data.name));
        legendItem.append("span").text(d.data.name);

        // Interactive legend click functionality
        legendItem.on("click", function () {
          const isActive = legendItem.classed("inactive");
          legendItem.classed("inactive", !isActive);
          paths
            .filter((pathData) => pathData.data.name === d.data.name)
            .transition()
            .duration(300)
            .style("opacity", isActive ? 1 : 0.1);
        });
      });
    })
    .catch(function (error) {
      console.error("Error loading TB data:", error);
    });
}

function initMapGraph() {
  console.log("Initializing Map Graph");
  // JavaScript code for Map graph
  const svg = d3.select("#world-map");
  if (!svg.empty()) {
    const width = 1000;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    const tooltip = d3.select("#tooltip");

    const projection = d3
      .geoMercator()
      .scale(150)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    let currentZoomLevel = 1;

    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        svg.selectAll("path").attr("transform", event.transform);
        currentZoomLevel = event.transform.k;
      });

    svg.call(zoom);

    const dataMap = new Map();

    const loadData = async () => {
      const geojson = await d3.json("custom.geo.json");
      const csvData = await d3.csv("data.csv");

      csvData.forEach((row) => {
        dataMap.set(row.iso3, {
          e_inc_100k: +row.e_inc_100k,
          e_mort_100k: +row.e_mort_100k,
        });
      });

      const colorScale = d3
        .scaleQuantize()
        .domain([0, d3.max(csvData, (d) => d.e_inc_100k)])
        .range(d3.schemeReds[9]);

      const updateMap = (metric) => {
        svg
          .selectAll("path")
          .data(geojson.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d) => {
            const value = dataMap.get(d.properties.iso_a3);
            return value ? colorScale(value[metric]) : "#ccc";
          })
          .attr("stroke", "#333")
          .on("mouseover", (event, d) => {
            const value = dataMap.get(d.properties.iso_a3);
            tooltip
              .style("opacity", 1)
              .html(
                `<strong>${d.properties.admin}</strong><br>${
                  metric === "e_inc_100k" ? "Incidence" : "Mortality"
                }: ${value ? value[metric] : "No Data"}`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`);
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });

        updateLegend(colorScale, metric);
      };

      const updateLegend = (colorScale, metric) => {
        d3.select("#legend-gradient").style(
          "background",
          `linear-gradient(to right, ${colorScale.range().join(", ")})`
        );

        d3.select("#legend-title").text(
          metric === "e_inc_100k" ? "Incidence Rate" : "Mortality Rate"
        );
      };

      // Initial render
      updateMap("e_inc_100k");

      d3.select("#show-incidence").on("click", () => {
        updateMap("e_inc_100k");
      });

      d3.select("#show-mortality").on("click", () => {
        updateMap("e_mort_100k");
      });

      d3.select("#zoom-in").on("click", () => {
        svg.transition().duration(500).call(zoom.scaleBy, 1.2);
      });

      d3.select("#zoom-out").on("click", () => {
        svg.transition().duration(500).call(zoom.scaleBy, 0.8);
      });
    };

    loadData();
  }
}

function initForceGraph() {
  console.log("Initializing Force Graph");
  // JavaScript code for Force-directed graph
  const svg = d3.select("#vis1");
  if (!svg.empty()) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const overlay = d3.select(".overlay");
    const modal = d3.select(".modal");
    const closeModal = () => {
      modal.style("display", "none");
      overlay.style("display", "none");
    };
    d3.select(".close-btn").on("click", closeModal);
    overlay.on("click", closeModal);

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    d3.csv("data.csv").then((data) => {
      const cleanData = data.filter(
        (d) =>
          d.country &&
          !isNaN(d.e_mort_num) &&
          !isNaN(d.e_inc_100k) &&
          d.e_mort_num !== null &&
          d.e_inc_100k !== null
      );

      const latestData = {};
      cleanData.forEach((row) => {
        const country = row.country;
        const year = +row.year;
        if (!latestData[country] || year > latestData[country].year) {
          latestData[country] = row;
        }
      });

      const filteredData = Object.values(latestData);

      const topCountries = filteredData
        .sort((a, b) => +b.e_mort_num - +a.e_mort_num)
        .slice(0, 18);

      const regions = Array.from(
        d3.group(topCountries, (d) => d.g_whoregion),
        ([region, countries]) => ({ region, countries })
      );

      const regionColor = d3.scaleOrdinal(d3.schemeCategory10);
      const regionColorMap = new Map();
      regions.forEach((group, i) => {
        group.countries.forEach((country) => {
          regionColorMap.set(country.country, regionColor(i));
        });
      });

      const nodes = topCountries.map((d) => ({
        id: d.country,
        mort_num: +d.e_mort_num,
        inc_100k: +d.e_inc_100k,
        region: d.g_whoregion,
        data: d,
        color: regionColorMap.get(d.country),
      }));

      const links = [];
      nodes.forEach((node, i) => {
        nodes.forEach((otherNode, j) => {
          if (i !== j) {
            links.push({
              source: node.id,
              target: otherNode.id,
            });
          }
        });
      });

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(430)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(50))
        .on("tick", () => {
          node.attr("transform", (d) => `translate(${d.x},${d.y})`);
          link
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);
        });

      const drag = d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke-width", 1)
        .attr("stroke", "#999");

      const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .call(drag);

      node
        .append("circle")
        .attr("r", 40)
        .attr("fill", (d) => d.color)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 60)
            .style("fill", "pink");
          tooltip
            .style("visibility", "visible")
            .text(
              `${d.id}: ${d.mort_num} deaths, Incidence per 100k: ${d.inc_100k}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 40)
            .style("fill", (d) => d.color);
          tooltip.style("visibility", "hidden");
        })
        .on("click", function (event, d) {
          modal.style("display", "block");
          overlay.style("display", "block");
          d3.select(".modal-header").text(`Details for ${d.id}`);
          d3.select(".modal-content").html(`
                    <p><b>Country:</b> ${d.id}</p>
                    <p><b>Region:</b> ${d.region}</p>
                    <p><b>Population:</b> ${d.data.e_pop_num}</p>
                    <p><b>Mortality Number:</b> ${d.mort_num}</p>
                    <p><b>Incidence per 100k:</b> ${d.inc_100k}</p>
                    <p><b>Case Fatality Rate (CFR):</b> ${d.data.cfr_pct}%</p>
                  `);
        });

      node
        .append("text")
        .text((d) => d.id)
        .attr("dx", 25)
        .attr("dy", ".35em");
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Code to handle dropdown and button actions
  console.log("Document loaded");

  // Dropdown filter functionality
  const filterLabel = document.querySelector(".filter-label");
  const filterDropdown = document.getElementById("filterDropdown");
  const selectAllCheckbox = document.getElementById("selectAll");
  const filterCheckboxes = filterDropdown.querySelectorAll(
    "input[type='checkbox']"
  );

  filterLabel.addEventListener("click", function () {
    // Toggle the visibility of the dropdown menu
    filterDropdown.style.display =
      filterDropdown.style.display === "block" ? "none" : "block";
  });

  selectAllCheckbox.addEventListener("change", function () {
    // Check or uncheck all checkboxes when "Select All" is toggled
    filterCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });

  filterCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      // Update the "Select All" checkbox based on individual checkbox changes
      if (!checkbox.checked) {
        selectAllCheckbox.checked = false;
      } else if ([...filterCheckboxes].every((cb) => cb.checked)) {
        selectAllCheckbox.checked = true;
      }
    });
  });

  // Play and Pause buttons for timeline graph
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");

  playButton.addEventListener("click", function () {
    // Trigger play animation
    console.log("Play button clicked");
    playAnimation();
  });

  pauseButton.addEventListener("click", function () {
    // Trigger pause animation
    console.log("Pause button clicked");
    pauseAnimation();
  });

  // Event listener for year range slider
  const dateRange = document.getElementById("dateRange");
  const currentYearDisplay = document.getElementById("currentYear");

  dateRange.addEventListener("input", function () {
    // Update the displayed year and chart when the range input changes
    const currentYear = +dateRange.value;
    currentYearDisplay.textContent = currentYear;
    updateChart(currentYear);
  });

  console.log("Dropdown and button actions initialized");
});
