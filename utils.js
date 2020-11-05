const fs = require("fs-extra")
const { terminologyDict } = require('./terminologyDict');
const { formatResponse } = require('./format')

function generateComment(filesList) {
    //Verifies files are accessible
    const filteredFilesList = filesList.filter((value) => fs.existsSync(value));
    //Iterate through files checking each one
    let foundTermsRes = filteredFilesList.map(file => {
        try {
            const resp = checkFile(file)
            return {
                filePath: file,
                result: resp
            }
        } catch (err) {
            console.log("Error on File: ", file, " Error: ", err)
        }
    })
    //Return formatted response to comment on PR
    return formatResponse(foundTermsRes)
}

//Verified contents of file against dictionary
function checkFile(file) {
    //TODO: More efficient way to compare file contents to dictionary
    if (fs.lstatSync(file).isDirectory()) { //checks for directories
        console.log(`FOUND DIRECTORY NOT FILE ${file}`)
        return;
      }
    console.log(`checking ${file}`)
    let termsFound = [];
    try{
    const body = fs.readFileSync(file, "utf-8");
    let lineArr = body.split(/\r?\n/);
    lineArr.forEach((line, index) => { //LOOP 1 - each line of the file
        let lineContentsArr = line.toLowerCase().split(/\s|\n|\r|,/g)
        for (let word of lineContentsArr) { //LOOP 2 each word of the line
            for (let term of terminologyDict) { //LOOP 3 each term in the dict
                if (word.includes(term)) {
                    termsFound.push({
                        "termFound": term,
                        "wordFound": word,
                        "line": index + 1
                    })
                }
            }
        }
    })}
    catch(err){
        console.log(`ERROR READING FILE: ${file} \n`)
        console.log(`ERROR: ${err}`)
    }
    return termsFound

    //TODO return error to surface in comment?
}

async function createComment(github, repo, issue_number, comment) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment -->`;
    await github.issues.createComment({
        ...repo,
        issue_number,
        body: `${HEADER}\n${comment}`
    });
}

async function updateComment(github, repo, comment_id, comment) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment -->`;
    await github.issues.updateComment({
        ...repo,
        comment_id,
        body: `${HEADER}\n${comment}`
    });
}

async function findPreviousComment(github, repo, issue_number) {
    const HEADER = `<!-- Inclusive Terminology Pull Request Comment -->`; // Always a technical comment
    const { data: comments } = await github.issues.listComments({
        ...repo,
        issue_number
    });

    comments.map(comment => {
        console.log("MATCH: ", comment.body.startsWith(HEADER))
        console.log("Body", comment.body)
    })

    return comments.find(comment => comment.body.startsWith(HEADER));
}


module.exports = {
    findPreviousComment,
    createComment,
    updateComment,
    generateComment
}