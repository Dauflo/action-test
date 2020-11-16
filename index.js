const core = require("@actions/core")
const github = require("@actions/github")
const { exec } = require("child_process")
const fs= require("fs")

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

        // console.log(await exec.exec(`git diff-tree --name-only HEAD..${lastRelease}`))
        exec(`git diff-tree --name-only HEAD..${lastRelease}`, (error, stdout, stderr) => {
            folders = stdout.split("\n")
            for (let folder of folders) {
                let dockerfilePath = `${folder}/Dockerfile`
                if (fs.existsSync(dockerfilePath)) {
                    console.log(dockerfilePath)

                    octokit.repos.createDispatchEvent({
                        owner,
                        repo,
                        event_type: "test",
                        client_payload: {
                            dockerfile: dockerfilePath
                        }
                    })
                }
            }
        })
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()