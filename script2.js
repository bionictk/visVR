var d;
AFRAME.registerComponent('barchart', {
  schema: {
    csv: {}
  },
  init: function () {
    var self = this;
    d3.dsv(",", this.data.csv, function(d) {
      return {
        name: d["Vehicle Name"],
        key: +d["Len"],
        value: +d["Width"]
      };
    }).then(function(data) {
      self.generate(data);
    });
  },

  generate: function (data) {
    var el = this.el;
    // default alpha for bars
    var alpha = 0.6;
    var scaleMap = data.map(function(d) {return d.value;});

    // Scale the height of our bars using d3's linear scale
    var hscale = d3.scaleLinear()
      .domain([0, d3.max(scaleMap)])
      .range([0, 3]);

    var color = d3.scaleLinear().domain([0, d3.max(scaleMap)])
      .interpolate(d3.interpolateHcl).range(['#ffb3ba', '#bae1ff']);

    // Select the current enity object just like an svg
    var currentEntity = d3.select(el);

    // we use d3's enter/update/exit pattern to draw and bind our dom elements
    var bars = currentEntity.selectAll('a-box.bar').data(data);
    // we set attributes on our cubes to determine how they are rendered
    bars.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
      const x =  i * 0.8 - (data.length / 2);
      const y = hscale(d.value)/2;
      const z = -3
      return x + " " + y + " " + z   
    })
      .attr('width', function(d) { return 0.5; })
      .attr('depth', function(d) { return 0.5; })
      .attr('height', function(d) { return hscale(d.value); })
      .attr('opacity', alpha)
      .attr('color', function(d) { return color(d.value); })
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
          .attr('opacity', 0.9);

        d3.select(this).append("a-text")
          .attr('color', color(d.value))
          .attr('align', 'center')
          .attr('position', function(d) { return hscale(d.value) / 2 + 0.5; } )
          .attr('scale', '1 1 1')
          .attr('value', function(d) { return d.name; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(1000)
          .attr('opacity', alpha);

        d3.select(this).select("a-text").remove();
      })
  }
});