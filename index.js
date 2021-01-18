const core = require("@actions/core")
const github = require("@actions/github")
const { exec } = require("child_process")
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

        let gitString = ''

        if (releases.length > 1) {
            gitString = `git diff-tree --name-only HEAD..${releases.data[1].tag_name}`
        } else {
            exec('git rev-list --max-parents=0 HEAD', (error, stdout, stderr) => {
                gitString = `git diff-tree --name-only HEAD..${stdout}`
            })
        }

        exec(gitString, (error, stdout, stderr) => {
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
                            dockerfile: dockerfilePath,
                            dockerName: folder
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