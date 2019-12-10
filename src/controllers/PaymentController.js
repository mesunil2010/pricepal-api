import { Payment } from '../models/Payment'
import { PaymentTotals } from '../models/PaymentTotals'
import logger from '../logger/log'
import { User, findById as findUserById} from '../models/User'


class PaymentController {
    async index(ctx) {
        const params = ctx.params
        const query = ctx.query

        const autenticatedUser = new User(ctx.state.user)
        
        if(autenticatedUser.is_admin!=1){
            if(query.filter)
                query.filter=  query.filter+'|user_id:'+autenticatedUser.id;
            else
                query.filter= 'user_id:'+autenticatedUser.id;
        }   

        try {
            var payment = new Payment()

            var items = await payment.all(query);
            ctx.body = items;
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await payment.count(query));

        } catch (error) {
            logger.log('error','PaymentController:',error)
            ctx.throw(400, 'INVALID_DATA' + error)
        }
    }
    async total(ctx) {
        const query = ctx.query

        const autenticatedUser = new User(ctx.state.user)

        query.user_id = autenticatedUser.id;

        const c_obj = new PaymentTotals({user_id:query.user_id})
        try {
            await c_obj.show(query)
            ctx.body = c_obj.total_transactions;
        } catch (err) {
            logger.log('Error in controller while showing totals',err)
        }
    }

}

export default  PaymentController
