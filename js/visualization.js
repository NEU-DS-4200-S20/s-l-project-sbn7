// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

  
  var width = 960;
  var height = 500;

  var svg = d3.select("#vis-svg")
    .attr("width", width)
    .attr("height", height);

  var projection = d3.geoAlbersUsa()
    .translate([width/2, height/2])
    .scale(width);

  var path = d3.geoPath().projection(projection)

  d3.json("data/states.geojson", function(states) {
    d3.json("data/zips.geojson", function(zips) {
      drawMap(states, zips);
    });
  });

  function drawMap(states, zips) {
    console.log(states);
    console.log(zips);

    var mapGroup = svg.append("g").attr("class", "mapGroup")

    mapGroup.append("g")
      .selectAll("path")
      .data(states.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr( "fill", "#ccc" )
      .attr( "stroke", "#333")
    

  }



})());
