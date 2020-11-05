const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob')
const path = require("path")
const { findPreviousComment, createComment, updateComment, generateComment } = require("./utils")

//Execute Work Flow
async function run() {
  try {
    const allFiles = JSON.parse(core.getInput("allFiles").toLowerCase())
    const githubToken = core.getInput("GITHUB_TOKEN", {required: true});
    //const globPattern = core.getInput("glob_pattern")
    const pullRequestNumber = github.context.payload.pull_request.number;

    if (!pullRequestNumber) { // event was not a pull request
      console.log('Unexpected event occurred. action context: ', github.context.payload)
      github.exit.neutral('Exited with unexpected event')
    }

    const octokit = github.getOctokit(githubToken);

    //get all Files in workspace that match globPattern
    const patterns = ['*','!.git']
    const globber = await glob.create(patterns.join('\n'));
    let files = await globber.glob()

    //only scan changed files if allFiles is set to false
    if (!allFiles) {
      const prInfo = await octokit.graphql(
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
          owner: github.context.repo.owner,
          name: github.context.repo.repo,
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
    const previousPr = await findPreviousComment(octokit, github.context.repo, pullRequestNumber);
    if (previousPr) {
      console.log("Found already created comment")
      await updateComment(octokit, github.context.repo, previousPr.id, prBotComment)
    } else {
      console.log("Created new comment")
      await createComment(octokit, github.context.repo, pullRequestNumber, prBotComment);
    }
  } catch ({ message }) {
    core.setFailed(message);
  }
}

run();
