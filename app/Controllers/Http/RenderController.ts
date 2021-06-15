import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Octokit } from '@octokit/rest'
import got from 'got/dist/source'
import cheerio from 'cheerio'
import RenderFromTextValidator from 'App/Validators/RenderFromTextValidator'
import Env from '@ioc:Adonis/Core/Env'

export default class RenderController {

    public async renderFromText({ request }: HttpContextContract) {
        // Validate and sanitize data
        const { markup, content } = await request.validate(RenderFromTextValidator)

        // Github API login
        const octokit = new Octokit({
            auth: Env.get('GITHUB_TOKEN'),
        })

        // Gist creation
        const fileName = `test.${markup}`
        const gistCreationResult = await octokit.gists.create({ public: false, files: { [fileName]: { content: content } } })

        // Getting gist data (raw html, css link, ...)
        const gistJson = await got(`${gistCreationResult.data.html_url!}.json`)
        const html = JSON.parse(gistJson.body).div

        // Delete the gist
        await octokit.gists.delete({ gist_id: gistCreationResult.data.id! })

        const $ = cheerio.load(html);

        // Remove Github stuff
        $('.gist-meta').remove()

        return $('div').first().html();
    }

}
