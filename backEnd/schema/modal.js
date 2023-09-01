


const mongoose = require('mongoose');

let Schema = mongoose.Schema;
ObjectId = Schema.ObjectId

let proList = new Schema({
    clientId : {
        type:ObjectId,
        required:true
    },
    productList:{
        type: Array,
        default:[],
        required:true
    },
    approvedClient:{
        type:Boolean,
        required:true,
        default:false
    }
});

let clientInfo = new Schema({

    clientName:{
        type:String,
        required:true
    },
    productCount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        required:true,
        default:"Not_Approved"
    },
    account_Manager:{
        type:String,
        required:false,
        default:""
    },
    project_deadline:{
        type:String,
        required:false,
        default:""
    },
    internal_deadline:{
        type:String,
        required:false,
        default:""
    }
})

let assignedProducts = new Schema({
    clientId:{
        type:ObjectId,
        required:true
    },
    assignedPro:{
        type:Array,
        required:true
    },
    approvedClient :{
        type:Boolean,
        required:true
    }
})

let qaComments = new Schema({
    clientId:{
        type: ObjectId,
        required:true
    },
    articleId:{
        type:String,
        required:true
    },
    modalStatus:{
        type:String,
        required:true
    },
    adminStatus:{
        type:String,
        required:true
    },
    comments:{
        type:Array,
        required:true
    },
    underQA:{
        type:Boolean,
        required:true,
        default:false
    }
})

let adminComments = new Schema({
    clientId:{
        type: ObjectId,
        required:true
    },
    articleId:{
        type:String,
        required:true
    },
    modalStatus:{
        type:String,
        required:true
    },
    adminStatus:{
        type:String,
        required:true
    },
    comments:{
        type:Array,
        required:true
    }
})

let modeler = new Schema({
    modelerName : {
        type:String,
        required:true
    },
    rollNo:{
        type:String,
        required:true
    },
    models:{
        type:Array,
        required:true
    },
    bankDetails:{
        type:Array,
        required:false
    },
    email:{
        type:String,
        required:true
    },
    about:{
        type:String,
        required:false
    }
})

let createBudget = new Schema({
    budget:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    remainingBudget:{
        type:Number,
        required:false
    },
    exceeded:{
        type:Boolean,
        required:true,
        default:false
    },
    totalExpense:{
        type:Number,
        required:true,
    }
})

let invoiceData = new Schema({
    modelerId:{
        type: ObjectId,
        required:true
    },
    invoiceId:{
        type:String,
        required:true
    }   
})

let modelTags = new Schema({
    tagName:{
        type:String,
        required:true,
    }
})

let help = new Schema({
    modelerRollNo:{
        type:String,
        required:true
    },
    modelerName:{
        type:String,
        required:true
    },
    articleId:{
        type:String,
        required:true
    },
    clientId:{
        type:ObjectId,
        required:true
    },
    date:{
        type:Date,
        required:true
    }
})

let clientRequirement = new Schema({
    clientId:{
        type:ObjectId,
        required:true
    },
    articleId:{
        type:String,
        required:false
    },
    additionalInfo:{
        type:String,
        required:true
    }
})

let modelHotspot = new Schema({
    hotspotName:{
        type:String,
        required:true
    },
    normalValue:{
        type:String,
        required:true
    },
    positionValue:{
        type:String,
        required:true
    },
    clientId:{
        type:ObjectId,
        required:true
    },
    articleId:{
        type:String,
        required:true
    },
    hotspotId:{
        type:String,
        required:true
    },
    correction:{
        type:String,
        required:false
    },
    version:{
        type:Number,
        required:false
    },
    modeler:{
        type:String,
        required:true
    },
    QA:{
        type:String,
        required:true
    },
    mod_rollNo:{
        type:String,
        required:true
    },
    QA_rollNo:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    modelerView:{
        type:Boolean,
        required:true,
        default:false
    }

    
})

let Products = mongoose.model('productList',proList);
let clients = mongoose.model('clientList',clientInfo);
let modelerProducts = mongoose.model('assignedProducts',assignedProducts);
let QaReviews = mongoose.model('qaComments',qaComments);
let AdminReviews = mongoose.model('adminComments',adminComments);
let modelerList  = mongoose.model('modeler',modeler);
let budget = mongoose.model('budget',createBudget);
let invoice = mongoose.model('invoices',invoiceData);
let tags = mongoose.model('tags',modelTags);
let helpLine = mongoose.model('helpLine',help);
let requirement = mongoose.model('requiremnet',clientRequirement);
let hotspot = mongoose.model('hotspots',modelHotspot);

module.exports = {
    Products,
    clients,
    modelerProducts,
    QaReviews,
    AdminReviews,
    modelerList,
    budget,
    invoice,
    tags,
    helpLine,
    requirement,
    hotspot
}