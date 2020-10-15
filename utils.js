const fs = require("fs-extra")
const { terminologyDict } = require('./terminologyDict');
const path = require("path")
function generateComment(filesList) {
    const filteredFilesList = filesList.filter((value) => fs.existsSync(value));
    let checkRes = filteredFilesList.map(file => {
        const resp = checkFile(file)
        return { filePath: file, result: resp }
    })
    return formatComment(checkRes)
}

function checkFile(file) {
    console.log(`checking ${file}`)
    const body = fs.readFileSync(file, "utf-8");
    const fileContentsArr = body.toLowerCase().split(/\s|\n|\r|,/g)
    let termsFound = [];
    for (let word of fileContentsArr) {
        for (let term of terminologyDict) {
            if (word.includes(term)) {
                termsFound.push({
                    "termFound": term,
                    "wordFound": word,
                    "line": "TODO"
                })
            }
        }
    }
    return termsFound
}

function formatComment(checkRes) {
    let header = `# Inclusive Terms Report\n Please make the following language changes.\n`
    let success = `### :sparkles: :rocket: :sparkles: 0 Non-Inclusve Terms Found :sparkles: :rocket: :sparkles:`

    let sections = checkRes.map(res => formatFileTable(res))

    if (sections.every(section => section === '') || sections.length == 0) {
        return `${header}${success}`
    } else {
        return `${header}${sections.join('\n')}`
    }

}

function formatFileTable(res) {
    // don't post anything for files that are good
    if (res.result.length == 0) {
        return ''
    }

    let filePath = path.relative('/github/workspace', res.filePath)
    let header = `### ${filePath}\n`
    let tableHeader = `| Level | Location | Word | Term |\n| :---: | :---: | :---: | :--- |\n`

    let rows = res.result.map(item => formatRow(item))

    return `${header}${tableHeader}${rows.join('\n')}\n`
}

function formatRow(item) {
    let status = `:warning:`
    return `| ${status} | ${item.line} | ${item.wordFound} | ${item.termFound} |`
}

async function createComment(github, repo, issue_number, message_id, comment) {
    const HEADER = `<!-- Alex Pull Request Comment - ${message_id} -->`;
    await github.issues.createComment({
        ...repo,
        issue_number,
        body: `${HEADER}\n${comment}`
    });
}

async function updateComment(github, repo, comment_id, message_id, comment) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment - ${message_id} -->`;
    await github.issues.updateComment({
        ...repo,
        comment_id,
        body: `${HEADER}\n${comment}`
    });
}

async function findPreviousComment(github, repo, issue_number, message_id) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment - ${message_id} -->`; // Always a technical comment
    const { data: comments } = await github.issues.listComments({
        ...repo,
        issue_number
    });
    return comments.find(comment => comment.body.startsWith(HEADER));
}


module.exports = {
    findPreviousComment,
    createComment,
    updateComment,
    generateComment
}