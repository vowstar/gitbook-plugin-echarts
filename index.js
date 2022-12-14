/*jshint esversion: 8 */

var path = require('path');
var puppeteer = require('puppeteer');
var Q = require('q');

function processBlock(blk) {
    var deferred = Q.defer();

    var book = this;
    var code = blk.body;
    var config = book.config.get('pluginsConfig.chart', {});

    var width = blk.kwargs.width;
    var height = blk.kwargs.height;

    try {
        JSON.parse(code);
    } catch (e) {
        console.error("Invalid JSON: " + code);
        deferred.resolve('<svg version="1.1" width="300" height="200" xmlns="http://www.w3.org/2000/svg"><text x="10" y="100" font-size="60" text-anchor="middle">Invalid JSON format! Please modify your JSON input</text></svg>');
        return deferred.promise;
    }

    (async (code, config, width, height) => {
        const browser = await puppeteer.launch({
            args: ['--disable-dev-shm-usage', '--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses']
        });
        const page = await browser.newPage();

        const htmlFile = path.join(__dirname, 'renderer.html');
        await page.goto("file://" + htmlFile, { waitUntil: 'networkidle2' });

        console.error(code);

        xCode = encodeURIComponent(code);
        xConfig = encodeURIComponent(JSON.stringify(config));
        xWidth = encodeURIComponent(width);
        xHeight = encodeURIComponent(height);

        /* istanbul ignore next */
        var result = await page.evaluate(
            `(async() => {
                        code = decodeURIComponent("${xCode}");
                        config = JSON.parse(decodeURIComponent("${xConfig}"));
                        width = decodeURIComponent("${xWidth}");
                        height = decodeURIComponent("${xHeight}");
                        return render(code, config, width);
                 })()`
        );

        await browser.close();

        return result;
    })(code, config, width, height).then(
        function (result) {
            deferred.resolve(result);
        }
    );

    return deferred.promise;
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
        // Before parsing markdown
        "page:before": function (page) {
            // Get all code texts
            flows = page.content.match(/```(\x20|\t)*(chart|echarts)((.*[\r\n]+)+?)?```/igm);
            // Begin replace
            if (flows instanceof Array) {
                for (var i = 0, len = flows.length; i < len; i++) {
                    page.content = page.content.replace(
                        flows[i],
                        flows[i]
                            .replace(/```(\x20|\t)*(chart|echarts)[ \t]+{(.*)}/i,
                                function (matchedStr) {
                                    if (!matchedStr)
                                        return "";
                                    var newStr = "";
                                    var modeQuote = false;
                                    var modeArray = false;
                                    var modeChar = false;
                                    var modeEqual = false;
                                    // Trim left and right space
                                    var str = matchedStr.replace(/^\s+|\s+$/g, "");
                                    // Remove ```chart header
                                    str = str.replace(/```(\x20|\t)*(chart|echarts)/i, "");

                                    // Build new str
                                    for (var i = 0; i < str.length; i++) {
                                        if (str.charAt(i) == "\"") {
                                            modeQuote = !modeQuote;
                                            modeChar = true;
                                            newStr += str.charAt(i);
                                            continue;
                                        }
                                        if (str.charAt(i) == "[") {
                                            modeArray = true;
                                            newStr += str.charAt(i);
                                            continue;
                                        }
                                        if (str.charAt(i) == "]") {
                                            modeArray = false;
                                            newStr += str.charAt(i);
                                            continue;
                                        }
                                        if (modeQuote || modeArray) {
                                            // In quote, keep all string
                                            newStr += str.charAt(i);
                                        } else {
                                            // Out of quote, process it
                                            if (str.charAt(i).match(/[A-Za-z0-9_]/)) {
                                                modeChar = true;
                                                newStr += str.charAt(i);
                                            } else if (str.charAt(i).match(/[=]/)) {
                                                modeEqual = true;
                                                modeChar = false;
                                                newStr += str.charAt(i);
                                            } else if (modeChar && modeEqual) {
                                                modeChar = false;
                                                modeEqual = false;
                                                newStr += ",";
                                            }
                                        }
                                    }

                                    newStr = newStr.replace(/,$/, "");

                                    return "{% chart " + newStr + " %}";
                                })
                            .replace(/```(\x20|\t)*(chart|echarts)/i, '{% chart %}')
                            .replace(/```/, '{% endchart %}')
                    );
                }
            }
            return page;
        }
    }
};