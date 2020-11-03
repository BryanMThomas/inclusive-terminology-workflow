const { Toolkit } = require('actions-toolkit')
const core = require('@actions/core');
const glob = require('@actions/glob')
const path = require("path")
const { findPreviousComment, createComment, updateComment, generateComment } = require("./utils")

//Execute Work Flow
Toolkit.run(async tools => {
    const messageId = core.getInput("message_id");
    const prOnly = JSON.parse(core.getInput("pr_only").toLowerCase())
    const globPattern = core.getInput("glob_pattern")
    const pullRequestNumber = tools.context.payload.pull_request.number;

    if (!pullRequestNumber) { // event was not a pull request
        console.log('Unexpected event occurred. action context: ', tools.context.payload)
        tools.exit.neutral('Exited with unexpected event')
    }

    //get all Files in workspace that match globPattern
    const globber = await glob.create('*');
    let files = await globber.glob()

    //only scan changed files if prOnly is set true
    if (prOnly) {
        const prInfo = await tools.github.graphql(
            `
            query prInfo($owner: String!, $name: String!, $prNumber: Int!) {
              repository(owner: $owner, name: $name) {
                pullRequest(number: $prNumber) {
                  files(first: 100) {
                    nodes {
                      path
                    }
                  }
                }
              }
            }
          `,
            {
                owner: tools.context.repo.owner,
                name: tools.context.repo.repo,
                prNumber: pullRequestNumber
            }
        );
        let prFiles = prInfo.repository.pullRequest.files.nodes.map(f => path.resolve(f.path));
        files = files.filter(x => prFiles.includes(x))
        console.log("Files Changed in PR", files);
    }

    //Completes the term check & generated comment for PR
    const prBotComment = generateComment(files)
    
    //checks if PR has already been commented on by bot
    const previousPr = await findPreviousComment(tools.github, tools.context.repo, pullRequestNumber, messageId);
    if (previousPr) {
        console.log("Found already created comment")
        await updateComment(tools.github, tools.context.repo, previousPr.id, messageId, prBotComment)
    } else {
        console.log("Created new comment")
        await createComment(tools.github, tools.context.repo, pullRequestNumber, messageId, prBotComment);
    }
});
