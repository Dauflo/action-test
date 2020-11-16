const core = require("@actions/core")
const github = require("@actions/github")
const exec = require("@actions/exec")

async function run() {
    try {
        // const payload = JSON.stringify(github.context.payload, undefined, 2)
        // console.log(payload)

        const myToken = core.getInput("who-to-greet")
        const octokit = github.getOctokit(myToken)
        let owner = github.context.payload.repository.owner.name
        let repo = github.context.payload.repository.name

        console.log(owner, repo)

        let lastRelease =  await (await octokit.repos.listReleases({owner, repo})).data[0].tag_name

        console.log(await exec.exec(`git diff-tree --name-only HEAD..${lastRelease}`))
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()