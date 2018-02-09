var chosen = { label: "name", hData: "", wData: "make", dData: "price" }
var d3 = d3, AFRAME = AFRAME;
AFRAME.registerComponent('barchart', {
  schema: {
    csv: {}
  },
  init: function () {
    var self = this;
    d3.dsv(",", this.data.csv, function(d) {
      return {
        name: d["Vehicle Name"],
        make: d["Vehicle Name"].replace(/ .*/,''),
        key: +d["Len"],
        width: +d["Width"],
        price: +d["Retail Price"]
      };
    }).then(function(data) {
      self.generate(data);
    });
  },

  generate: function (data) {
    
    var histoWidth = 4.0,
        histoDepth = 4.0,
        histoHeight = 1.5;
    
    var histoPadding = 0.4, //not in meters
        blockHeightPadding = 0.01,
        blockDepthPadding = 0.05;
    
    var depthBinNum = 20;

    //// End of configurations
    
    var xScale = d3.scaleBand() 
      .range([0, histoWidth])
      .paddingInner(histoPadding);
    
    var zScale = d3.scaleLinear() 
      .range([0, -histoDepth]);

    var el = this.el;
    
    var depthDataArray = data.map(function(d) { return d[chosen.dData]; });
    var dDataExtent = d3.extent(depthDataArray);
    var widthDataArray = data.map(function(d) { return d[chosen.wData]; });
    
    xScale.domain(widthDataArray);
    zScale.domain(dDataExtent).ticks(depthBinNum);
    var zScaleTicks = zScale.ticks();
    var getBin = function(d) {
      var i;
      for (i = 0; i < zScaleTicks.length; i++) {
        if (d < zScaleTicks[i]) break;
      }
      return {i: i, x0: zScaleTicks[i]};
    }
    
    var bins = {}
    var maxBinHeight = -1;
    data.forEach(function(d) {
      if (!bins[d[chosen.wData]]) bins[d[chosen.wData]] = {};
      var wbin = bins[d[chosen.wData]];
      var dbin = getBin(d[chosen.dData]);
      const z = zScale(dbin.x0);
      if (!wbin[dbin.i]) wbin[dbin.i] = 0;
      wbin[dbin.i] += 1
      if (wbin[dbin.i] > maxBinHeight) maxBinHeight = wbin[dbin.i];
    });
    
    var dHisto = d3.histogram()
      .thresholds(zScaleTicks)
      (depthDataArray);

    var yScale = d3.scaleLinear()
      .domain([0, maxBinHeight])
      .range([0, histoHeight]);

    var color = d3.scaleLinear().domain(dDataExtent)
      .interpolate(d3.interpolateHcl).range(['#77ffd1', '#e0282b']);

    var blockHeight = histoHeight / maxBinHeight - blockHeightPadding;
    var blockDepth = histoDepth / 1 - blockDepthPadding;
    var blockWidth = xScale.bandwidth();
    // Select the current entity object just like an svg
    var chartEntity = d3.select(el);
    var chartHolderEntity = d3.select(el.parentNode);
    
    chartHolderEntity.attr('position' , "0 0 -3");
    chartEntity.attr('position' , -histoWidth / 2 + " 0.002 " + ((histoDepth / 2)));
    chartHolderEntity.attr('geometry' , "width: " + (histoWidth + 1) + "; height: 0.006; depth: " + (histoDepth + 1));
    // we use d3's enter/update/exit pattern to draw and bind our dom elements
    var bars = chartEntity.selectAll('a-box.bar').data(data);
    bars.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
        const x = xScale(d[chosen.wData]);
        const dbin = getBin(d[chosen.dData]);
        const z = zScale(dbin.x0);
        bins[d[chosen.wData]][dbin.i] -= 1
        var hval = bins[d[chosen.wData]][dbin.i]
        const y = (yScale(hval)) + blockHeight / 2;        
        return x + " " + y + " " + z   
      })
      .attr('width', blockWidth)
      .attr('depth', blockDepth)
      .attr('height', blockHeight)
      // .attr('opacity', alpha)
      .attr('color', function(d) { return color(d[chosen.dData]); })
      .attr('shadow', "cast: true")
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
           .attr('color', "#337");

        d3.select(this).append("a-text")
          .attr('color', color(d[chosen.dData]))
          .attr('align', 'center')
          .attr('position', function() { return "0 " + 0 + " 0"; } )
          .attr('scale', '0.5 0.5 0.5')
          // .attr('look-at', '[camera]') todo
          .attr('value', function() { return d[chosen.label] + "\n" + d[chosen.dData]; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(300)
          .attr('color', color(d[chosen.dData]))

        d3.select(this).select("a-text").remove();
      })
    
    d3.select("#axes").attr('position', (-histoWidth / 2) + " 0.005 " + (histoDepth / 2))
    var xAxis = d3.select("#x-axis");
    var xLabels = xAxis.append("a-entity").classed("labels", true).selectAll("a-text.axis").data(xScale.domain());
    xLabels.enter().append("a-text").classed("axis", true)
      .attr('color', '#FFF')
      .attr('align', 'right')
      .attr('position', function(d, i) { return (xScale(d)) +" 0 0"; })
      .attr('rotation', '-90 90 0')
      .attr('scale', '0.5 0.5 0.5')
      .attr('value', function(d) { return d; })
    var xLines = xAxis.append("a-entity").classed("lines", true).selectAll("a-box.axis").data(xScale.domain());
    xLines.enter().append("a-box")
      .attr('width', 0.005)
      .attr('depth', histoDepth)
      .attr('height', 0.002)
      .attr('color', '#FFF')
      .attr('position', function(d) {return (xScale(d) + (xScale.step()) / 2) + ' 0 ' + (-histoDepth / 2);});
    var xAxisLine = xAxis.append("a-box")
      .attr('width', 0.005)
      .attr('depth', histoDepth)
      .attr('height', 0.002)
      .attr('color', '#FFF')
      .attr('position', (xScale.step() / -2) + ' 0 ' + (-histoDepth / 2));

    console.log(zScaleTicks)
    console.log(zScale.domain())
    var zAxis = d3.select("#z-axis");
    var zLabels = zAxis.append("a-entity").classed("labels", true).selectAll("a-text.axis").data(zScaleTicks);
    zLabels.enter().append("a-text").classed("axis", true)
      .attr('color', '#FFF')
      .attr('align', 'right')
      .attr('position', function(d, i) { return "0 0 " + zScale(d); })
      .attr('rotation', '-90 0 0')
      .attr('scale', '0.5 0.5 0.5')
      .attr('value', function(d) { return d; })
    var zLines = zAxis.append("a-entity").classed("lines", true).selectAll("a-box.axis").data(zScaleTicks);
    zLines.enter().append("a-box")
      .attr('width', histoWidth)
      .attr('depth', 0.005)
      .attr('height', 0.002)
      .attr('color', '#FFF')
      .attr('position', function(d) {return (histoWidth / 2) + ' 0 ' + zScale(d);});
    var zAxisLine = zAxis.append("a-box")
      .attr('width', histoWidth)
      .attr('depth', 0.005)
      .attr('height', 0.002)
      .attr('color', '#FFF')
      .attr('position', (histoWidth / 2) + ' 0 ' + 0);
    // add x-axis
    // x - lines
    // d3.select(this).append("a-box")
    //       .attr('color', "#FFF"))
    //       .attr('position', function() { return "0 " + 0 + " 0"; } )
    //       .attr('rotation', '-45 0 0')
    //       .attr('scale', function() { return '3 0.5 0.5';} )
    // labels
    // d3.select(this).append("a-text")
    //       .attr('color', "#FFF"))
    //       .attr('align', 'center')
    //       .attr('position', function() { return "0 " + 0 + " 0"; } )
    //       .attr('scale', '0.5 0.5 0.5')
    //       .attr('rotation', '-45 0 0')
    //       .attr('value', function() { return d[chosen.wData]; });
    // add y-axis
  }
});