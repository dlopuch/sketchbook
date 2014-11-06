//common configuration
require(["/sketchbook_config.js"], function() {

require([
  "jquery",
  "mec/promiseData"
], function($, promiseData) {

  var DEFAULT_W = 600,
      DEFAULT_H = 500;

  opts = {};

  var svg, linkEls = [], nodeEls, textEls;

  function forceTick() {
    linkEls
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    nodeEls
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    textEls
      .attr("x", function(d) { return d.x + 8; })
      .attr("y", function(d) { return d.y + 6; });
  };

  window.updateShownLinks = function updateShownLinks(listOfLinks) {
    var links;
    if (typeof listOfLinks === 'string')
      links = window.allLinks[listOfLinks];
    else
      links = _.flatten(listOfLinks.map(function(key) { return allLinks[key];}), true);

    //window.force.links(links).start();

    linkEls = svg.selectAll('.link').data(links, function(l) { return l.id; });

    linkEls.exit().remove();
    linkEls.enter().insert("line", "text")
      .attr('class', function(l) { return "link " + l.type; })
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  };

  promiseData.done(function(nodesAndLinks) {

    svg = d3.select("#fv").append("svg:svg")
    .attr("width",  opts.w || DEFAULT_W)
    .attr("height", opts.h || DEFAULT_H);

    var links = window.allLinks = {
      friend      : nodesAndLinks.links.filter(function(l) { return l.type === 'friend'; }),
      enemy       : nodesAndLinks.links.filter(function(l) { return l.type === 'enemy'; }),
      complicated : nodesAndLinks.links.filter(function(l) { return l.type === 'complicated'; })
    };

    window.force = d3.layout.force()
    .nodes(nodesAndLinks.nodes)
    .charge(-500)
    .links(nodesAndLinks.links.filter(function(l) { return l.type !== 'enemy'; }))
    .linkDistance(function(l) {
      if (l.type === 'friend')
        return 20;
      else if (l.type === 'complicated')
        return 50;
      else
        return 100;
    })
    .linkStrength(function(l) {
      if (l.type === 'friend')
        return 1;
      else if (l.type === 'complicated')
        return 0.1;
      else
        return 0;
    })
    .on("tick", forceTick)
    .size([opts.w || DEFAULT_W,
           opts.h || DEFAULT_H])
    .start();

    updateShownLinks('friend');

    nodeEls = svg.selectAll('.node').data(nodesAndLinks.nodes, function(n) { return n.name; });
    nodeEls.exit().remove();
    nodeEls.enter().insert('circle')
      .attr('class', 'node')
      .attr('cx', function(n) { return n.x; })
      .attr('cy', function(n) { return n.y; })
      .attr('r', 5)
      .call(force.drag)
      .on('click', function(n) { console.log(n.name); })
      .on('mouseover', function(fromNode) {
        nodeEls.attr('class', function(relatedNode) {
          if (relatedNode === fromNode)
            return 'node';
          else if (fromNode.friendIdx[relatedNode.name])
            return 'node friend';
          else if (fromNode.complicatedIdx[relatedNode.name])
            return 'node complicated';
          else
            return 'node enemy';
        });

        textEls.attr('class', function(relatedNode) {
          if (relatedNode === fromNode)
            return 'entity-label';
          else if (fromNode.friendIdx[relatedNode.name])
            return 'entity-label friend';
          else if (fromNode.complicatedIdx[relatedNode.name])
            return 'entity-label complicated';
          else
            return 'entity-label enemy';
        });

        linkEls.attr('class', function(link) {
          if (link.source !== fromNode && link.target !== fromNode)
            return 'link outfocus ' + link.type;
          else
            return 'link ' + link.type;
        });


      })
      .on('mouseout', function(fromNode) {
        nodeEls.attr('class', 'node');

        textEls.attr('class', 'node');

        linkEls.attr('class', function(link) { return 'link ' + link.type; });
      });

    textEls = svg.selectAll('text.entity-label').data(nodesAndLinks.nodes, function(n) { return n.name; });
    textEls.exit().remove();
    textEls.enter().insert('text', '.node')
      .attr('class', 'entity-label')
      .attr('x', function(n) { return n.x; })
      .attr('y', function(n) { return n.y; })
      .html(function(n) { return n.name; });
  });

}
);

});