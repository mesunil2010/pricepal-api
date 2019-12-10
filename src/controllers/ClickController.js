import joi from 'joi'
import dateFormat from 'date-fns/format'
import { User } from '../models/User'
import { Click, findById } from '../models/Click'


class ClickController {

    async index(ctx) {
        const query = ctx.query
        try {
            const click = new Click()
            var items = await click.all(query);
            ctx.body = items;
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await click.count(query));
        } catch (error) {
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        if (!params.ids) ctx.throw(400, 'INVALID_DATA')

        var ids = [params.ids]

        //check if more than one
        if (params.ids.indexOf(',') > -1) {
            ids = params.ids.split(',')
        }

        //Initialize
        const click = new Click()

        try {
            if (ids.length > 1) {
                var clicks = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new Click()
                    await tempc.find(ids[i])
                    clicks.push(tempc)
                }
                ctx.body = clicks
            } else {
                //Find and show
                await click.find(params.ids)
                ctx.body = click
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

}

export default ClickController
