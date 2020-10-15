const { Toolkit } = require('actions-toolkit')
const core = require('@actions/core');
const glob = require('@actions/glob')
const fs = require('fs');
const { terminologyDict } = require('./terminologyDict');

//Execute Work Flow
Toolkit.run(async tools => {
    const messageId = core.getInput("message_id");
    const prOnly = JSON.parse(core.getInput("pr_only").toLowerCase())
    const globPattern = core.getInput("glob_pattern")
    const pullRequestNumber = tools.context.payload.pull_request.number;
    //console.log(tools.context); //debug line
    if (!pullRequestNumber) { // event was not a pull request
        console.log('Unexpected event occurred. action context: ', tools.context.payload)
        tools.exit.neutral('Exited with unexpected event')
    }

    const globber = await glob.create(globPattern)
    let files = await globber.glob()
    console.log("FILES  ", files);

    console.log("owner", tools.context.repo.owner)
    console.log("repo", tools.context.repo.repo)
    if (prOnly) { //only scan changed files
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
        console.log("PRINFO", JSON.stringify(prInfo.repository.pullRequest))
        let prFiles = prInfo.repository.pullRequest.files.nodes.map(f => path.resolve(f.path));
        files = files.filter(x => prFiles.includes(x))
        console.log("FILES After PR", files);
    }



    const checkComment = generateComment(files)
    const previousPr = await findPreviousComment(tools.github, repo, number, messageId);
    // When a term is found post a comment on the PR
    if (previousPr) {
        console.log("found old comment")
        await updateComment(tools.github, repo, previous.id, messageId, checkComment)
    } else {
        console.log("created new comment")
        await createComment(tools.github, repo, number, messageId, checkComment);
    }

});
