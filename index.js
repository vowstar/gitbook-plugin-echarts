var path = require('path');
var phantom = require('phantom');
var Q = require('q');

var fs = require('fs-extra')
var crypto = require('crypto');

var ASSET_PATH = 'assets/images/chart/';

function processImage(filePath, data) {
    require("fs").writeFile(filePath, data, 'base64', function(err) {
        if (err)
            console.log(err);
    });
    return filePath;
}

function processLink(code, config, width, height) {
    var deferred = Q.defer();

    phantom.create().then(function(ph) {
        ph.createPage().then(function(page) {
            var pagePath = path.join(__dirname, 'renderer.html');
            page.open(pagePath).then(function(status) {
                var result = page.evaluate(function(code, config, width, height) {
                    return render(code, config, width, height);
                }, code, config, width, height);
                ph.exit();
                deferred.resolve(result);
            });
        });
    });

    return deferred.promise;
}

function processBlock(blk) {

    var book = this;
    var code = blk.body;
    var config = book.config.get('pluginsConfig.chart', {});

    var width = blk.kwargs['width'];
    var height = blk.kwargs['height'];

    return processLink(code, config, width, height).then(function(data) {
        assetPath = ASSET_PATH;
        filePath = assetPath + crypto.createHash('sha1').update(code + config + width + height).digest('hex') + '.png';

        fs.mkdirpSync(assetPath);

        var url = processImage(filePath, data);
        // Get file type can use console.log(book.ctx.ctx.file.type);
        // But here must use html
        return "<img src=/" + url + ">";
    });
}

module.exports = {
    blocks: {
        chart: {
            process: processBlock
        }
    },
    hooks: {
        // For all the hooks, this represent the current generator
        // [init", "finish", "finish:before", "page", "page:before"] are working.
        // page:* are marked as deprecated because it's better if plugins start using blocks instead. 
        // But page and page:before will probably stay at the end (useful in some cases).

        // This is called before the book is generated
        // Init plugin and read config
        "init": function() {
            if (!Object.keys(this.book.config.get('pluginsConfig.chart', {})).length) {
                this.book.config.set('pluginsConfig.chart', {});
            }
        },

        // Before the end of book generation
        "finish:before": function() {
            // Copy images to output folder every time
            var book = this;
            var output = book.output;
            var rootPath = output.root();
            if (fs.existsSync(ASSET_PATH)) {
                fs.mkdirs(path.join(rootPath, ASSET_PATH));
                // fs.copy(ASSET_PATH, path.join(rootPath, ASSET_PATH), {
                //     clobber: true
                // }, function(err) {
                //     if (err)
                //         console.error(err)
                // })
                fs.copySync(ASSET_PATH, path.join(rootPath, ASSET_PATH));
            }
        },

        // Before parsing markdown
        "page:before": function(page) {
            // Get all code texts
            flows = page.content.match(/^```chart((.*\n)+?)?```$/igm);
            // Begin replace
            if (flows instanceof Array) {
                for (var i = 0, len = flows.length; i < len; i++) {
                    page.content = page.content.replace(
                        flows[i],
                        flows[i].replace(/^```chart/, '{% chart %}').replace(/```$/, '{% endchart %}'));
                }
            }
            return page;
        }
    }
};