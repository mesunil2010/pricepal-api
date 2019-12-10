import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'


function withHistory( parentClass ) {
    return class extends parentClass {
        constructor( ...args ) {
            super( ...args );
        }

        async update() {
            try {

                //Do History stuff only if oldModel and attributes are present 
                if(this.oldModel && this.attributes){
                    var oldModel= this.oldModel            
                    for(let attribute of this.attributes){
                        if(oldModel[attribute]!=this[attribute]){
                            var historyObj={
                                model_type:parentClass.name,
                                model_id:this.id,
                                updated_by:this.updatedBy
                            }
                            historyObj.old_value=oldModel[attribute]
                            historyObj.new_value=this[attribute]
                            this.insertHistory(historyObj)
                        }
                    }
                //Remove atrributes used for History
                delete this.updatedBy
                delete this.attributes
                delete this.oldModel

                }
                
                //Update parent model
                await super.update()

            } catch (error) {
                console.log(error)
                throw new Error('ERROR')
            }
        }

        async insertHistory(obj) {
            try {
                return await legacy_db('history')
                    .insert(obj)
                    .returning('id')
            } catch (error) {
                console.log(error)
                throw new Error('ERROR')
            }
        }

        async getHistoryData() {
            try {
                return await legacy_db('history').where({model_id: this.id,model_type:parentClass.name})
            } catch (error) {
                logger.log(error)
                throw new Error('ERROR')
            }
        }

    }
}

// class History {
//     async updateHistory(attributes,autenticatedUser) {
//         try {
//             var oldModel= await this.findById(this.id)             
//             for(let attribute of attributes){
//                 if(oldModel[attribute]!=this[attribute]){
//                     var historyObj={
//                         model_type:this.constructor.name,
//                         model_id:this.id,
//                         user_id:oldModel.user_id,
//                         updated_by: autenticatedUser.id
//                     }
//                     historyObj.old_value=oldModel[attribute]
//                     historyObj.new_value=this[attribute]
//                     this.insertHistory(historyObj)
//                 }
//             }
            
//         } catch (error) {
//             console.log(error)
//             throw new Error('ERROR')
//         }
//     }

//     async insertHistory(obj) {
//         try {
//             return await legacy_db('history')
//                 .insert(obj)
//                 .returning('id')
//         } catch (error) {
//             console.log(error)
//             throw new Error('ERROR')
//         }
//     }
    
//     async getHistoryData() {
//         try {
//             return await legacy_db('history').where({model_id: this.id,model_type:this.constructor.name.name})
//         } catch (error) {
//             logger.log(error)
//             throw new Error('ERROR')
//         }
//     }
// };


export default withHistory
