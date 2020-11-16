const core = require("@actions/core")
const github = require("@actions/github")

async function run() {
    try {
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        let owner = payload.repository.owner.name
        let repo = payload.repository.name

        console.log(owner, repo)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()