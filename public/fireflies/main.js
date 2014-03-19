
require(["/sketchbook_config.js"], function() { // load master configuration

  require(
    ['jquery', 'lodash',
     'fireflies/promiseCommentTree',
     'fireflies/preparseTree',
     'fireflies/treeToAuthorNodes',

     'fireflies/model/AuthorNodeEmitter',
     'fireflies/view/ForceView',
     'fireflies/view/SliderView'
    ],
    function($, _, promiseCommentTree, preparseTree, treeToAuthorNodes,
             AuthorNodeEmitter,
             ForceView,

             SliderView) {

      promiseCommentTree.done(function(rootComment) {
        window.rootComment = rootComment;
        console.log('rootComment:', rootComment);
        preparseTree(rootComment);
        window.authorNodesEtc = treeToAuthorNodes(rootComment);
        console.log('authorNodesEtc:', authorNodesEtc);

        // demo cludge: luckysunbunny's comment was created well after all the others.  To avoid unbalanced timeline,
        // lets just filter out that outlier
        authorNodesEtc.allComments = authorNodesEtc.allComments.filter(function(d) {return d.author !== 'luckysunbunny';});
        delete authorNodesEtc.authorDataByAuthor.luckysunbunny;
        authorNodesEtc.authorNodes = authorNodesEtc.authorNodes.filter(function(d) {return d.author !== 'luckysunbunny';});
        authorNodesEtc.links = authorNodesEtc.links.filter(function(d) {return d.sourceAuthor !== 'luckysunbunny';});

        window.authorNodeEmitter = new AuthorNodeEmitter(
          _.merge({
            linkWindowPercentage: 0.01
          }, authorNodesEtc)
        );

        window.forceView = new ForceView({
          el: '#force_view',
          model: authorNodeEmitter,
          force: {
            charge: function(d) {
              return d.authorForceViewCharge || -200;
            }
          }
        });

        window.sliderView = new SliderView({
          max: authorNodeEmitter.getMaxAuthorTs(),
          min: authorNodeEmitter.getMinAuthorTs()
        });

        var currentTs;
        sliderView.on('newSliderValue', function(value) { currentTs = value; });

        // wire up the slider to the emitter
        authorNodeEmitter.listenTo(sliderView, 'newSliderValue', authorNodeEmitter.emitAuthorsUpToTs);

        console.log("Ready to go.  Execute: try{ forceView.update() } catch(e) {console.log(e.stack); }");

        // experiments in animating
        forceView.on('updateNodesAndLinks', function(fv, enterNodes, nodes, enterLinks, links) {

          var authorsWhoMadeComments = {},
              authorsInPlay = {};

          enterLinks.each(function(d) {
            if (d) {
              authorsWhoMadeComments[ d.sourceAuthor ] = d;
            }
          });
          links.each(function(d) {
            if (d) {
              authorsInPlay[ d.sourceAuthor ] = d;
            }
          });

          nodes.each(function(d) {
            if (authorsWhoMadeComments[d.author]) {
              d.authorForceViewCharge = 1; // light attractor -- fly towards its parent!
            } else if (authorsInPlay[d.author]) {
              // Do nothing... when the link transition below finishes, it will put this guy to -30 / light-repulsor
            } else {
              d.authorForceViewCharge = -200; // heavy repulsor
            }
          });

          // ANIMATE NEW LINKS:
          // All new links: three step animation
          // 1) Initialize new links to red/transparent
          // 2) Transition, each with its staggered delay (but 0 transition length... just want the delay)
          // 3) When these end, suddenly make transparent, then create a new transition that fades in
          // (Note that transition.transition() doesn't work when the first transition is delayed... overrides it)
          var i=0;
          enterLinks
          .style({stroke: 'red', opacity: 0})
          .transition()
          .delay(function(d) {
            if (d) {
              // In the enter selection, some elements are undefined.  Don't want to use argument[1] as i b/c it still
              // counts the undefineds.  Make our own i counter to get accurate "this is the i-th entering item" counts
              return (i++)*50;
            }
          })
          .duration(0)
          .each('end', function(d) {

            d3.select('svg').selectAll('circle.node')
            .data([d.source], function(d) { return d.id; })
            .filter(function(d) {
              // REALLY SUBTLE BEHAVIOR:
              // This animation is delayed (based on the link's stagger).  If the user makes a lot of nodes enter,
              // they're going to be staggered.  If the user then quickly slides back to make this node exit BEFORE
              // the stagger delay, this transition will cancel the exit animation and the node will remain perpetually
              // on the screen.  To avoid that, we ignore flashing any nodes currently exiting
              return !d[fv.id].isExitting;
            })
            .style({fill: 'red'})
            .transition()
            .duration(500)
            .style({fill: 'steelblue'});

            d3.select(this)
            .style({opacity: 1})
            .transition()
            .style({stroke: '#ddd', opacity: 1})
            .transition()
            .each(function(d) {
              d.source.authorForceViewCharge = -30;
              fv.force.start(); // restart force view to make attractor change stick
            });
          });
        });
      })
      .fail(function() {
        console.log("ERROR loading comment trees", arguments);
      });
    }
  );

});