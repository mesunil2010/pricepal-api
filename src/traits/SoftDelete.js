import legacy_db from '../db/legacy_db'
import dateFormat from 'date-fns/format'


export default function SoftDelete( parentClass ) {

    return class extends parentClass {
        
        constructor( ...args ) {
            super( ...args );
        }

        async softDelete(autenticatedUser) {
            try {
                this.is_deleted=1
                this.deleted_by=autenticatedUser.id
                this.deleted_at=dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
                
            } catch (error) {
                console.log(error)
                throw new Error('ERROR')
            }
        }
    }
}
