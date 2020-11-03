const fs = require("fs-extra")
const { terminologyDict } = require('./terminologyDict');
const { formatResponse } = require('./format')

function generateComment(filesList) {
    //Verifies files are accessible
    const filteredFilesList = filesList.filter((value) => fs.existsSync(value));
    //Iterate through files checking each one
    let checkRes = filteredFilesList.map(file => {
        try{
            const resp = checkFile(file)
            return { filePath: file, result: resp }
        }catch(err){
            console.log("Error on File: ", file, " Error: ", err)
        }
    })
    //Return formatted response to comment on PR
    return formatResponse(checkRes)
}

//Verified contents of file against dictionary
function checkFile(file) { 
    //TODO: More efficient way to compare file contents to dictionary
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

async function createComment(github, repo, issue_number, message_id, comment) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment - ${message_id} -->`;
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

    comments.map(comment =>{
        console.log("MATCH: ",comment.body.startsWith(HEADER))
        console.log("Body",comment.body)
    })

    return comments.find(comment => comment.body.startsWith(HEADER));
}


module.exports = {
    findPreviousComment,
    createComment,
    updateComment,
    generateComment
}