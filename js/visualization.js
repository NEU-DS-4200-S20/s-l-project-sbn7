// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

  // set general variable for the map
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 400 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;
  var scale = 6000;

  // select the map svg
  var mapsvg = d3.select("#map-div")
  .append("svg")
  .classed("map-svg", true)
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // make the projection for the map
  var projection = d3.geoAlbers()
    .translate([width/2, height/2])
    .center( [24.25, 43] )
    .scale(scale);

  var path = d3.geoPath().projection(projection)


  // read the json data for states and zip codes, read csv vendor data
  d3.json("data/states.geojson", function(states) {
    d3.json("data/zips.geojson", function(zips) {
      d3.csv("data/vendors.csv", function(vendors) {
        drawMap(states, zips, vendors);
        drawTable();
      });
    });
  });

  d3.csv('data/vendors_old_treemap.csv', function(data) {
    drawTreeMap(data);
  });


  // draw the map
  function drawMap(states, zips, vendors) {
    var mapGroup = mapsvg.append("g").attr("class", "mapGroup")

    // draw the states
    mapGroup.append("g")
      .selectAll("path")
      .data(states.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr( "fill", "#e3e3e3" )
      .attr( "stroke", "#333")

    // determines if the given zip code has a vendor in it
    let hasVendor = function(d) {
      let vendorZips = vendors.map(function (s) { return s.ZIP} );
      let isVendor = vendorZips.includes(d.properties.ZCTA5CE10);
      return(isVendor)
    }

    // adds the zip codes containing vendors to the map
    mapGroup.append("g")
      .attr("id", "zips")
      .selectAll("path")
      .data(zips.features)
      .enter()
      .append("path")
      .attr("fill", "none")
      .classed("zips", hasVendor)
      .attr("d", path);

    // add the map legend
    var mapLegend = d3.select("#map-legend")
      .append("svg") 
      .attr("width", 300)
      .attr("height", 100)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var legend = mapLegend
     .append("g")
     .attr("class", "legend")
     .attr("width", 300)
     .attr("height", 100)
     .selectAll("g")
     .data([
        {'color': '#fc8d62', 'label': 'Participating Vendor Zip Codes'}, 
        {'color': '#a6d854', 'label': 'Selected Vendor Zip Codes'}, 
        {'color': '#e3e3e3', 'label': 'States'},
      ])
     .enter()
     .append("g")
     .attr("transform", function(d, i) {
       return "translate(0," + (i * 20 + 20) + ")";
      });
    
    mapLegend.append("text")
      .attr("x", 5)             
      .attr("y", 10)
      .style("font-size", "24px") 
      .style("text-decoration", "underline")  
      .text("Map Legend");

    legend
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d) { 
        return d.color
      });
    
    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return d.label });
  }


  // adds a brush to the map
  var brush = d3.brush()
    .on("start brush", highlight)
    .on("end", brushend);

  d3.selectAll(".map-svg").append("g").call(brush)


  // determines what to do when the map brush is started
  function highlight() {

    // remove any current selection
    d3.selectAll(".zips.final").classed("final", false);
    d3.selectAll("rect.final").classed("final", false);

    // if nothing is selected don't do anything else
    if (d3.event.selection == null) {
      return;
    }

    // get the bounds of the selection
    let [[x0, y0], [x1, y1]] = d3.event.selection
    let all_zips = d3.selectAll(".zips")

    // select the zips within the bounds
    all_zips.classed("selected",
      d =>
        x0 <= projection([d.properties.lon, d.properties.lat])[0] &&
        x1 >= projection([d.properties.lon, d.properties.lat])[0] &&
        y0 <= projection([d.properties.lon, d.properties.lat])[1] &&
        y1 >= projection([d.properties.lon, d.properties.lat])[1]
    );

    // selects the vendors to match the map selection
    selectVendors()
  }


  // selects the vendors based on the current zip selection
  function selectVendors() {
    zips_selected = d3.selectAll(".zips.selected").data()
    .map(function (s) { return s.properties.ZCTA5CE10} );
  
    d3.selectAll("rect.vendor")
    .classed("selected", function (v) { return zips_selected.includes(v.data.ZIP)
     });
  }


  // determines what to do when the map or treemap brush ends
  function brushend() {

    // make selection final for zips and treemap
    let selection = d3.selectAll(".zips.selected")
    selection.classed("selected", false)
    selection.classed("final", true)

    let tree_selection = d3.selectAll("rect.selected")
    tree_selection.classed("selected", false)
    tree_selection.classed("final", true)

    drawTable()
  }


  // draws the table with the appropriate selected data 
  function drawTable() {

    d3.csv("data/vendors.csv", function(data) {
        // removes any current table
        d3.select("#table-div table").remove();
    
        // adds the table back
        let table = d3.select("#table-div")
        .append("table")
        .classed("my-table", true);
    
        // adds the table headers
        let tableHeaders = Object.keys(data[0]);
    
        let thead = table.append('thead');
    
        thead.append('tr')
        .selectAll('th')
        .data(tableHeaders).enter()
        .append('th')
        .text(function (column) { return column; })
    
        // filters to get only the selected vendors
        let vendors_selc = data.filter(function (d) {
          let vendorIndex = d.Index;
          zips_selected = d3.selectAll("rect.final").data()
          .map(function (s) {return s.id} );
          let isSelected = zips_selected.includes(vendorIndex);
          return isSelected;
        });
    
        // adds the table body
        let tbody = table.append('tbody');
    
        tbody.selectAll('tr')
          .data(vendors_selc)
          .enter()
          .append('tr')
          .selectAll('td')
          .data(function (row) {
            return tableHeaders.map(function (column) {
             return { column: column, value: row[column] };
            });
          })
          .enter()
          .append('td')
          .text(function (d) { return d.value; });
    });
  }


// set the dimensions and margins of the treemap
var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 600 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;


// append the svg object to the body of the page
var treesvg = d3.select("#tree-div")
            .append("svg")
            .classed("tree-svg", true)
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");


// draw the tree map
function drawTreeMap(data) {
  var treeGroup = treesvg.append("g").attr("class", "treeGroup")

  // stratify the data: reformatting for d3.js
  var root = d3.stratify()
    .id(function(d) { return d.Index; })   // Name of the entity 
    .parentId(function(d) { return d.Parent; })   // Name of the parent (column name is parent in csv)
    (data)
    .sum(function(d) { return +d.Perc_Adj })   // Compute the numeric value for each entity
    .sort(function comparator(a, b) {
      return b.value - a.value;
    })
  // Then d3.treemap computes the position of each element of the hierarchy
  // The coordinates are added to the root object above
  d3.treemap()
    .size([width, height])
    .padding(4)
    (root)

// use this information to add rectangles:
  treeGroup
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .classed("vendor", true)
      .classed("herbs", function(d) {
        return d.data.Category == "Herbs/Plants"})
      .classed("mushrooms", function(d) {
        return d.data.Category == "Mushrooms"})
      .classed("other", function(d) {
        return d.data.Category == "Other"})
      .classed("vegetables", function(d) {
        return d.data.Category == "Vegetables"});

  // and to add the text labels
  treeGroup
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .selectAll("tspan")
    .data( d => {
      return d.data.Index.split(/(?=[A-Z][^A-Z])/g)
              .map(v => {
                  return {
                      text: v,
                      x0: d.x0,                        // keep x0 reference
                      y0: d.y0                         // keep y0 reference
                  }
              });
    })
      .enter()
      .append('tspan')
      .attr("x", (d) => d.x0 + 5)
      .attr("y", (d, i) => d.y0 + 15 + (i * 10))       // offset by index 
      .text((d) => d.text)
      .attr("font-size", "0.6em")
      .attr("fill", "black");

      // add the treemap legend
      var treeLegend = d3.select("#tree-legend")
      .append("svg") 
      .attr("width", 400)
      .attr("height", 150)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

      var legend = treeLegend
      .append("g")
      .attr("class", "legend")
      .attr("width", 400)
      .attr("height", 150)
      .selectAll("g")
      .data([
        {'color': '#c2a486', 'label': 'Mushrooms'}, 
        {'color': '#84bf93', 'label': 'Vegetables'}, 
        {'color': '#84b1bf', 'label': 'Herbs/Plants'},
        {'color': '#947bb8', 'label': 'Other'},
      ])
      .enter()
      .append("g")
      .attr("transform", function(d, i) {
        return "translate(0," + (i * 20 + 20) + ")";
      });

      treeLegend.append("text")
      .attr("x", 5)             
      .attr("y", 10)
      .style("font-size", "24px") 
      .style("text-decoration", "underline")  
      .text("Treemap Legend");
    
      legend
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d) { 
        return d.color
      });
    
    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return d.label });
  }


  // adds the treemap brush
  var treeBrush = d3.brush()
  .on("start brush", treeHighlight)
  .on("end", brushend);
  
  d3.selectAll(".tree-svg").append("g").call(treeBrush);
  

  // highlights the treemap when it is brushed over
  function treeHighlight() {
      // remove any current selection
      d3.selectAll("rect").classed("final", false);
      d3.selectAll(".zips.final").classed("final", false);
  
      // if nothing is selected don't do anything else
      if (d3.event.selection == null) {
        return;
      }
  
      // get the bounds of the selection
      let [[x0, y0], [x1, y1]] = d3.event.selection
      let all_rect = d3.selectAll("rect.vendor")
  
      // select the rects within the bounds
      all_rect.classed("selected",
        d =>
          x0 <= d.x0 &&
          x1 >= d.x1 &&
          y0 <= d.y0 &&
          y1 >= d.y1);

      // makes sure the zip codes are highlighted too  
      selectZips();
    }


    // highlights the zip codes to match the highlighted treemap
    function selectZips() {
      vendor_zips = d3.selectAll("rect.vendor.selected").data().map(function (s) { return s.data.ZIP} );

      let all_zips = d3.selectAll(".zips")

      // select the zips within the bounds
      all_zips.classed("selected", function(z) {
        return vendor_zips.includes(z.properties.ZCTA5CE10)
      });
    }

  })()); 