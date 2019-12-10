//I only want migrations, rollbacks, and seeds to run when the NODE_ENV is specified
//in the knex seed/migrate command. Knex will error out if it is not specified.
if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV not set')
}

//We don't want seeds to run in production
if (process.env.NODE_ENV === 'production') {
    throw new Error("Can't run seeds in production")
}

const faker = require('faker')

exports.seed = async function(knex, Promise) {
    //Make 100 notes for 10 different users
    let seedData = [
        {
            "id": 245,
            "title": "20% Discount Coupon - Microsoft Store Australia ",
            "type": "COUPON",
            "preface": "We have an excellent <strong>EXCLUSIVE</strong> Microsoft Store voucher code.<br><br>\r\nCustomers will get a <strong>20% discount on all products</strong> using this voucher.<br><br>",
            "postscript": "<br><br>Don&#39;t forget you can also get up to <strong>10% cashback</strong> when you shop through Moneybackco at the Microsoft Store.<br><br>\r\nValid until the end of November.<br><br>",
            "coupon": "MONEYBACK20",
            "added_date": "2011-11-07T04:16:18.000Z",
            "valid_from_date": null,
            "expire_date": "2011-11-30T13:00:00.000Z",
            "merchant_id": 2057,
            "status": "ACTIVE"
        },
        {
            "id": 244,
            "title": "CafePress - 15% Off All T-shirts Coupon",
            "type": "COUPON",
            "preface": "Get a new T-shirt now from CafePress.com during their 15% Off ALL T-shirts sale! <br><br>",
            "postscript": "This offer is valid from June 1 to June 15th (PST).<br><br>\r\nYou can also get <strong>15% cashback</strong> when you shop through Moneybackco.<br>",
            "coupon": "CPJUNE",
            "added_date": "2011-05-23T08:41:25.000Z",
            "valid_from_date": null,
            "expire_date": "2011-06-15T14:00:00.000Z",
            "merchant_id": 2143,
            "status": "ACTIVE"
        },
        {
            "id": 243,
            "title": "Lenovo - Budget Buster Deal",
            "type": "COUPON",
            "preface": "Save up to 35% on ThinkPad laptops. \r\n<br><br>\r\n<strong>10% off</strong>* all ThinkPad laptops with eCoupon.<br>\r\n<strong>20% off</strong>* all Thinkpads laptops when configuration is $1000 or more with eCoupon.<br>\r\n<strong>30% off</strong>* all Thinkpads laptops when configuration is $1800 or more with eCoupon. <br>\r\n<strong>35% off</strong>* all Thinkpads laptops when configuration is $2200 or more with eCoupon.<br><br>\r\n<a target=\"_blank\" href=\"http://www.s2d6.com/x/?x=c&amp;z=s&amp;v=2144129&t=http://shopap.lenovo.com/au/en/notebooks/thinkpad?cid=au|affil|tl|dgm|budgetbuster|1000001&\"><strong>Find out more HERE.</strong></a>\r\n<br><br>\r\n",
            "postscript": "*eCoupon is not combinable with other eCoupons. *eCoupon excludes warranty, service and options. <br><br>\r\nEnds Sunday May 15. <br><br>\r\nYou can also receive <strong>3.5% cashback</strong> when you shop through Moneybackco.<br>\r\n",
            "coupon": "BUDGETBUSTER",
            "added_date": "2011-05-13T07:23:32.000Z",
            "valid_from_date": null,
            "expire_date": "2011-05-15T14:00:00.000Z",
            "merchant_id": 1843,
            "status": "ACTIVE"
        }
    ]
   
    // Deletes ALL existing entries
    await knex('offers').truncate()

    //Insert users
    await knex('offers').insert(seedData)

}
