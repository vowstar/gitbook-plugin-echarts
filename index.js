var path    = require('path');
var phantom = require('phantom');
var Q       = require('q');

module.exports = {
  blocks: {
    sequence: {
      process: function(blk) {
        var deferred = Q.defer();

        var code    = blk.body;
        var options = this.book.options.pluginsConfig['sequence-diagrams'];
        var width   = blk.kwargs['width'];

        phantom.create().then(function(ph) {
          ph.createPage().then(function(page) {
            var pagePath = path.join(__dirname, 'renderer.html');
            page.open(pagePath).then(function(status) {
              var result = page.evaluate(function(code, options, width) {
                return render(code, options, width);
              }, code, options, width);
              ph.exit();
              deferred.resolve(result);
            });
          });
        });

        return deferred.promise;
      }
    }
  },
  hooks: {
    // Init plugin and read config
    "init": function() {
      if (typeof this.options.pluginsConfig['sequence-diagrams'] === 'undefined') {
        this.options.pluginsConfig['sequence-diagrams'] = {'theme': 'simple'};
      }
    },
    // Before parsing markdown
    "page:before": function(page) {
        // Get all code texts
        flows = page.content.match(/^```sequence((.*\n)+?)?```$/igm);
        // Begin replace
        if (flows instanceof Array) {
          for (var i = 0, len = flows.length; i < len; i++) {
            page.content = page.content.replace(
              flows[i], 
              flows[i].replace(/^```sequence/, '{% sequence %}').replace(/```$/, '{% endsequence %}'));
          }     
        }
        return page;
    }
  }
};
