# Github Action for Inclusive Terminology
Scans code base to identify non-inclusive terms

## Required Inputs

### `allFiles`
Whether to only run on all files in the code base (true) or only files changed in this PR (false)"
defaults to false

### `GITHUB_TOKEN`

`{{ secrets.GITHUB_TOKEN }}`

## Outputs

None

## Example yaml file

This workflow is triggered when a PR is created or updated.  It then comments with the results of the inclusive terminology check.

```
name: Inclusive Terminology Linter

# Run this workflow every time a new commit pushed to your repository
on:
  pull_request:
    branches: [ main ]

jobs:
  terminology:
    runs-on: ubuntu-latest

 steps:
      # Checks out a copy of your repository on the ubuntu-latest machine
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Comment Inclusive Check on new PR
        uses: BryanMThomas/inclusive-terminology-workflow@main
        with:
         allFiles: false
         GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
```

TODO: 
- Add source of non-inclusive terms
- Efficient compare method
- Identify location of non-inclusive terms (solved on version-1 branch)
- Limit scope of search all files (solved on version-1 branch)
- Find a way to run locally 
- Find a way to write effective unit tests



