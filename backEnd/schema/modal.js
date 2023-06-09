

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
    }
});

let clientInfo = new Schema({

    ClientName:{
        type:String,
        required:true
    },
    productCount:{
        type:String,
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
    modalerName : {
        type:String,
        required:true
    },
    modalerRollNo : {
        type:String,
        required:true
    },
    QATeamName:{
        type:String,
        required:true
    },
    QATeamRollNo:{
        type:String,
        required:true
    },
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
    exceeded:{
        type:Boolean,
        required:true,
        default:false
    }
})

let correctionModel = new Schema({
    clientId:{
        type : ObjectId,
        required:true
    },
    articleId:{
        type:String,
        required:true
    },
    productName:{
        type:String,
        required:true
    },
    modelerName:{
        type:String,
        required:true
    },
    modRollNo:{
        type:String,
        required:true
    },
    QaName:{
        type:String,
        required:true
    },
    QaRollNo:{
        type:String,
        required:true
    },
    correction:{
        type:String,
        required:true
    },
    date:{
        type:Date,
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
    requirement:{
        type:String,
        required:true
    }
})

let Products = mongoose.model('productList',proList);
let clients = mongoose.model('clientList',clientInfo);
let modalerProducts = mongoose.model('assignedProducts',assignedProducts);
let QaReviews = mongoose.model('qaComments',qaComments);
let AdminReviews = mongoose.model('adminComments',adminComments);
let modelerList  = mongoose.model('modeler',modeler);
let budget = mongoose.model('budget',createBudget);
let correction = mongoose.model('correction',correctionModel);
let invoice = mongoose.model('invoices',invoiceData);
let tags = mongoose.model('tags',modelTags);
let helpLine = mongoose.model('helpLine',help);
let requirement = mongoose.model('requiremnet',clientRequirement);

module.exports = {
    Products,
    clients,
    modalerProducts,
    QaReviews,
    AdminReviews,
    modelerList,
    budget,
    correction,
    invoice,
    tags,
    helpLine,
    requirement
}