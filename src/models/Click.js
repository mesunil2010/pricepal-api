
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import logger from '../logger/log'
import withFilter from '../traits/Filter'
/**
 * Created when a user clicks the activate button in the browser extension, or have gone through the redirector.
 * 
 * Use-case: to match as best possible, transactions that have a malformed or blank sub_id back to the account that created the click. Onlt the bare minimum amount of data to fullfil this usecase should be kept.
 * 
 * Once this usecase is out of scoep, the data should be annonymised so only the number of clicks is recored for each merchant, not the clicker.
 * 
 */

class Click{
    constructor(data) {
        if (!data) {
            return
        }

        this.id             = data.id
        this.user_id        = data.user_id
        this.model_type     = data.model_type
        this.model_id       = data.model_id
        this.clicktimestamp = data.clicktimestamp
        this.ipaddress      = data.ipaddress
        this.source         = data.source
        this.app_type       = data.app_type
        this.app_version    = data.app_version
        this.platform_type  = data.platform_type
        this.platform_version = data.platform_version
        this.version        = data.version

    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var clicks
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }
            clicks= await legacy_db('clicks')
                .select('id','model_type','model_id','clicktimestamp','user_id', 'ipaddress','source','app_type','app_version','platform_type','platform_version','version')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)
            
            for(var i=0;i<clicks.length;i++)
            {
                clicks[i].clicktimestamp = dateFormat(clicks[i].clicktimestamp , "YYYY-MM-DD HH:mm:ss");
            }
            return clicks
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async insert() {
        try {
            return await legacy_db('clicks').insert(this)
        } catch (error) {
            logger.log(error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var clicks
        try {
            [clicks]= await legacy_db('clicks')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))
            return clicks.totalCount
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async find(id) {
        try {
            let result = await findById(id)
            if (!result) return {}
            this.constructor(result)
        return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

}


async function findById(id) {
    try {
        let [data] = await legacy_db('clicks')
            .select('id','model_type','model_id','clicktimestamp','user_id','ipaddress','source','app_type','app_version','platform_type','platform_version','version')
            .where({id: id })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Click }
/*
CREATE TABLE `clicks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `clicktimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ipaddress` varchar(50) NOT NULL,
  `source` text,
  `app_type` varchar(50) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `platform_type` varchar(50) DEFAULT NULL,
  `platform_version` varchar(50) DEFAULT NULL,
  `version` smallint(6) NOT NULL DEFAULT '1',
  `model_type` varchar(50) DEFAULT NULL,
  `model_id` int(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1782331 DEFAULT CHARSET=latin1;
*/

/*
1782312	65662	3186	2018-05-22 19:13:57	58.6.44.68	NULL	Website	NULL	starthere	NULL	2
*/