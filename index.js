const { Toolkit } = require('actions-toolkit')
const { terminologyDict } = require('./terminologyDict');

// Create variables to hold values
let user = '';
let body = '';
let pullRequestNum = '';

//Execute Work Flow
Toolkit.run(async tools => {
    // Console logs to the actions dashboard
    console.log(tools.context); //debug line
    const repoName = tools.context.payload.repository.name;

    if (!tools.context.payload.pull_request) { // event was not a pull request
        console.log('Unexpected event occurred. action context: ', tools.context.payload)
        tools.exit.neutral('Exited with unexpected event')
    }

    // Pull Request details
    user = tools.context.payload.pull_request.user
    pullRequestNum = tools.context.payload.pull_request.number
    // split body into separate strings (terms)
    console.log("\n\n\n\n",tools.context.payload.pull_request.body,"\n\n\n\n");
    let bodyArr = tools.context.payload.pull_request.body.toLowerCase().split(" ");
    console.log("\n\n\n\n",bodyArr,"\n\n\n\n");

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
            repo: repoName,
            body: commentMsg
        });
        tools.exit.neutral('Exited with terms identified')
    } else {
        console.log("No non inclusive terminology was found in this pull request. Nice Job! :)");
        tools.exit.success('Exited successfully')
    }
});
