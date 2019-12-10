import { Payment } from '../models/Payment'
import { Batch } from '../models/Batch'
import logger from '../logger/log'
import { Media, findByModelInfo } from '../models/Media';
import { User, findByUsername as findUserByUsername } from '../models/User';
import dateFormat from 'date-fns/format'


class BatchController {
    async index(ctx) {
        const params = ctx.params
        const query = ctx.query

        try {
            var batch = new Payment()

            var items = await batch.all(query);
            ctx.body = items;
            ctx.set('Access-Control-Expose-Headers', 'Pagination-Count')
            ctx.set('Pagination-Count', await batch.count(query));

        } catch (error) {
            logger.log('error','BatchController:',error)
            ctx.throw(400, 'INVALID_DATA' + error)
        }
    }
    async parseBatchCSV(_url)
    {
        console.log("BC","parseBatchCSV",_url)
        return new Promise((resolve, reject) => {
            //var fs = require("fs");
            //var stream = fs.createReadStream(_url);
            const AWS = require('aws-sdk')
            const IAM_USER_KEY = process.env.IAM_USER_ID
            const IAM_USER_SECRET = process.env.IAM_USER_KEY
        
            const s3 = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                secretAccessKey: IAM_USER_SECRET,
            }) 
            var BUCKET_NAME = process.env.S3_BUCKET 
            if (process.env.NODE_ENV!="production") BUCKET_NAME = process.env.S3_TEST_BUCKET;

            BUCKET_NAME = BUCKET_NAME.split('/')[0];
            var key = _url.split('s3.amazonaws.com/')[1];
            console.log(key)
            var params = {
                Bucket:BUCKET_NAME, 
                Key: _url.split('s3.amazonaws.com/')[1]
            }
        const s3Stream = s3.getObject(params).createReadStream()
            var csv = require("fast-csv").fromStream(s3Stream);
            var merchants_to_import = []
            var _rows = [];
            var csvStream = csv
            .on("data", function(data){
        
                if(data[0]!="Name")_rows.push(
                {
                name:String(data[0]), 
                amount: String(data[1]), 
                bsb: String(data[2]), 
                bank_account: String(data[3]), 
                username: String(data[4])
                })
        
            })
            .on("end", function(){
                resolve(_rows)
            }).on("error", function(){
                reject()
            });;
        
            //stream.pipe(csvStream);
        });
    }

    
    async upload(ctx)
    {
        const request = ctx.req.fields
        if(!ctx.req.files.file){

            ctx.throw(400, 'INVALID_DATA - no file present')

        }
        
        var batch = new Batch()
        var paid_at = dateFormat(new Date() , "YYYY-MM-DD HH:mm:ss")
        if(request.paid_at)paid_at = dateFormat(request.paid_at , "YYYY-MM-DD HH:mm:ss")

        try {
            let [batch_id] = await batch.insert()

            var media= new Media({model_type:'Batch',model_id:String(batch_id)});
            let [mid] = await media.insert(ctx.req.files.file)
        

            // validate format
            try{
                var rows = await this.parseBatchCSV(media.external_link)


                // create Payments
                for(var i=0;i<rows.length;i++)
                {
                    let row = rows[i];
                    let u = await findUserByUsername(row.username);
                    var p = new Payment()
                    p.user_id       = u.id;
                    p.transactionamount = -row.amount;
                    p.trackingid    = 'batch-'+batch_id
                    p.status        = Payment.PENDING;
                    p.batch_id      = batch_id;
                    p.paid          = 0;
                    p.modifytimestamp = paid_at;
                    let [p_id] = await p.insert();
                }

            }catch(error)
            {
                logger.error(error)
                ctx.throw(400, 'INVALID_DATA')
            }

            ctx.body = { message: 'SUCCESS', id: batch_id , rows:rows.length }
        } catch (error) {
            logger.error(error)
            ctx.throw(400, 'INVALID_DATA')
        }

    }

   
    async update(ctx) {
        const params = ctx.params
        const request = ctx.request.body
        
        console.log("request", request)
        var p = new Payment();
        var batch_id = params.id;

        if(!batch_id)
        {
            ctx.throw(400, 'INVALID_DATA - no batch_id')
        }

        if(request.paid==1)
        {
            // update all payments status & paid

            let payments = await p.all({filter:'batch_id:'+batch_id})
            console.log("payments", payments.length)
            for(var i=0;i<payments.length;i++)
            {
                let payment = new Payment(payments[i])
                payment.status = Payment.COMPLETE;
                payment.paid = 1;
                payment.paidtimestamp = dateFormat(new Date() , "YYYY-MM-DD HH:mm:ss");
                console.log("payment", payment.transactionamount)
                await payment.update();
            }
            ctx.body = { message: 'SUCCESS', id: batch_id , rows:payments.length ,request}
            return;

        }else if(request.paid==0){
            let payments = await p.all({filter:'batch_id:'+batch_id})

            for(var i=0;i<payments.length;i++)
            {
                let payment = new Payment(payments[i])
                payment.status = Payment.PENDING;
                payment.paid = 0;
                payment.paidtimestamp = "0000-00-00 00:00:00";
                console.log("payment", payment.transactionamount)
                await payment.update();
            }
            ctx.body = { message: 'SUCCESS', id: batch_id , rows:payments.length ,request}
            return;
        }

        ctx.body = { message: 'NO_CHANGE', id: batch_id}
    }

    async estimate(ctx)
    {
        const params = ctx.params
        const request = ctx.request.body
        
        // get all transactions with approvedtimestamp between the start_date && end_date

        ctx.body = { amount: '$DEMO' }
        
    }
}

export default  BatchController
