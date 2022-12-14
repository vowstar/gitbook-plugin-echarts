/*jshint esversion: 8 */

var path = require('path');
var tester = require('honkit-tester');
var assert = require('assert');

var pkg = require('../package.json');

describe('echarts', function() {
    this.timeout(50000);
    it('should correctly replace by ```chart``` tag', function() {
        return tester.builder()
            .withContent('\n```chart\n{"width":"900px","height":"500px","title":{"text":"Fruitsnumber"},"tooltip":{},"legend":{"data":["Number"]},"xAxis":{"data":["Apple","Banana","Peach","Pear","Grape","Kiwi"]},"yAxis":{},"series":[{"name":"Number","type":"bar","data":[5,20,36,10,10,20]}]}\n```')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                plugins: ['echarts']
            })
            .create()
            .then(function(result) {
                const isSvg = require('is-svg');
                const svg = result[0].content.match(/<svg[^]*<\/svg>/m).toString();

                assert.equal(isSvg(svg), true);
                assert.equal(svg.includes('Apple'), true);
                assert.equal(svg.includes('Banana'), true);
                assert.equal(svg.includes('Peach'), true);
                assert.equal(svg.includes('Pear'), true);
            });
    });
    it('should correctly replace by ```chart { foo = "bar" }``` tag', function() {
        return tester.builder()
            .withContent('\n```chart { foo = "bar" }\n{"width":"900px","height":"500px","title":{"text":"Fruitsnumber"},"tooltip":{},"legend":{"data":["Number"]},"xAxis":{"data":["Apple","Banana","Peach","Pear","Grape","Kiwi"]},"yAxis":{},"series":[{"name":"Number","type":"bar","data":[5,20,36,10,10,20]}]}\n```')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                plugins: ['echarts']
            })
            .create()
            .then(function(result) {
                const isSvg = require('is-svg');
                const svg = result[0].content.match(/<svg[^]*<\/svg>/m).toString();

                assert.equal(isSvg(svg), true);
                assert.equal(svg.includes('Apple'), true);
                assert.equal(svg.includes('Banana'), true);
                assert.equal(svg.includes('Peach'), true);
                assert.equal(svg.includes('Pear'), true);
            });
    });
    it('should correctly replace by {% chart %} and endchart {% endchart %} tag', function() {
        return tester.builder()
            .withContent('\n{% chart %}\n{"width":"900px","height":"500px","title":{"text":"Fruitsnumber"},"tooltip":{},"legend":{"data":["Number"]},"xAxis":{"data":["Apple","Banana","Peach","Pear","Grape","Kiwi"]},"yAxis":{},"series":[{"name":"Number","type":"bar","data":[5,20,36,10,10,20]}]}\n{% endchart %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                plugins: ['echarts']
            })
            .create()
            .then(function(result) {
                const isSvg = require('is-svg');
                const svg = result[0].content.match(/<svg[^]*<\/svg>/m).toString();

                assert.equal(isSvg(svg), true);
                assert.equal(svg.includes('Apple'), true);
                assert.equal(svg.includes('Banana'), true);
                assert.equal(svg.includes('Peach'), true);
                assert.equal(svg.includes('Pear'), true);
            });
    });
    it('should correctly parse single quote', function() {
        return tester.builder()
            .withContent('\n```chart\n{\'width\':"900px","height":"500px","title":{"text":"Fruitsnumber"},"tooltip":{},"legend":{"data":["Number"]},"xAxis":{"data":["Apple","Banana","Peach","Pear","Grape","Kiwi"]},"yAxis":{},"series":[{"name":"Number","type":"bar","data":[5,20,36,10,10,20]}]}\n```')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                plugins: ['echarts']
            })
            .create()
            .then(function(result) {
                const isSvg = require('is-svg');
                const svg = result[0].content.match(/<svg[^]*<\/svg>/m).toString();

                assert.equal(isSvg(svg), true);
                assert.equal(svg.includes('Apple'), true);
                assert.equal(svg.includes('Banana'), true);
                assert.equal(svg.includes('Peach'), true);
                assert.equal(svg.includes('Pear'), true);
            });
    });
    it('should report Invalid JSON', function() {
        return tester.builder()
            .withContent("\n```chart\n{'invalid':'json'\n```")
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                plugins: ['echarts']
            })
            .create()
            .then(function(result) {
                const isSvg = require('is-svg');
                const svg = result[0].content.match(/<svg[^]*<\/svg>/m).toString();

                assert.equal(isSvg(svg), true);
                assert.equal(svg.includes('Invalid JSON format'), true);
            });
    });
});
