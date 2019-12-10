import { findById as findUserById } from '../models/User'
import { getTotalBonusInBank } from '../models/Transaction'
import logger from '../logger/log.js'
import globalConst from '../common/Constant'

async function getUserValue(merchant,user_id)
{   
    var user_id=user_id?user_id:0;
    try {
        let user= await findUserById(user_id)
        var revShare=globalConst.DEFAULT_REV_SHARE_VALUE
        if(user)
            revShare = getUserShare(user) 
        var formatted_value = ""

        if(merchant.moneyvaluef)
        {
            var currencyFormatter = require('currency-formatter');
            // Apply rev share, then currency symbol and 2 decimal points                    
            formatted_value = currencyFormatter.format(merchant.moneyvaluef* revShare, { code: 'AUD' });
        }
        // if it's a % revshare, then check FOLO column first then try the Pricepal (default) column
        let percent =  merchant.percentagevaluef
        if(percent) { 
            formatted_value = (Math.round(((percent* revShare) * 100) )/ 100)+"%";
        }
        return formatted_value;

    } catch (err) {
        logger.error('Error during get user value action !', err)
    }  

}

async function getMoneyBackAmount(transaction,merchant,user)
{   
    try {
        var cashBackAmount = 0
        
        if(merchant.fixedmoneyvaluef){
            return merchant.fixedmoneyvaluef
        }

        if(merchant.fixedpercentagevaluef && transaction.value){
            return merchant.fixedpercentagevaluef*transaction.value
        }
        
        //Apply Revenue shareing logic if not fixed and used is present
        var revShare = user?getUserShare(user):globalConst.DEFAULT_REV_SHARE_VALUE

        if(merchant.moneyvaluef){                     
            cashBackAmount = merchant.moneyvaluef * revShare
        }

        if(merchant.percentagevaluef){ 
            cashBackAmount = transaction.commissionamount * revShare;
        }

        return cashBackAmount;

    } catch (err) {
        logger.error('Error during get money back amount action!', err)
    }  

}

async function getBonusCashBackAmount(transaction,merchant,user) {

    try{

        var totalBonusInBank = await getTotalBonusInBank(user.id,transaction);
        var moneyBackAmount = await getMoneyBackAmount(transaction,merchant,user)
        var canBeUsedBonus = 0

        if(totalBonusInBank>moneyBackAmount){
            canBeUsedBonus = moneyBackAmount
        }else{
            canBeUsedBonus = totalBonusInBank
        }

        return canBeUsedBonus
    } catch (err) {
        logger.error('Error during getting bonus cash back amount action!', err)
    }  
}

function getUserShare(user)
{
    try {
        const default_rate=globalConst.DEFAULT_REV_SHARE_VALUE
        if(!user)
            return default_rate
       
        var revShare
        switch(user.level) {
            case 'USER_1':
                revShare=globalConst.USER_1_REV_SHARE_VALUE
                break;
            case 'USER_2':
                revShare=globalConst.USER_2_REV_SHARE_VALUE
                break;
            case 'USER_3':
                revShare=globalConst.USER_3_REV_SHARE_VALUE
                break;
            case 'USER_4':
                revShare=globalConst.USER_4_REV_SHARE_VALUE
                break;
            case 'USER':
            case 'ADMIN':
                revShare=globalConst.ADMIN_REV_SHARE_VALUE
                break;
            default:
                revShare=default_rate
        }
        return revShare;

    } catch (err) {
        logger.error('Error during getting use share value!', err)
    }  

}

export {getUserValue, getUserShare, getMoneyBackAmount, getBonusCashBackAmount}