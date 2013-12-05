/**
 * @module {meditations.MottoView} View of selected mottos from the force view
 *
 * Requires:
 *   options.forceView {meditations.ForceView} ForceView instance so we can trigger motto highlights
 *
 * Events:
 */
define(["jquery", "d3", "lodash", "backbone"],
function($, d3, _, Backbone) {


return Backbone.View.extend({
  initialize: function(options) {
    if (!options.forceView)
      throw new Error("ForceView instance required!");

    this.listenTo(this.options.forceView, "hoverNode", this._pickAndShowMotto);
    this.listenTo(this.options.forceView, "clickNode", this._pickNextMotto);
  },

  _pickNextMotto: function(forceView, wordNode) {
    this._curMottoI = (this._curMottoI + 1) % wordNode.mottos.length;
    this._showMotto(wordNode, {
      meditateWordMs: 800
    });
  },

  _pickAndShowMotto: function(forceView, wordNode) {
    if (this._curWordNode === wordNode)
      return this._pickNextMotto(forceView, wordNode);

    this._curWordNode = wordNode;
    this._curMottoI = Math.floor(Math.random() * wordNode.mottos.length);
    this._showMotto(wordNode);
  },

  _showMotto: function(wordNode, opts) {
    opts = opts || {};

    // Default Options:
    opts = _.extend({

      /* How long to highlight the selected word before fading in the rest of the motto */
      meditateWordMs: 3000

    }, opts);

    var motto = this._curMotto = wordNode.mottos[this._curMottoI];

    forceView.selectMotto(motto);


    var mottoChunks = motto.motto
    .match(/[A-z']+/g)
    .map(function(w) {
      return {
        raw: w,
        wordNodeKey: w.toLowerCase(),
        isSelected: w.toLowerCase() === wordNode.id
      };
    });

    console.log("\n\n-----------------");
    wordNode.mottos.forEach(function(m, i) {
      console.log((m === motto ? "> " : "") + m.motto + "   (" + m.university + ")");
    });
    console.log("   - \"" + wordNode.id + "\" (" + wordNode.count + ")");

    // Draw the selector dots
    $("#num_mottos").html( wordNode.mottos.reduce(
      function(html, m) {
        return html + "<i class='fa fa-" + (m === motto ? "circle" : "circle-o") + "'></i> ";
      }, ''
    ));

    d3.select("#motto_render").selectAll("span").remove();
    var mottoSpans = d3.select("#motto_render").selectAll("span")
      .data(mottoChunks)
    .enter().append("span")
      .attr("class", function(d) { return d.isSelected ? "selected" : ""; })
      .style("opacity", function(d) { return d.isSelected ? 1 : 0; })
      .style("color", function(d) { return d.isSelected ? "red" : ""; })
      .text(function(d) {return d.raw + " "; });

    // do nothing, just reflect on the word for 5 seconds
    mottoSpans.transition().duration(opts.meditateWordMs)
    .each("end", function() {
      d3.select(this).transition()
      .duration(1000)
      .style("opacity", 1)
      .style("color", "black");
    });
    d3.select("#motto_school")
    .interrupt()
      .text(" - " + motto.university)
      .style("opacity", 0)
    .transition().duration(opts.meditateWordMs)
    .each("end", function() {
      d3.select(this).transition()
      .duration(1000)
      .style("opacity", 1);
    });

  }
});

});