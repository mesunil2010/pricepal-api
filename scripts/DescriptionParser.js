'use strict';
console.log("Started.....");

const connection_details = {
    host: "",
    user: "",
    password: "",
    database: "starthere_dev",
};
const connection_details_live = {
    host: "",
    user: "",
    password: "",
    database: "starthere_prod",
};

var connection;
var connectionLive;
var errors=[];

(async function () {
    await setupConnection();
    await parseTable();
})();

async function setupConnection () 
{
  const mysql = require('mysql2/promise');
  try {
    connection = await mysql.createConnection(connection_details);
    connectionLive = await mysql.createConnection(connection_details_live);
  } catch (error) {
    console.log(error);
  }
}

async function parseTable () {

    var users=[];
    try {

        var transactions = await getTransactions()
        var count=0
        for ( var i=0;i<transactions.length;i++ ){
            var transaction=transactions[i]
            var liveTransaction=await getTransactionFromLegacy(transaction.trackingid)
            console.log(i)
            if(typeof liveTransaction.trackingid!='undefined' ){
                console.log(liveTransaction.id);
            }
               
        }

        console.log('The count is : '+count);
        process.exit(1);  

    } catch (error) {
        console.log(error);
    }
}

async function getTransactions () {
    try{
        let sql='';
            sql='select * from transactions order by id desc limit 200 OFFSET 10000';
        let rows =  await connection.execute(sql)
        return rows[0];
      } catch (error) {
        console.log(error);
      }
}

async function getTransactionFromLegacy(trackingid) {
    try{
        let sql='';
            var tracking_id=mysql_real_escape_string(trackingid)
            sql='select * from transactions where trackingid="'+tracking_id+'" limit 1';
        let rows =  await connectionLive.execute(sql)
        return rows[0];
      } catch (error) {
        console.log(error);
      }
}

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}