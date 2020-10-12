const { Toolkit } = require('actions-toolkit')
const fs = require('fs');
const { terminologyDict } = require('./terminologyDict');

// Create variables to hold values
let pullRequestNum = '';

//Execute Work Flow
Toolkit.run(async tools => {
    // Console logs to the actions dashboard
    console.log(tools.context); //debug line
    if (!tools.context.payload.pull_request) { // event was not a pull request
        console.log('Unexpected event occurred. action context: ', tools.context.payload)
        tools.exit.neutral('Exited with unexpected event')
    }

    // Pull Request details
    pullRequestNum = tools.context.payload.pull_request.number
    let pathWork = tools.workspace;
    console.log("workspace ", pathWork);
    const contents = await tools.readFile('test.txt')
    console.log("contents ", contents)
    let bodyArr = contents.split(/\s|\n|\r|,/g)
    console.log("Array", bodyArr)

    let errorFound = false;
    let termsFound = [];
    for (let word of bodyArr) {
        for (let term of terminologyDict) {
            if (word.includes(term)) {
                errorFound = true;
                termsFound.push({
                    "term found": term,
                    "wordFound": word
                })
            }
        }
    }
    //TODO Read all files
    // // Check if a term was found in the non inclusive dictionary
    // let errorFound2 = false;
    // let termsFoundReader = [];
    // let files = fs.readdir(pathWork, (err, files) => { return files });
    // for (file of files) {
    //     console.log("File: ", file);
    //     let contents2 = await tools.readFile(file)
    //     bodyArr = contents2.split(/\s|\n|\r|,/g)
    //     for (let word of bodyArr) {
    //         for (let term of terminologyDict) {
    //             if (word.includes(term)) {
    //                 errorFound2 = true;
    //                 termsFoundReader.push({
    //                     "term found": term,
    //                     "wordFound": word
    //                 })
    //             }
    //         }
    //     }
    // }

    //console.log("reader", JSON.stringify(termsFoundReader))

    // When a term is found post a comment on the PR
    if (errorFound) {
        const commentMsg = `
      Please review your recent code change for non inclusive terms.\n
      Terms Found: ${JSON.stringify(termsFound)}`;
        console.log(commentMsg);
        await tools.github.issues.createComment({
            body: commentMsg
        });
        tools.exit.neutral('Exited with terms identified')
    } else {
        console.log("No non inclusive terminology was found in this pull request. Nice Job! :)");
        tools.exit.success('Exited successfully')
    }
});
