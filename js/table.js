function table() {
  let ourBrush = null,
    selectableElements = d3.select(null),
    dispatcher;
  function chart(selector, data) {

    let table = d3.select(selector)
      .append("table")
      .classed("my-table", true);

    let tableHeaders = Object.keys(data[0]);

    let thead = table.append('thead');

    thead.append('tr')
      .selectAll('th')
      .data(tableHeaders).enter()
      .append('th')
      .text(function (column) { return column; })

    let tbody = table.append('tbody');

    tbody.selectAll('tr')
      .data(data)
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

    d3.selectAll('tr').classed("selected", d => {
      return selectedData.includes(d)
    });
  };

  return chart;
}