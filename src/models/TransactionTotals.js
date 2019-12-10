import legacy_db from '../db/legacy_db'
import rand from 'randexp'
import moment from 'moment'
import getSymbolFromCurrency from 'currency-symbol-map'

class TransactionTotals {
    constructor(data) {
        if (!data) {
            return
        }
        this.start_date = data.start_date
        this.end_date = data.end_date

        this.total_transactions = {}
        //this.total_transactionamount = {}

        this.user_id = data.user_id //all transactions are key'd to the user_id due to Pricepal historic reasons, once rid, maybe switch, b ut no compelling reason if this is uniform accross the codebase.

        //potential future
        //this.affiliate_network_id
    }
    /**
     *
     * @param {*} request  - object - [optional] start_date (YYYY-MM-DD HH:MM:SS), [optional] end_date, user_id, [optional] currency
     */
    async show(request) {
        //test user_id = 200000050;

        this.total_transactions = {}
        //this.total_transactionamount = {};
        let status_map = [
            ['Approved', 'approved'],
            ['Tracking', 'pending'],
            ['To account', 'ready_to_pay'],
            ['Complete', 'paid'],
        ]

        /* status types:
            Approved
            Cancelled
            Complete
            To account
            Tracking
            */
        try {
            this.start_date = moment('2006-01-01').format('YYYY-MM-DD') // HH:MM:SS")
            this.end_date = moment()
                .add(1, 'days')
                .format('YYYY-MM-DD') // HH:MM:SS")

            if (request) {
                if (request.start_date) this.start_date = request.start_date
                if (request.end_date) this.end_date = request.end_date
                if (request.user_id)this.user_id = request.user_id
            }

            if (!this.user_id) {

                //Admin function not yet required - do not include until then

                /*this.total_transactions.total = await db('transactions')
                    .count('* as count')
                    .sum('transactionamount as transactionamount')
                    .where('modifytimestamp', '>', this.start_date)
                    .andWhere('modifytimestamp', '<', this.end_date)

                //totals_temp[0].total
                //totals_temp[0].transactionamount

                for (var i = 0, len = status_map.length; i < len; i++) {
                    this.total_transactions[status_map[i][1]] = await db(
                        'transactions'
                    )
                        .count('* as count')
                        .sum('transactionamount as transactionamount')
                        .sum('commissionamount as commissionamount')
                        .sum('moneybackamount as moneybackamount')
                        .sum('bonuscashbackamount as bonuscashbackamount')
                        .where('modifytimestamp', '>', this.start_date)
                        .andWhere('modifytimestamp', '<', this.end_date)
                        .andWhere({ status: status_map[i][0] })
                }*/
            } else {

                
                var [totalObj] = await legacy_db('transactions')
                    .count('* as count')
                    .sum('moneybackamount as moneybackamount')
                    .sum('bonuscashbackamount as bonuscashbackamount')
                    .whereIn('status',['Approved','Tracking','Complete','To account'])
                    .andWhere('modifytimestamp', '>', this.start_date)
                    .andWhere('modifytimestamp', '<', this.end_date)
                    .andWhere({ user_id: this.user_id })

                    var currency_code = "AUD";
                    if(totalObj.user_currency)currency_code = totalObj.user_currency;
                    var currency_char = getSymbolFromCurrency(currency_code);

                    totalObj.moneybackamount=totalObj.moneybackamount?totalObj.moneybackamount:0
                    totalObj.bonuscashbackamount=totalObj.bonuscashbackamount?totalObj.bonuscashbackamount:0
                    totalObj.amount  = totalObj.moneybackamount+totalObj.bonuscashbackamount
                    totalObj.moneybackamount=currency_char+totalObj.moneybackamount.toFixed(2)
                    totalObj.bonuscashbackamount=currency_char+totalObj.bonuscashbackamount.toFixed(2)
                    totalObj.amount=currency_char+totalObj.amount.toFixed(2)

                    this.total_transactions.total=totalObj

                //totals_temp[0].total
                //totals_temp[0].transactionamount
               

                for (var i = 0, len = status_map.length; i < len; i++) {
                    this.total_transactions[status_map[i][1]] = await legacy_db('transactions')
                        .count('* as count')
                        .sum('transactionamount as transactionamount')
                        .sum('moneybackamount as moneybackamount')
                        .sum('bonuscashbackamount as bonuscashbackamount')
                        .where('modifytimestamp', '>', this.start_date)
                        .andWhere('modifytimestamp', '<', this.end_date)
                        .andWhere({
                            status: status_map[i][0],
                            user_id: this.user_id,
                        })

                        var obj=this.total_transactions[status_map[i][1]][0];

                        obj.moneybackamount=obj.moneybackamount?obj.moneybackamount:0
                        obj.bonuscashbackamount=obj.bonuscashbackamount?obj.bonuscashbackamount:0
                        obj.transactionamount=obj.transactionamount?obj.transactionamount:0                        
                        obj.balance=obj.balance?obj.balance:0

                        obj.balance=obj.moneybackamount+obj.bonuscashbackamount
                        obj.transactionamount=currency_char+obj.transactionamount.toFixed(2)
                        obj.moneybackamount=currency_char+obj.moneybackamount.toFixed(2)
                        obj.bonuscashbackamount=currency_char+obj.bonuscashbackamount.toFixed(2)
                        obj.balance=currency_char+obj.balance.toFixed(2)

                        this.total_transactions[status_map[i][1]] = obj
                }

            }
            return this.total_transactions;

        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }
}

export { TransactionTotals }

/*
CREATE TABLE `transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Global transaction ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'User ID',
  `serialnum` bigint(20) unsigned NOT NULL DEFAULT '0',
  `trackingid` varchar(100) NOT NULL DEFAULT '0',
  `merchantid` bigint(20) unsigned NOT NULL DEFAULT '0',
  `transactionamount` double DEFAULT '0',
  `moneybackamount` double DEFAULT '0',
  `commissionamount` double DEFAULT '0',
  `revshareamount` double DEFAULT '0',
  `wlrevshareamount` double DEFAULT '0',
  `cashbackshareamount` double DEFAULT '0',
  `bonuscashbackamount` double DEFAULT NULL,
  `validated` char(1) DEFAULT 'N',
  `tracking` char(1) DEFAULT 'N',
  `received` char(1) DEFAULT 'N',
  `declined` char(1) DEFAULT 'N',
  `paid` char(1) DEFAULT NULL,
  `status` varchar(10) DEFAULT 'Tracking',
  `additionalinfo` varchar(255) DEFAULT NULL,
  `createtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modifytimestamp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `approvedtimestamp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `paidtimestamp` datetime DEFAULT NULL,
  `version` tinyint(4) NOT NULL DEFAULT '1',
  `currency` char(3) NOT NULL DEFAULT 'AUD',
  `check_hash` text,
  `rev_share_id` int(11) DEFAULT NULL,
  `wl_rev_share_user_id` bigint(20) DEFAULT NULL,
  `cashback_share_id` int(11) DEFAULT NULL,
  `bonus_id` int(11) DEFAULT NULL,
  `uplift_id` int(11) DEFAULT NULL,
  `rapidpay_transaction_id` int(11) DEFAULT NULL,
  `has_items` tinyint(1) NOT NULL DEFAULT '0',
  `cause_share` tinyint(4) DEFAULT NULL,
  `cause_share_amount` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `serialnum` (`serialnum`),
  KEY `modifytimestamp` (`modifytimestamp`),
  KEY `merchantid` (`merchantid`,`modifytimestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=580705 DEFAULT CHARSET=latin1;*/
