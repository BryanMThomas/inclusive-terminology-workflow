const { Toolkit } = require('actions-toolkit')
const fs = require('fs');
const { terminologyDict } = require('./terminologyDict');

//Execute Work Flow
Toolkit.run(async tools => {
    //console.log(tools.context); //debug line
    if (!tools.context.payload.pull_request) { // event was not a pull request
        console.log('Unexpected event occurred. action context: ', tools.context.payload)
        tools.exit.neutral('Exited with unexpected event')
    }

    const fileContents = await tools.readFile('test.txt')
    const fileContentsArr = fileContents.toLowerCase().split(/\s|\n|\r|,/g)

    let checkFailed = false;
    let termsFound1 = [];
    for (let word of fileContentsArr) {
        for (let term of terminologyDict) {
            if (word.includes(term)) {
                checkFailed = true;
                termsFound1.push({
                    "term found": term,
                    "wordFound": word
                })
            }
        }
    }
    let termsFound2 = fileContentsArr.filter(value => terminologyDict.includes(value));
    console.log(`First Way:${JSON.stringify(termsFound1)}`)
    console.log(`Second Way:${JSON.stringify(termsFound2)}`)
    //TODO Read all files
    // // Check if a term was found in the non inclusive dictionary
    // let pathWork = tools.workspace;
    // console.log("workspace ", pathWork);
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
    if (checkFailed) {
        const commentMsg = `
      Please review your recent code change for non inclusive terms.\n
      Terms Found: ${JSON.stringify(termsFound1)}`;
        console.log(commentMsg);
        await tools.github.issues.createComment({
            owner: tools.context.payload.repository.owner.login,
            issue_number: tools.context.payload.pull_request.number,
            repo: tools.context.payload.repository.name,
            body: commentMsg
        });
        tools.exit.neutral('Exited with terms identified')
    } else {
        console.log("No non inclusive terminology was found in this pull request. Nice Job! :)");
        tools.exit.success('Exited successfully')
    }
});
