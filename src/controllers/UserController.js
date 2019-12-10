import logger from '../logger/log.js'
import dateFormat from 'date-fns/format'
import legacy_db from '../db/legacy_db'
import { User,findById as findUserById,getUserBalance, getUserReferrals } from '../models/User'

class UserController {
    async index(ctx) {
        const query = ctx.query

        //Attach logged in user
        const autenticatedUser = new User(ctx.state.user)


        //ToDo: revise - code debt

        //validate user is an admin
        //Let's find that user
        var [userData] = await legacy_db('users')
            .where({
                id: autenticatedUser.id,
            })
            .select('id', 'is_admin')
        if (!userData) {
            ctx.throw(401, 'UNAUTHORIZED_USER')
        }

        //if so then return the data
        if (userData.is_admin) {
            let result = {}
            const user = new User()
            let users = await user.all(query)
            ctx.body = users
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await user.count(query));
        } else {
            ctx.throw(401, 'UNAUTHORIZED_USER')
        }

    }

    async show(ctx) {
        const params = ctx.params
        const query = ctx.query;
        if (!params.ids) ctx.throw(400, 'INVALID_DATA')

        const autenticatedUser = new User(ctx.state.user)

        if(params.ids!=autenticatedUser.id && autenticatedUser.is_admin!=1)
        {
            ctx.throw(401, 'AUTHENTICATION_ERROR')

        }

        var ids = [params.ids]

        //check if more than one
        if (params.ids.indexOf(',') > -1) {
            ids = params.ids.split(',')
        }

        //Initialize
        const userData = new User()


        try {
            if (ids.length > 1) {
                var users = []
                for (var i = 0; i < ids.length; i++) {
                    var tempc = new User()
                    await tempc.findModel(ids[i])
                    users.push(tempc)
                }
                ctx.body = users
            } else {
                //Find and show
                await userData.findModel(params.ids)
                ctx.body = userData
            }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
        
    }

    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body

        //Make sure they've specified a user
        if (!params.id) ctx.throw(400, 'INVALID_ID')

        //Find and set that cause
        const matchingUser = new User()
        await matchingUser.find(params.id)
        if (!matchingUser) ctx.throw(400, 'INVALID_USER')

        //Grab the user //If it's not their user - error out
        const autenticatedUser = new User(ctx.state.user)
        if (autenticatedUser.id !== matchingUser.id &&   autenticatedUser.is_admin!=1){
            ctx.throw(400, 'INVALID_USER_MATCH')
        }

        //Add the updated date value
        matchingUser.updated = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')

        //Add the ip
        //request.ip_address = ctx.ip

        var emptyUser = new User()
        emptyUser.id = matchingUser.id

        //Arrtibutes needed for History decorator
        emptyUser.attributes=['bankname','bankbsb','bankaccount','level','status']
        emptyUser.updatedBy=autenticatedUser.id
        emptyUser.oldModel=await findUserById(matchingUser.id)


        var allowedAttributes=['bankname','bankbsb','bankaccount','level','status']
        
        //ToDo: refactor this into proper whitelist for POST/PUT/PATCH and JOI schema
        Object.keys(ctx.request.body).forEach(function(parameter, index) {
            var isAllowed=0;
            for(let attribute of allowedAttributes){
                if(parameter == attribute){
                    isAllowed=1
                } 
            }
            if(isAllowed==1){
                emptyUser[parameter] = request[parameter]
            }
        })
    

        try {
            await emptyUser.update()
            ctx.body = { message: 'SUCCESS' }
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'UPDATE NOT SUCCESSFULL')
        }
    }

    async getReferrals(ctx)
    {
        const params = ctx.params
        const query = ctx.query

        const user = new User(ctx.state.user)
        if(params.user_id!=user.id)
        {
            ctx.throw(400, 'user_id does not match logged in user.')
        }
        try {
             //check user has enough approved balance
            let referrals = await getUserReferrals(user.id);
            //for each of those users, get their referred users, increment


            ctx.body = referrals;//r_obj;
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }
    }

    /**
     *  Example of response:  { total: , approved: , pending: ,currency: }
     *
     * @param {*} user_id
     */
    async getBalance(ctx)
    {

        const params = ctx.params
        const query = ctx.query

        const user = new User(ctx.state.user)
        if(params.user_id!=user.id)
        {
            ctx.throw(400, 'user_id does not match logged in user.')
        }
        try {
             //check user has enough approved balance
        let balance = await getUserBalance(user.id);
        
            ctx.body = balance;//r_obj;
        } catch (error) {
            console.log(error)
            ctx.throw(400, 'INVALID_DATA')
        }

    }

}
export default UserController
