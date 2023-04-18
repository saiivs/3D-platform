
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

let Products = mongoose.model('productList',proList);
let clients = mongoose.model('clientList',clientInfo);
let modalerProducts = mongoose.model('assignedProducts',assignedProducts);
let QaReviews = mongoose.model('qaComments',qaComments);
let AdminReviews = mongoose.model('adminComments',adminComments)

module.exports = {
    Products,
    clients,
    modalerProducts,
    QaReviews,
    AdminReviews
}