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
    console.log("workspace ",tools.workspace);
    const contents = await tools.readFile('test.txt')
    console.log("contents ",contents)

    //requiring path and fs modules
const fs = require('fs');
fs.readdir(tools.workspace, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file); 
    });
})


    // Check if a term was found in the non inclusive dictionary
    let errorFound = false;
    let termsFound = [];
    for (let term of bodyArr) {
        if ((terminologyDict.indexOf(term) != -1)) {
            errorFound = true;
            termsFound.push({ "term found": term })
        }
    }

    // When a term is found post a comment on the PR
    if (errorFound) {
        const commentMsg = `
      Please review your recent code change for non inclusive terms.\n
      Terms Found: ${termsFound}`;
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
