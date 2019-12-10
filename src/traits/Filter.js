import Filter from 'knex-filter'

function withFilter( target, property, descriptor ) {

    let originalMethod = descriptor.value;
    descriptor.value = function( ...args ) {
        var [request] = args
        var filterArg =  {}
        if (request.filter) {
            var filterStr=request.filter;
            var filterParts=filterStr.split(['|']);
            filterParts.forEach(function (part) {
                var filterArgs=part.split([':']);
                if(filterArgs[0] && filterArgs[1])  { 
                    filterArg[filterArgs[0]]=filterArgs[1]
                }
            })
        }
        this.filterArg=filterArg
        this.filter = Filter.filter
        return originalMethod.call( this, ...args );
    };

}

export default withFilter
