import legacy_db from '../db/legacy_db'
import rand from 'randexp'
import logger from '../logger/log'
/**
 * Created when the FOLO extension makes a request to the API, either for merchants or settings.
 * 
 * Use-case: see first time a user installed the extension, who currently has it enabled, and how many there are. There is no need for ipaddress, or collection of any other data than required for the use-case. This data is to be deleted after no longer used.
 * 
 */
class APIRequestEvent {
    constructor(data) {
        if (!data) {
            return
        }
        this.id             = data.id
        this.user_id        = data.user_id
        this.created_at     = data.created_at;
        this.app_type       = data.app_type;
        this.app_version    = data.app_version;
        this.api_method     = data.api_method;// /settings or /stores
        this.ip_address     = data.ip_address
    }

    async insert() {
        try {
            return await legacy_db('api_request_events').insert(this)
        } catch (error) {
            logger.log(error)
            throw new Error('ERROR')
        }
    }

}

export { APIRequestEvent }
/*
CREATE TABLE `extension_pings` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `created_at` datetime DEFAULT NULL,
    `app_version` text,
    `app_type` text,
    `api_method` text,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  */