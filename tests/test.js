//Only run tests if we've specifically set NODE_ENV to testing
if (process.env.NODE_ENV !== 'testing') {
    throw new Error('NODE_ENV not set')
}

//This starts the app up
import { server } from '../app'
import hmacSHA256 from 'crypto-js/hmac-sha256';

//Set up axios a little bit
import axios from 'axios'
const url = `http://localhost:4002`
const request = axios.create({ baseURL: url })

//Grab the db variable
import legacy_db from '../src/db/legacy_db'

import jwtDecode from 'jwt-decode'

//import userActionController from '../src/controllers/UserActionController'
/*
var legacy_user = {
    id : 200003076,
    api_secret :"0f25be261a93d645f5dc8721dcb7ca9d"
}*/
var create_user = true;
var merchant_id = 15;

beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000
    //As the tests start rollback and migrate our tables
    await legacy_db.migrate.rollback()
    await legacy_db.migrate.latest()
    await legacy_db.seed.run();
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
afterAll(async () => {
    //After all the tests are done we're going to close our server
    //and rollback our database.
    await legacy_db.migrate.rollback()

    //This closes the app but it doesn't stop the tests in
    //Jest when done - that's why we have to --forceExit
    //when running Jest for now.
    return server.close()
})

/////////////
// General //
/////////////

//Variables for testing that get populated from different calls
let accessToken
let refreshToken
let passwordResetToken
let user;

describe('general actions', () => {
    it('API root is up', async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000
        expect.assertions(1)
        await sleep(10000);
        const response = await request.get('/')
        expect(response.status).toBe(200)
    })

})

if(create_user)
{
//////////
// User //
//////////

describe('user account actions', () => {
    it('signs up a user', async () => {
        expect.assertions(1)

        const response = await request.post('/api/v2/user/signup', {
            firstname: 'TestFirstName',
           // lastname: 'TestLastName',
            email: 'aden+test@folo.world',
            password: 'TestPassword',
            influencer_id: 200003076,
            influencer_username: "Aden",
            cause_id:781,
            cause_name:"YGAP"
        })
        expect(response.status).toBe(200)
    })
/*
    it('login a user', async () => {
        expect.assertions(5)

        const response = await request.post('/api/v2/user/login', {
            email: 'TestEmail@example.com',
            password: 'TestPassword',
        })

        expect(response.status).toBe(200)
        expect(response.data.user.id).toBeDefined()
        expect(response.data.jwt_token).toBeDefined()
        expect(response.data.jwt_token.access_token).toBeDefined()
        expect(response.data.jwt_token.refresh_token).toBeDefined()

        //Let's store the returned access and refresh tokens for the
        //upcoming tests. Also we'll set the Auth on the axios
        //instance for testing.
        user = response.data.user;
        accessToken = response.data.jwt_token.access_token
        refreshToken = response.data.jwt_token.refresh_token
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken
    })*/

    it('authenticates a user', async () => {
        expect.assertions(3)

        const response = await request.post('/api/v2/user/authenticate', {
            email: 'aden+test@folo.world',
            password: 'TestPassword',
        })

        expect(response.status).toBe(200)
        expect(response.data.access_token).toBeDefined()
        expect(response.data.refresh_token).toBeDefined()
        //Let's store the returned access and refresh tokens for the
        //upcoming tests. Also we'll set the Auth on the axios
        //instance for testing.
        //console.log(response)

        accessToken = response.data.access_token
        refreshToken = response.data.refresh_token
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken

        user = jwtDecode(accessToken).data

    })
/*
    it("refresh user's accessToken", async () => {
        expect.assertions(3)

        const response = await request.post('/api/v1/user/refreshAccessToken', {
            username: 'TestUsername',
            refreshToken: refreshToken,
        })
        expect(response.status).toBe(200)
        expect(response.data.accessToken).toBeDefined()
        expect(response.data.refreshToken).toBeDefined()
    })

    it("invalidate all the user's refreshTokens", async () => {
        expect.assertions(1)

        const response = await request.post(
            '/api/v1/user/invalidateAllRefreshTokens',
            {
                username: 'TestUsername',
            }
        )
        expect(response.status).toBe(200)
    })

    it('invalidate specific refreshToken', async () => {
        expect.assertions(1)

        const response = await request.post(
            '/api/v1/user/invalidateRefreshToken',
            {
                refreshToken: refreshToken,
            }
        )
        expect(response.status).toBe(200)
    })

    it("forgot user's password", async () => {
        expect.assertions(2)

        const response = await request.post('/api/v1/user/forgot', {
            email: 'TestEmail@example.com',
            url: 'http://koa-vue-notes-api.com/user/reset',
            type: 'web',
        })
        expect(response.status).toBe(200)
        expect(response.data.passwordResetToken).toBeDefined()

        //Store password reset token
        passwordResetToken = response.data.passwordResetToken
    })

    it('checks password reset token', async () => {
        expect.assertions(1)

        const response = await request.post(
            '/api/v1/user/checkPasswordResetToken',
            {
                passwordResetToken: passwordResetToken,
                email: 'TestEmail@example.com',
            }
        )
        expect(response.status).toBe(200)
    })

    it("reset user's password", async () => {
        expect.assertions(1)

        const response = await request.post('/api/v1/user/resetPassword', {
            email: 'TestEmail@example.com',
            passwordResetToken: passwordResetToken,
            password: 'TestPassword',
        })
        expect(response.status).toBe(200)
    })
*/
    it('return data User from a authenticated route', async () => {
        expect.assertions(3)

        const response = await request.get('/api/v2/users/'+user.id, {})
        expect(response.status).toBe(200)

        expect(response.data.email).toBeDefined()
        expect(response.data.api_secret).toBeDefined()
        user = response.data;
        //console.log(user)
    })
})

///////////
// Favourites //
///////////

describe('API users/xxx/favourites actions', () => {

    it('get a favourite', async () => {
        expect.assertions(1)

        const response = await request.get('/api/v2/users/'+user.id+'/favourites/', {})
        expect(response.status).toBe(200)
    })

    it('create a favourite', async () => {
        expect.assertions(1)
        const response = await request.post('/api/v2/users/'+user.id+'/favourites/', {
            merchant_id: 1234,
        })
        expect(response.status).toBe(200)
    })

    it('delete a favourite', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/users/'+user.id+'/favourites/1234', {})
        expect(response.status).toBe(200)
    })

})

var batch_id;
/*
describe('API batches/', () => {

    it('upload a batch', async () => {
        expect.assertions(2)

        const response = await request.post('/api/v2/batches/upload/', {})
        expect(response.status).toBe(200)
        expect(response.data.id).toBeDefined()
        batch_id = response.data.id;
    })

    it('get payments belonging to batch', async () => {
        expect.assertions(1)
        const response = await request.get('/api/v2/payments/?filter=batch_id:'+batch_id)
        expect(response.status).toBe(200)
        expect(response.data.length).toBeDefined()
    })

})*/
/*describe('API users/xxx/favourites actions', () => {
    it('creates a favourite', async () => {
        expect.assertions(1)

        const response = await request.post('/api/v2/users/'+user.id+'/favourites/', {
            merchant_id: 1234,
        })
        expect(response.status).toBe(200)
    })
/*
    it('shows a note', async () => {
        expect.assertions(4)

        const response = await request.get('/api/v1/notes/' + '1')
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.title).toBe('Here is my first note')
        expect(response.data.content).toBe('Here is my main content.')
    })

    it("gets a bunch of a user's notes", async () => {
        expect.assertions(4)

        const response = await request.get('/api/v1/notes/', {
            params: { sort: '', order: 'desc', page: 0, limit: 20 },
        })
        expect(response.status).toBe(200)
        expect(response.data[0].id).toBe(1)
        expect(response.data[0].title).toBe('Here is my first note')
        expect(response.data[0].content).toBe('Here is my main content.')
    })

    it('updates a note', async () => {
        expect.assertions(1)

        const response = await request.put('/api/v1/notes/' + '1', {
            title: 'Here is my first note',
            content: 'Here is my main content.',
        })
        expect(response.status).toBe(200)
    })

    it('deletes a note', async () => {
        expect.assertions(1)

        const response = await request.delete('/api/v1/notes/' + '1')
        expect(response.status).toBe(200)
    })*/
//})
}

///////////
// Merchants //
///////////
describe('API get merchants', () => {


    it('get all merchants', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/merchants')
        expect(response.status).toBe(200)
        expect(response.headers['pagination-count']).toBe("1")
    })

    it('get merchant', async () => {
        expect.assertions(4)

        const response = await request.get('/api/v2/merchants/'+merchant_id)
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(merchant_id)
        expect(response.data.name).toBe("FOLO")
        expect(response.data.url).toBeUndefined()
    })

    it('get merchant with network_url', async () => {
        expect.assertions(4)

        const response = await request.get('/api/v2/merchants/'+merchant_id+'?user_id='+user.id)
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(merchant_id)
        expect(response.data.name).toBe("FOLO")
        expect(response.data.network_url).toBe("https://store.folo.world/?sub_id=User_6")
    })


    it('get formatted share value for redirector', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/merchants/'+merchant_id+'?user_id='+user.id)
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(merchant_id)
        expect(response.data.formatted_commission).toBe("0.57%")
    })

    it('create a merchant', async () => {

        const filePath = `${__dirname}/test.jpg`;

        const r2 = require('r2')

        const response = await request.post('/api/v2/user/authenticate', {
            email: 'admin@user.com',
            password: 'TestPassword',
        })

        accessToken = response.data.access_token
        refreshToken = response.data.refresh_token
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken
        
        var headers = {
            'Authorization':'Bearer ' + accessToken,
        }

        // if not found then upload
        var FormData = require('form-data');
        var fs = require('fs');

        var formData = new FormData();
        formData.append('name', 'FOLO test')
        formData.append('displayname', 'FOLO test')
        formData.append('website_url', 'https://store.folo.world/')
        formData.append('percentagevaluef', '1.5')
        formData.append('created_at', '2006-12-26')
        formData.append('status', 'ACTIVE')
        formData.append('file', fs.createReadStream(filePath));

        try{
            var req = await r2.post( url+'/api/v2/merchants',{headers, body: formData}).json
 
        }catch(e)
        {
            console.log(e);
        }
        expect.assertions(1)
        expect(req.message).toBe('SUCCESS')
    }) 


    it('update the merchant', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/merchants/15',{
            displayname: 'Test Merchant diplay updated',
            status: "REMOVED"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated merchant by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/merchants/15',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(15)
        expect(response.data.displayname).toBe('Test Merchant diplay updated')
    }) 

    it('create a product in the merchant', async () => {
        expect.assertions(1)
        const responseOffers = await request.post('/api/v2/merchants/16/products/',{
            name: "test4",
            details: "This is test",
            percentagevaluef: 4.0
        })
        expect(responseOffers.status).toBe(200)
    }) 

    it('update a product in the merchant', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/merchants/16/products/1',{
            details: 'This is updated',
            percentagevaluef: '10'
        })
        expect(response.status).toBe(200)
    })

    it('get an updated product for a merchant', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/merchants/15/products/1',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.details).toBe('This is updated')
    }) 

    it('delete the updated product for the merchant', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/merchants/16/products/2',{})
        expect(response.status).toBe(200)
    })

    it('delete the merchant', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/merchants/15',{})
        expect(response.status).toBe(200)
    })

    

})
/*
let testFilePath = null;
describe('POST /api/v1/documentations/upload - upload a new documentation file', () => {
  const filePath = `${__dirname}/ad.jpg`;

  const fsmz = require('mz/fs');
  console.log('fp',filePath)
  // Upload first test file to CDN
  it('should upload the test file to CDN', () => 
    // Test if the test file is exist
    fsmz.exists(filePath)
      .then((exists) => {
        if (!exists) throw new Error('file does not exist'); 
      })
      
        var FormData = require('form-data');    
        var formData = new FormData()
        formData.append('file', fs.createReadStream(filePath))

        try{

        
        let c = await request
          .post('/api/v2/ads/', {body: formData})
           // Attach the file with key 'file' which is corresponding to your endpoint setting. 
          //.attach('file', filePath)
          .then((res) => {
            const { success, message, filePath } = res.body;

            console.log(success, message)
            expect(success).toBeTruthy();
            expect(message).toBe('Uploaded successfully');
            expect(typeof filePath).toBeTruthy();
            // store file data for following tests
            testFilePath = filePath;
          })
          .catch(err => console.log(err));
          console.log(c)
        }catch(err)
        {
            console.log(err)
        }
      })
      .catch(err => console.log(err))
    
    );
    
});*/

///////////
// Ads //
///////////
describe('/Ads actions', () => {

    it('get an ad by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/ads/256',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(256)
        expect(response.data.image_name).toBe('256.png')
    }) 

    it('create an ad', async () => {

        const filePath = `${__dirname}/test.jpg`;

        const r2 = require('r2')

        var headers = {
            'Authorization':'Bearer ' + accessToken,
        }

        // if not found then upload
        var FormData = require('form-data');
        var fs = require('fs');

        var formData = new FormData();
        formData.append('title', 'Test ad')
        formData.append('image_name', '768.jpg')
        formData.append('link', '/Adairs')
        formData.append('impression_count', '2456')
        formData.append('click_through_count', '12')
        formData.append('priority', '5')
        formData.append('start_date', '2014-01-30T21:51:17.000Z')
        formData.append('end_date', '2018-02-03T12:59:59.000')
        formData.append('status', 'ACTIVE')
        formData.append('file', fs.createReadStream(filePath));

        try{
            var req = await r2.post( url+'/api/v2/ads',{headers, body: formData}).json
 
        }catch(e)
        {
            console.log(e);
        }
        expect.assertions(1)
        expect(req.message).toBe('SUCCESS')
    }) 

    it('update the ad', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/ads/256',{
            title: 'Test ad',
            image_name: "256_updated.png"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated ad by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/ads/256',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(256)
        expect(response.data.image_name).toBe('256_updated.png')
    }) 

    it('delete the ad', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/ads/768',{})
        expect(response.status).toBe(200)
    })


    it('make an ad hot', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/ads/256',{
            is_hot: 1
        })
        expect(response.status).toBe(200)
    })

    it('get the hot offer', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/ads/256',{})
        expect(response.status).toBe(200)
        expect(response.data.is_hot).toBe(1)
    }) 

})

///////////
// Offers //
///////////
describe('/Offer actions', () => {

    it('get an offer by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/offers/243',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(243)
        expect(response.data.type).toBe('COUPON')
    }) 

    it('create offer ad', async () => {
        expect.assertions(1)

        const responseOffers = await request.post('/api/v2/offers',{
            title: 'Test offer',
            type: 'COUPON',
            added_date: "2014-01-30T21:51:17.000Z",
            valid_from_date: "2014-02-03T12:59:59.000Z",
            expire_date: "2018-09-03T12:59:59.000Z",
            status: "ACTIVE"
        })
        expect(responseOffers.status).toBe(200)
    }) 

    it('update the offer', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/offers/243',{
            title: 'Test offer updated',
            status: "REMOVED"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated offer by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/offers/243',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(243)
        expect(response.data.status).toBe('REMOVED')
    }) 

    it('delete the offer', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/offers/244',{})
        expect(response.status).toBe(200)
    })
    
})

///////////
// Vouchers //
///////////
describe('/Voucher actions', () => {

    it('get a voucher by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/vouchers/10971',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(10971)
        expect(response.data.code).toBe('RGSAVE17')
    }) 

    it('create voucher ad', async () => {
        expect.assertions(1)

        const response = await request.post('/api/v2/user/authenticate', {
            email: 'admin@user.com',
            password: 'TestPassword',
        })

        accessToken = response.data.access_token
        refreshToken = response.data.refresh_token
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken

        const responseVouchers = await request.post('/api/v2/vouchers',{
            title: 'Test voucher',
            code: 'X20TEST',
            start_date: "2014-02-03T12:59:59.000Z",
            end_date: "2018-09-03T12:59:59.000Z",
            status: "ACTIVE"
        })
        expect(responseVouchers.status).toBe(200)
    }) 

    it('update the voucher', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/vouchers/10971',{
            title: 'Test voucher updated',
            status: "REMOVED"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated voucher by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/vouchers/10971',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(10971)
        expect(response.data.status).toBe('REMOVED')
    }) 

    it('delete the voucher', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/vouchers/10972',{})
        expect(response.status).toBe(200)
    })

    it('get an deleted voucher by id', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/vouchers/10972',{})
        expect(response.status).toBe(200)
        expect(response.data.is_deleted).toBe(1)
    }) 
    
})

///////////
// Enquiries //
///////////
describe('/enquiries actions', () => {

    it('get an enquiry by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/enquiries/1',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.serialnum).toBe(8000)
    }) 

    it('create an enquiry', async () => {

        const filePath = `${__dirname}/test.jpg`;

        const r2 = require('r2')

        var headers = {
            'Authorization':'Bearer ' + accessToken,
        }

        // if not found then upload
        var FormData = require('form-data');
        var fs = require('fs');

        var formData = new FormData();
        formData.append('type', 'MISSING')
        formData.append('user_id', '107624')
        formData.append('serialnum', '8006')
        formData.append('transactiondate', '02-Aug-2018 03:11:00 AEST')
        formData.append('merchant_id', '3402')
        formData.append('status', 'REMOVED')
        formData.append('file', fs.createReadStream(filePath));

        try{
            var req = await r2.post( url+'/api/v2/enquiries',{headers, body: formData}).json
 
        }catch(e)
        {
            console.log(e);
        }
        expect.assertions(1)
        expect(req.message).toBe('SUCCESS')
    }) 

    it('update the enquiry', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/enquiries/1',{
            status: "Updated"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated enquiry by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/enquiries/1',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.status).toBe('Updated')
    }) 

    it('delete the enquiry', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/enquiries/1',{})
        expect(response.status).toBe(200)
    })
    
})


//////////
// Buddy Bonus //
///////////
describe('/bonuses actions', () => {

    it('get a bonus by id', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/bonuses/1',{})
        expect(response.status).toBe(200)
        expect(response.data.transaction_id).toBe(1)
    }) 

    it('create a bonus ', async () => {
        expect.assertions(1)
        const responseEnquiries = await request.post('/api/v2/bonuses',{
            user_id: 154168,
            type: "REFERRED_REGISTER",
            transaction_id: 4,
            amount: 20,
            status: "ACTIVE",
            date: "2014-10-05 20:14:08"
        })
        expect(responseEnquiries.status).toBe(200)
    }) 

    it('update the bonus', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/bonuses/1',{
            status: "Updated"
        })
        expect(response.status).toBe(200)
    })

    it('get an updated bonus by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/bonuses/1',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.status).toBe('Updated')
    }) 

    it('delete the bonus', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/bonuses/1',{})
        expect(response.status).toBe(200)
    })
    
})

//////////
// Temp Commission //
///////////
describe('/tempcommissions actions', () => {

    it('get a temp commission by id', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/tempcommissions/1',{})
        expect(response.status).toBe(200)
        expect(response.data.merchant_id).toBe(15)
    }) 

    it('create a temp commission ', async () => {
        expect.assertions(1)
        const response = await request.post('/api/v2/tempcommissions',{
            merchant_id: 16,
            percentagevaluef: 5.00,
            start_date: "2014-10-05 20:14:08",
            end_date: "2014-10-05 20:14:08"
        })
        expect(response.status).toBe(200)
    }) 

    it('update the temp commission', async () => {
        expect.assertions(1)
        const response = await request.put('/api/v2/tempcommissions/1',{
            percentagevaluef: 10.00
        })
        expect(response.status).toBe(200)
    })

    it('get an updated temp commission by id', async () => {
        expect.assertions(3)
        const response = await request.get('/api/v2/tempcommissions/1',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1)
        expect(response.data.percentagevaluef).toBe(10.00)
    }) 

    it('delete the temp commission', async () => {
        expect.assertions(1)
        const response = await request.delete('/api/v2/tempcommissions/2',{})
        expect(response.status).toBe(200)
    })
    
})

///////////
// Payments //
///////////
describe('/payments actions', () => {

    it('get a payment by id', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/transactions',{})
        expect(response.status).toBe(200)
        expect(response.data[0].id).toBe(1)
    }) 
    
})


///////////
// Clicks //
///////////
describe('/Click actions', () => {

    it('get a click by id', async () => {
        expect.assertions(2)
        const response = await request.get('/api/v2/clicks/1782363',{})
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(1782363)
    }) 
    
})

///////////
// Events //
///////////
describe('/EVENTS', () => {

    it('send clickthrough event', async () => {
        expect.assertions(1)
        const response = await request.post('/api/v2/events/clickthrough',{user_id:user.id, model_type:'Merchant', model_id:merchant_id})
        expect(response.status).toBe(200)
    })

    it('check event in DB', async () => {
        expect.assertions(1)
        var events = await legacy_db('clicks')
            .select('*')
                .where({ user_id: user.id })
                .orderBy('clicktimestamp', 'DESC')
                .limit(100)
        expect(events[0].model_id).toBe(merchant_id)
    })

})


///////////
// Legacy //
///////////
describe('API v1 - legacy actions', () => {
    /*it('authenticate extension user', async () => {
        expect.assertions(0)

        const response = await request.post('/api/v1/addon/authenticate', {
        })
        expect(response.status).toBe(200)
    })*/

    /*it('getVersion', async () => {
        expect.assertions(2)

        var user_id = legacy_user.id;
        var api_secret = legacy_user.api_secret;
        var timestamp   = new Date().getTime();
        var verbs_str = timestamp
        var hmac_check  = hmacSHA256(verbs_str, api_secret).toString()
        var url = '/api/'+user_id+'/'+timestamp+'/'+hmac_check
        console.log(url, api_secret)
        const response = await request.get(url)

        expect(response.status).toBe(200)
        expect(response.data.version).toBe(2)
    })*/

    it('getUsefulLinks', async () => {
        expect.assertions(2)



        const response = await request.get(getLegacyUrl('useful-links'))

        expect(response.status).toBe(200)
        expect(response.data['useful-links']).toBeDefined()
    })

    it('getSettings', async () => {
        expect.assertions(2)
        /*
        var user_id = user.id;
        var api_secret = user.api_secret;
        var timestamp   = new Date().getTime();
        var verbs_str = timestamp+"settings"
        var hmac_check  = hmacSHA256(verbs_str, api_secret).toString()
        var url = '/api/'+user_id+'/'+timestamp+'/settings/'+hmac_check*/

        const response = await request.get(getLegacyUrl('settings'))

        expect(response.status).toBe(200)
        expect(response.data.settings[0].pollsettingstimeout).toBeDefined()
    })

    it('getCashback', async () => {
        expect.assertions(1)

        const response = await request.get(getLegacyUrl('cashback-to-date'))

        expect(response.status).toBe(200)
    })

    it('getStores', async () => {
        expect.assertions(1)
        const response = await request.get(getLegacyUrl('stores'))
        expect(response.status).toBe(200)
    })
})

function getLegacyUrl(path)
{
    var user_id = user.id;
    var api_secret = user.api_secret;
    var timestamp   = new Date().getTime();
    var verbs_str = timestamp+path
    var hmac_check  = hmacSHA256(verbs_str, api_secret).toString()

    var url = '/api/'+user_id+'/'+timestamp+'/'+path+'/'+hmac_check
    return url;
}
