/*jshint esversion: 8 */

const path = require('path');
const puppeteer = require('puppeteer');

function transform(input, toSingleQuotes) {
	let result = '';
	let isBetweenQuotes = false;
	let quoteCharacter;
	let changeTo = '';
	let toChange = '';

	if (toSingleQuotes) {
		changeTo = '\'';
		toChange = '"';
	}	else {
		changeTo = '"';
		toChange = '\'';
	}

	for (let index = 0; index < input.length; index++) {
		const current = input[index];
		const next = input[index + 1];

		// Found double-quote or single-quote
		if (current === '"' || current === '\'') {
			// If not processing in between quotes
			if (!isBetweenQuotes) {
				quoteCharacter = current;
				isBetweenQuotes = true;
				result += changeTo;
			} else if (quoteCharacter === current) {
				// If processing between quotes, close quotes
				result += changeTo;
				isBetweenQuotes = false;
			} else {
				// Still inside quotes
				result += '\\' + changeTo;
			}
		} else if (current === '\\' && (next === '\'' || next === '"')) {
			// If escape character is found and double or single quote after
			// Escape + quote to change to
			if (next === changeTo) {
				// If in between quotes and quote is equal to changeTo only escape once
				result += isBetweenQuotes && quoteCharacter === changeTo ? '\\' + changeTo : '\\\\' + changeTo;
				index++;
			} else if (next === toChange) {
				// Escape + quote to be changed
				// If between quotes can mantain tochange
				result += isBetweenQuotes ? toChange : changeTo;
				index++;
			} else {
				result += current;
			}
		} else if (current === '\\' && next === '\\') {
			// Don't touch backslashes
			result += '\\\\';
			index++;
		} else {
			result += current;
		}
	}

	return result;
}

function processBlock(blk) {
	return new Promise(async (resolve, reject) => {
		const book = this;
		let code = blk.body;
		const config = book.config.get('pluginsConfig.chart', {});

		const width = blk.kwargs.width;
		const height = blk.kwargs.height;

		try {
			JSON.parse(code);
		} catch (e) {
			code = transform(code, false);
			try {
				JSON.parse(code);
			} catch (e) {
				resolve('<svg version="1.1" width="600" height="200" xmlns="http://www.w3.org/2000/svg"><text x="10" y="100" font-size="60" text-anchor="left">Invalid JSON format! Please modify your JSON input.</text></svg>');
				console.error("Invalid JSON: " + code);
				return;
			}
		}

		try {
			const browser = await puppeteer.launch({
				args: ['--disable-dev-shm-usage', '--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses']
			});
			const page = await browser.newPage();

			const htmlFile = path.join(__dirname, 'renderer.html');
			await page.goto("file://" + htmlFile, { waitUntil: 'domcontentloaded' });

			const xCode = encodeURIComponent(code);
			const xConfig = encodeURIComponent(JSON.stringify(config));
			const xWidth = encodeURIComponent(width);
			const xHeight = encodeURIComponent(height);

			/* istanbul ignore next */
			const result = await page.evaluate(
				`(async () => {
					// Set up a flag to detect when render is complete
					window.renderComplete = false;
					code = decodeURIComponent("${xCode}");
					config = JSON.parse(decodeURIComponent("${xConfig}"));
					width = decodeURIComponent("${xWidth}");
					height = decodeURIComponent("${xHeight}");
					
					const rendered = await render(code, config, width, height);
					window.renderComplete = true;  // Flag to indicate completion
					return rendered;
				})()`
			);

			// Poll for render completion
			await page.waitForFunction('window.renderComplete === true', {
				timeout: 50000
			});
			await browser.close();

			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
}

module.exports = {
	blocks: {
		chart: {
			process: processBlock
		}
	},
	hooks: {
		"init": function () {
			if (!Object.keys(this.book.config.get('pluginsConfig.chart', {})).length) {
				this.book.config.set('pluginsConfig.chart', {});
			}
		},
		"page:before": function (page) {
			let flows = page.content.match(/```(\x20|\t)*(chart|echarts)((.*[\r\n]+)+?)?```/igm);
			if (flows instanceof Array) {
				for (let i = 0, len = flows.length; i < len; i++) {
					page.content = page.content.replace(
						flows[i],
						flows[i]
							.replace(/```(\x20|\t)*(chart|echarts)[ \t]+{(.*)}/i,
								function (matchedStr) {
									if (!matchedStr)
										return "";
									let newStr = "";
									let modeQuote = false;
									let modeArray = false;
									let modeChar = false;
									let modeEqual = false;
									let str = matchedStr.replace(/^\s+|\s+$/g, "");
									str = str.replace(/```(\x20|\t)*(chart|echarts)/i, "");

									for (let j = 0; j < str.length; j++) {
										if (str.charAt(j) == "\"") {
											modeQuote = !modeQuote;
											modeChar = true;
											newStr += str.charAt(j);
											continue;
										}
										if (str.charAt(j) == "[") {
											modeArray = true;
											newStr += str.charAt(j);
											continue;
										}
										if (str.charAt(j) == "]") {
											modeArray = false;
											newStr += str.charAt(j);
											continue;
										}
										if (modeQuote || modeArray) {
											newStr += str.charAt(j);
										} else {
											if (/[A-Za-z0-9_]/.test(str.charAt(j))) {
												modeChar = true;
												newStr += str.charAt(j);
											} else if (str.charAt(j) === "=") {
												modeEqual = true;
												modeChar = false;
												newStr += str.charAt(j);
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
