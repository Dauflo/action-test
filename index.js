const core = require('@actions/core')
const github = require('@actions/github')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs= require('fs')

async function run() {
    try {
        const myToken = core.getInput('access-token')
        const ref = core.getInput('ref')
        const octokit = github.getOctokit(myToken)

        let owner = github.context.payload.repository.owner.login
        let repo = github.context.payload.repository.name

        console.log(owner, repo)
        console.log(ref)

        let releases =  await (await octokit.repos.listReleases({owner, repo}))

        let tag = null

        if (releases.data.length > 1) {
            // if release from master, we want to get the last tag from master
            if (releases.data[0].target_commitish === 'master' ||
                releases.data[0].target_commitish === 'main') {
                for (let i = 1; i < releases.data.length; i++) {
                    if (releases.data[i].target_commitish === 'master' ||
                        releases.data[i].target_commitish === 'master') {
                        // gitString = `git diff-tree --name-only HEAD..${releases.data[i].tag_name}`        
                        tag = releases.data[i].tag_name
                        break
                    }
                }
            } else {
                // if release not from master, we want the last tag
                tag = releases.data[1].tag_name
            }
        }

        // if there is no valid tags, take the first commit
        if (!tag) {
            let { stdout, _ } = await exec('git rev-list --max-parents=0 HEAD')
            tag = stdout.split('\n')[0]
        }

        exec(`git diff-tree --name-only HEAD..${tag}`, (error, stdout, stderr) => {
            folders = stdout.split('\n')
            for (let folder of folders) {
                let dockerfilePath = `${folder}/Dockerfile`
                if (fs.existsSync(dockerfilePath)) {
                    console.log(dockerfilePath)

                    octokit.repos.createDispatchEvent({
                        owner,
                        repo,
                        event_type: 'Dispatched event',
                        client_payload: {
                            dockerfile: dockerfilePath,
                            dockerName: folder,
                            version: releases.data[0].tag_name,
                            ref: ref
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