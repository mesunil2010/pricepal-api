
import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'

class Media {
    constructor(data) {
        if (!data) {
            return
        }
        this.id                     = data.id
        this.name                   = data.name
        this.path                   = data.path
        this.type                   = data.type
        this.external_link          = data.external_link;
        this.model_type             = data.model_type;
        this.model_id               = data.model_id;
        this.created_at             = data.created_at;
        
    }

    async deleteLocalFile(localFile) {
        const fs = require('fs')
        // clean up resized image
        fs.unlink(localFile, function(err) {
            if (err) throw err
        })
    }

    async insert(image) {
        try {
            const fs = require('fs')
            
            this.name=image.name
            this.path=image.path
            this.type=image.type
            this.created_at = dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
            //Upload to S3
            let s3Response=await uploadToRemoteStorage(image)
            //Keep trying until uploaded
            /*while(!s3Response.Location)
                s3Response=await uploadToRemoteStorage(image)*/
            this.external_link=s3Response.Location;
            //Remove local copy of the file once uploaded
            try{
                this.deleteLocalFile(this.path);
            }catch(error)
            {
                console.log(error)
            }
            
            return await legacy_db('medias').insert(this)
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async update() {
        try {
            return await legacy_db('medias')
                .update(this)
                .where({ id: this.id })
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async destroy() {
        try {
            return await legacy_db('medias')
                .delete()
                .where({ id: this.id })
        } catch (error) {
            console.log('Media: destroy:' + error)
            throw new Error('ERROR')
        }
    }

    async find() {
        try {
            let result = await findById(this.id)
            if (!result) return {}
            this.constructor(result)
            return result
        } catch (error) {
            console.log(error)
            throw new Error('ERROR')
        }
    }

    async findByModel() {
        try {
            let result = await findByModelInfo(this.model_type,this.model_id)
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
        let [data] = await legacy_db('medias')
        .select('id','name','path','type','external_link','model_type','model_id','created_at')
            .where({id: id })
        if(data)
            data.created_at=dateFormat(data.created_at , "YYYY-MM-DD HH:mm:ss")
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function findByModelInfo(model_type,model_id){
    try {
        let [data] = await legacy_db('medias')
        .select('id','name','path','type','external_link','model_type','model_id','created_at')
            .where({model_id: model_id,model_type:model_type })
        if(data)
            data.created_at=dateFormat(data.created_at , "YYYY-MM-DD HH:mm:ss")
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function findStrippedByModelInfo(model_type,model_id){
    try {
        let [data] = await legacy_db('medias')
        .select('name','external_link')
            .where({model_id: model_id,model_type:model_type })
        return data
    } catch (error) {
        console.log(error)
        throw new Error('ERROR')
    }
}

async function uploadToRemoteStorage(image) {

    const fs = require('fs')
    var mime = require('mime-types')

    let localFilePath = image.path
    let extension = mime.extension(image.type)
    if (extension == 'jpeg') extension = 'jpg'
    let new_filename = Math.floor(Date.now() /1000) + '.' + extension

    const AWS = require('aws-sdk')
    var BUCKET_NAME = process.env.S3_BUCKET 
    if (image.test) BUCKET_NAME = process.env.S3_TEST_BUCKET 

    const IAM_USER_KEY = process.env.IAM_USER_ID
    const IAM_USER_SECRET = process.env.IAM_USER_KEY

    try {
        const s3 = new AWS.S3({
            accessKeyId: IAM_USER_KEY,
            secretAccessKey: IAM_USER_SECRET,
        }) 
        var params = {
            ACL: 'public-read',
            Bucket: BUCKET_NAME,
            ContentType: image.type,
            Key: new_filename,
            Body: fs.createReadStream(localFilePath),
        }

        return s3.upload(params).promise()
    } catch (e) {
        console.log('error uploading to S3')
        console.log(e)
    }
}

export { Media, findById ,findByModelInfo, findStrippedByModelInfo}

/*
CREATE TABLE `medias` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `external_link` varchar(255) DEFAULT NULL,
  `model_type` varchar(50) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
 */
