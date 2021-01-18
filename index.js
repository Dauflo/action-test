const core = require("@actions/core")
const github = require("@actions/github")
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs= require("fs")

async function run() {
    try {
        const myToken = core.getInput("access-token")
        const octokit = github.getOctokit(myToken)

        let owner = github.context.payload.repository.owner.login
        let repo = github.context.payload.repository.name

        console.log(owner, repo)

        // let lastRelease =  await (await octokit.repos.listReleases({owner, repo})).data[1].tag_name
        let releases =  await (await octokit.repos.listReleases({owner, repo}))

        var gitString = ''

        if (releases.length > 1) {
            gitString = `git diff-tree --name-only HEAD..${releases.data[1].tag_name}`
        } else {
            let { stdout, _ } = await exec('git rev-list --max-parents=0 HEAD')
            gitString = `git diff-tree --name-only HEAD..${stdout.split('\n')[0]}`
        }
        console.log(gitString)

        exec(gitString, (error, stdout, stderr) => {
            folders = stdout.split("\n")
            for (let folder of folders) {
                let dockerfilePath = `${folder}/Dockerfile`
                if (fs.existsSync(dockerfilePath)) {
                    console.log(dockerfilePath)

                    octokit.repos.createDispatchEvent({
                        owner,
                        repo,
                        event_type: "Dispatched event",
                        client_payload: {
                            dockerfile: dockerfilePath,
                            dockerName: folder,
                            version: releases.data[0].tag_name
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