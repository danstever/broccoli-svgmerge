var fs = require("fs"),
    path = require("path"),
    mkdirp = require("mkdirp"),
    Writer = require("broccoli-writer"),
    helpers = require("broccoli-kitchen-sink-helpers"),
    cheerio = require("cheerio");

module.exports = SvgProcessor;
SvgProcessor.prototype = Object.create(Writer.prototype);
SvgProcessor.prototype.constructor = SvgProcessor;

function SvgProcessor (inputTree, options) {

    if (!(this instanceof SvgProcessor)) return new SvgProcessor(inputTree, options);

    this.inputTree = inputTree;

    this.options = {
        outputFile: "/images.svg"
    };

    for (key in options) {
        if (options.hasOwnProperty(key)) {
            this.options[key] = options[key];
        }
    }

};

SvgProcessor.prototype.write = function (readTree, destDir) {

    var self = this;

    return readTree(this.inputTree).then(function (srcDir) {

        var output = ["<svg xmlns='http://www.w3.org/2000/svg'>"];

        output.push("<style>svg > g { display: none; } svg > g:target { display: inline-block; }</style>");

        try {

            var inputFiles = helpers.multiGlob(["**/*.svg"], { cwd: srcDir });
            for (var i = 0; i < inputFiles.length; i++) {
                var stat = fs.statSync(srcDir + "/" + inputFiles[i]);
                if (stat && stat.isFile()) {
                    var fileContents = fs.readFileSync(srcDir + "/" + inputFiles[i], { encoding: "utf8" });
                    output.push(parseSvg(inputFiles[i], fileContents));
                }
            }

        } catch (error) {
            if (!error.message.match("did not match any files")) {
                throw error;
            }
        }

        output.push("</svg>");

        helpers.assertAbsolutePaths([self.options.outputFile]);
        mkdirp.sync(path.join(destDir, path.dirname(self.options.outputFile)));
        var concatenatedOutput = output.join("\n");
        fs.writeFileSync(path.join(destDir, self.options.outputFile), concatenatedOutput);

    });

};

function parseSvg (filename, fileContents) {

    var $fileContents = cheerio.load(fileContents, { xmlMode: true }),
        $svg = $fileContents("svg"),
        viewBox = $svg.attr("viewBox"),
        fileID = path.basename(filename).replace(/\.[^/.]+$/, ""),
        $outputContents = cheerio.load("<svg viewBox='" + viewBox + "'><g id='" + fileID + "'></g></svg>", { xmlMode: true }),
        $g = $outputContents("g");

    $g.html($svg.html());

    return $outputContents.html();

};
