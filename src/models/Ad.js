
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'
import {findByModelInfo as findMediaById, findStrippedByModelInfo as findStrippedMediaById } from '../models/Media';
import withFilter from '../traits/Filter'


class Ad {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                   = data.id
        this.title                = data.title
        this.image_name           = data.image_name
        this.link                 = data.link
        this.impression_count     = data.impression_count
        this.click_through_count  = data.click_through_count
        this.priority             = data.priority
        this.start_date           = data.start_date
        this.end_date             = data.end_date
        this.status               = data.status
        this.is_hot               = data.is_hot
    }

    @withFilter
    async all(request) {
        var limit = 100
        var order = 'DESC'
        var orderBy = 'id'
        var page = 0
        var ads = []
        
        try {
            if (request) {
                if (request.order) order = request.order
                if (request.order_by) orderBy = request.order_by                
                if (request.limit) limit = request.limit
                if (request.page) page = request.page
            }

            ads = await legacy_db('ads')
                .select('id','title','image_name','link','impression_count','click_through_count','priority','start_date','end_date','status','is_hot')
                .where(this.filter(this.filterArg))
                .orderBy(orderBy, order)
                .offset(+page * +limit)
                .limit(+limit)

            for(var i=0;i<ads.length;i++)
            {
                ads[i].start_date = dateFormat(ads[i].start_date , "YYYY-MM-DD HH:mm:ss")
                ads[i].end_date = dateFormat(ads[i].end_date, "YYYY-MM-DD HH:mm:ss")
                if(!ads[i].image_url)ads[i].image_url = "https://d20jwizyxnxawh.cloudfront.net/files/ads/"+ads[i].image_name
                if(!ads[i].media)ads[i].media=await findStrippedMediaById('Ad',ads[i].id)
                if(!ads[i].media){
                    ads[i].media={
                        'name' : ads[i].image_name,
                        'external_link' : ads[i].image_url
                    }
                }
            }
            return ads
        
        } catch (error) {
            console.log('Ad: all:' + error)
            throw new Error('ERROR')
        }
    }

    async insert() {

        try {
            return await legacy_db('ads').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('ads')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            console.log(this)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('ads')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Ad: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    async find() {
        try {
            if(!this.id) return {}
            let result = await findById(this.id)
            if (!result) return {}
            this.constructor(result)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findModel() {
        try {
            if(!this.id) return {}
            let result = await findById(this.id)
            if (!result) return {}
            this.constructor(result)
            if(!this.image_url)this.image_url = "https://d20jwizyxnxawh.cloudfront.net/files/ads/"+this.image_name
            if(this.start_date)this.start_date = dateFormat(this.start_date , "YYYY-MM-DD HH:mm:ss")
            if(this.end_date)this.end_date = dateFormat(this.end_date , "YYYY-MM-DD HH:mm:ss")
            if(!this.media)this.media=await findMediaById('Ad',this.id)
            if(!this.media){
                this.media={
                    'name' : this.image_name,
                    'external_link' : this.image_url
                }
            }

        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    @withFilter
    async count(request) {
        var ads = []
        try {

            [ads] = await legacy_db('ads')
                .count('* as totalCount')
                .where(this.filter(this.filterArg))

            return ads.totalCount
        
        } catch (error) {
            console.log('Ad: all:' + error)
            throw new Error('ERROR')
        }
    }

}
async function findById(id) {
    try {
        let [data] = await legacy_db('ads')
            .select('id','title','image_name','link','impression_count','click_through_count','priority','start_date','end_date','status','is_hot')
            .where({id: id })  
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

export { Ad, findById }

/*
CREATE TABLE `ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `size` varchar(15) NOT NULL,
  `image_name` varchar(50) NOT NULL,
  `external_image_link` varchar(250) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `link` varchar(250) DEFAULT NULL,
  `code` text,
  `is_external` tinyint(1) NOT NULL DEFAULT '0',
  `new_tab` tinyint(1) NOT NULL DEFAULT '0',
  `impression_count` int(11) NOT NULL DEFAULT '0',
  `click_through_count` int(11) NOT NULL DEFAULT '0',
  `priority` int(11) NOT NULL DEFAULT '0',
  `locations` text,
  `location_impression_count` text,
  `location_click_through_count` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'ACTIVE',
  `is_hot` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `size` (`size`)
) ENGINE=InnoDB AUTO_INCREMENT=4964 DEFAULT CHARSET=latin1;
 */
