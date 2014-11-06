/**
 * Grabs data, parses into force-view links, and returns it as a jquery promise
 */
define(['jquery', '_', 'd3'], function($, _, d3) {

  var promiseData = $.Deferred();

  d3.json('./data.json', function(error, data) {
    if (error) {
      console.log("[promiseData] Error retrieving json");
      return promiseData.reject(error);
    }

    var nodesIdx = {},
        nodes;

    // create force-view nodes
    nodes = data.entities.map(function(name) {
      var n = {
        name: name,

        friend: [],
        enemy: [],
        complicated: [],

        friendIdx: {},
        enemyIdx: {},
        complicatedIdx: {}
      };
      nodesIdx[name] = n;
      return n;
    });

    /* create force-view links
     * Note: our links here are bi-directional (ie if a is friends with b, b is friends with a).  Luckily, the data
     * format does not define the same relationship from both sides (specifies only a to b, not the duplicate b to a).
     * Therefore, we don't need to de-dupe, and 'source' and 'destination' assignments are arbitrary and reversable.
     */
    var links = [];
    _.pairs(data.pairs).forEach(function(source) {
      var sourceNode = nodesIdx[source[0]];
      _.pairs(source[1]).forEach(function(target) {
        var targetNode = nodesIdx[target[0]],
            type = target[1]; // friend, enemy, or complicated

        sourceNode[type].push(targetNode);
        targetNode[type].push(sourceNode);

        sourceNode[type + 'Idx'][targetNode.name] = true;
        targetNode[type + 'Idx'][sourceNode.name] = true;

        links.push({
          id: sourceNode.name + "__" + targetNode.name,
          source: sourceNode,
          target: targetNode,
          type: type
        });
      });
    });

    console.log("[promiseData] Got the data");
    promiseData.resolve({
      nodesIdx: nodesIdx,
      nodes: nodes,
      links: links
    });
  });

  return promiseData.promise();
});