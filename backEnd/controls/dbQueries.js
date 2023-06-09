
const db = require("../schema/modal")
const ObjectId = require('mongodb').ObjectId;
const { ISODate } = require('mongodb');
const validator = require('gltf-validator');
const fs = require('fs');


const polygonCounter = async(articleID,clientID)=>{
    try {
        let fullpath = `public/models/${articleID}&&${clientID}.glb`
        const modelData = fs.readFileSync(`public/models/${articleID}&&${clientID}.glb`);
        let filename = 'file.gltf'
        let result = await validator.validateBytes(new Uint8Array(modelData), {
            uri: filename,
            maxIssues: 10, // limit max number of output issues to 10
            ignoredIssues: ['UNSUPPORTED_EXTENSION'], // mute UNSUPPORTED_EXTENSION issue
            severityOverrides: { 'ACCESSOR_INDEX_TRIANGLE_DEGENERATE': 0 }, // treat degenerate triangles as errors
            externalResourceFunction: (uri) =>
                new Promise((resolve, reject) => {
                    uri = path.resolve(path.dirname(fullpath), decodeURIComponent(uri));
                    console.info("Loading external file: " + uri);
                    fs.readFile(uri, (err, data) => {
                        if (err) {
                            console.error(err.toString());
                            reject(err.toString());
                            return;
                        }
                        resolve(data);
                    });
                })
        })
        
        return result
    } catch (error) {
        console.log(error);
        return false;
    }

}

module.exports = {
    dbcreateClient:async(client)=>{
        try{
            let data = new db.clients(client);
            let res = await data.save()
            if(res){
                console.log({res});
                return res
            }else{
                return false
            }
        }catch(error){
            return false;
        }
            
    },

    dbcreatePro:async(proData,Id)=>{
        console.log("pro database");
        try{
            let newData = {
                clientId:new ObjectId(Id),
                productList:[]
            }
            for (let pro of proData){
                pro.assigned = false;
                pro.QaTeam = false;
                pro.approved = false;
                pro.productStatus = "Not uploaded";
                pro.adminStatus = "Not Approved"
                newData.productList.push(pro)
            }
            let data = new db.Products(newData);
            let res = await data.save()
            if(res){
                return true
            }else{
                throw new Error
            }
        }catch(error){
            console.log("db");
            console.log(error);
            return false
        }
    },

    dbGetClients:async()=>{
        try{
        let data = await db.clients.find({});
        let monthlyBudget = await db.budget.find({});
        let productDetails = await db.modalerProducts.aggregate([
            {
                $group: {
                  _id: "$clientId",
                  count: {
                    $sum: {
                      $size: {
                        $filter: {
                          input: "$assignedPro",
                          as: "model",
                          cond: { $eq: ["$$model.productStatus", "Approved"] }
                        }
                      }
                    }
                  }
                }
            }
        ]);
        monthlyBudget = monthlyBudget.reverse();
        let budgetData = monthlyBudget.length != 0 ? monthlyBudget[0].budget : 0;
        if(data){
            if(Array.isArray(data)){
                return {data,budgetData,productDetails};
            }else{
                let Arr = [];
                Arr.push(data)
                return {Arr,budgetData,productDetails}
            }        
        }else{
            throw new Error
        }
        }catch(error){
            return false;
        }   
    },

    dbGetPro:async(id)=>{
        try {
            let proData = await db.Products.findOne({clientId:id});
            let budget = await db.budget.find({});
            let requirement = await db.requirement.find({clientId:id});
            budget = budget.reverse();
            let budgetData = budget.length != 0 ? budget[0].budget : 0;
            if(proData){
            let Arr = [];
            Arr.push(proData)
            Arr.push({budgetValue:budgetData});
            return {Arr,requirement}
            }else{
                throw new Error("Products Not Found")
            }
        } catch (error) {
            console.log(error);
            return false
        }   
    },

    assignPro:async(data,name,QaName,modRoll,QaRoll)=>{
        try {
            let date = new Date()
            date.setHours(0, 0, 0, 0);
            let proListforModeler  =  data.products.map(obj => {
                return {...obj,QaTeam:QaName,qaRollNo:QaRoll,modRollno:modRoll,modelerName:name,clientId:new ObjectId(data.clientId),date:date,price:0,invoice:false,tag:""}
            })

            let modeler  = {
                modelerName : name ,
                rollNo:modRoll,
                models:[...proListforModeler],
                bankDetails:[]
            }
            let modelerExist = await db.modelerList.find({rollNo:modRoll});
            console.log({modelerExist});
            if(modelerExist.length != 0){
                await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:{$each:proListforModeler}}})
            }else{
                await db.modelerList.create(modeler)
            }
            for(let item of data.products){
                item.assigned = name;
                item.QaTeam = QaName;
                item.modRollno = modRoll;
                item.qaRollNo = QaRoll;
                item.productStatus = "Not Uploaded"  
                item.date = date;
                item.price = 0;
                item.invoice = false;
                item.tag = ""
                     }
            let sameClientPro = await db.modalerProducts.findOne({clientId:data.clientId});
            if(sameClientPro){
                await db.modalerProducts.updateOne({_id:sameClientPro._id},{$push:{assignedPro:{$each:data.products}}});
            }else{
            let formatedData = {
                modalerName : name,
                modalerRollNo:data.rollNo,
                QATeamName : QaName,
                QATeamRollNo:data.QaRoll,
                clientId:new ObjectId(data.clientId),
                assignedPro:data.products,
                approvedClient: true,
                date:date  
                  }
        let prod = new db.modalerProducts(formatedData);
        await prod.save();
        
            }
            let toBeupdated = await db.Products.findOne({clientId:data.clientId});
            for(let item of data.products){
               for(let x of toBeupdated.productList){
                    if(x.articleID == item.articleID){
                        x.assigned = name;
                        x.QaTeam = QaName;
                        x.qaRollNo = QaRoll;
                        x.modRollno = modRoll
                        break;
                    }
               }
            }
            let update = await db.Products.updateOne({clientId:data.clientId},{$set:{productList:toBeupdated.productList}});
            console.log({update});
            if(update){
                 return true
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbGetClientForModaler:async(ModalerName)=>{
        try{
          
        let clientData = await db.modalerProducts.aggregate([
            {
                $match:{
                   assignedPro:{$elemMatch :{assigned : ModalerName}}
                }
            },
            {
                $lookup:{
                    from:"clientlists",
                    localField:"clientId",
                    foreignField:"_id",
                    as:"ClientData"
                }
            },
            {
                $lookup:{
                    from:'modelers',
                    localField:"assignedPro.modRollno",
                    foreignField:'rollNo',
                    as:"modelerData"
                }
            }
        ])
        console.log(clientData);
        if(clientData){
            return clientData
        }else{
            throw new Error
        }
        }catch(error){
            console.log(error);
            return false;
        }
    } ,
    
    dbGetAssignedPro:async(id)=>{

        try {
           let proData = await db.modalerProducts.findOne({_id:id});
            console.log(proData); 
            if(proData){
                if(Array.isArray(proData))return proData;
                else {
                    let arr = [];
                    arr.push(proData);
                    return arr;
                }
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbupdateProductStatus:async(data,status)=>{
        try {
            let {id,clientId,modRollNo}  = data;
            let cmntData = {
                clientId : clientId,
                articleId : id,
                modalStatus:'Uploaded',
                adminStatus: 'Not Approved',
                comments:[]
            }
            let model = new db.QaReviews(cmntData);
            let admin = new db.AdminReviews(cmntData);
            await admin.save()
            await model.save()
            let updateRes = await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleID": id},{$set:{"assignedPro.$.productStatus": status}});
            await db.Products.updateOne({clientId:clientId,"productList.articleID":id},{$set:{"productList.$.productStatus":status}})
            await db.modelerList.findOneAndUpdate({rollNo:modRollNo,models:{$elemMatch:{articleID:id,clientId:new ObjectId(clientId)}}},{$set:{'models.$.productStatus':status}});
            
            if(updateRes){
                return true;
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetClientsForQa:async(qaRollNo)=>{
        try {
            let clients = await db.modalerProducts.aggregate([
                {
                    $match:{QATeamRollNo:qaRollNo}
                },
                {
                    $lookup:{
                        from:"clientlists",
                        localField:"clientId",
                        foreignField:"_id",
                        as:"ClientData"
                    }
                }
            ])
            console.log(clients);
            if(clients){
                return clients
            }else{
                throw new Error
            } 
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbGetQaPro:async(id)=>{
        try {
            console.log({id});
            let proList = await db.modalerProducts.aggregate([
                {
                    $match:{_id:new ObjectId(id)}
                },
                {
                    $lookup:{
                        from:"clientlists",
                        localField:"clientId",
                        foreignField:"_id",
                        as:"ClientData"
                    }
                }
            ])
            console.log({proList});
            if(proList){
                if(Array.isArray(proList)){
                    return proList
                }else{
                    let Arr = [];
                    Arr.push(proList);
                    return Arr
                }
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbCreateComntQa:async(data,user)=>{
        try {
            console.log({data});
            let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true, hourCycle: 'h12' })
            let curDate = new Date().toISOString().slice(0,10)
            let obj = {
                date: curDate,
                time:time,
                user:data.user,
                roll:user.role,
                name:user.name,
                cmnt:data.comment 
            }
        let updateCmnt = await db.QaReviews.updateOne({clientId:data.clientId,articleId:data.articleId},{$push:{comments:obj}});
        if(updateCmnt){
            console.log({updateCmnt});
            return true
        }else{
            throw new Error
        }
        // await db.modalerProducts.updateOne({clientId:data.clientId,"assignedPro.articleID": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleID":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetQaComments:async(clientID,articleID)=>{
        try {
            
            let commentData = await db.QaReviews.findOne({clientId:clientID,articleId:articleID});
            let modelDetails = await db.modalerProducts.aggregate([
                {
                    $match:{clientId:new ObjectId(clientID)}
                },
                {
                    $lookup:{
                        from:'clientlists',
                        localField:'clientId',
                        foreignField:'_id',
                        as:'clientDetails'
                    }
                }
            ])
            let pngExist = fs.existsSync(`./public/pngFiles/${articleID}&&${clientID}.png`);
            
        console.log({commentData});
        if(commentData){
            let result = await polygonCounter(articleID,clientID);
            console.log({result});
            if(result){
              let gltfData = result; 
              let Arr = [];
              Arr.push(commentData)
            return {Arr,gltfData,pngExist,modelDetails}  
            }else{
                throw new Error
            }  
        }else{
            return false
        }
        } catch (error) {
            console.log(error);
            return false;
        }
        
    },

    dbAprroveModal:async(clientID,articleID,status,QaName,modelerName,correction,modelName,modRollNo,QaRollNo,productName)=>{
        try {
            console.log({clientID,articleID,modRollNo});
            await db.QaReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:status}});
            await db.AdminReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:status}});
            await db.modelerList.findOneAndUpdate({rollNo:modRollNo,models:{$elemMatch:{articleID:articleID,clientId:new ObjectId(clientID)}}},{$set:{'models.$.productStatus':status}});
           
            let approve = await db.modalerProducts.updateOne({clientId:clientID,"assignedPro.articleID": articleID},{$set:{"assignedPro.$.productStatus": status}});
            
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientID,"productList.articleID":articleID},{$set:{"productList.$.productStatus":status}});
                if(status == 'Correction'){
                    let correctionObj = {
                        clientId:clientID,
                        articleId:articleID,
                        productName:modelName,
                        modelerName:modelerName,
                        modRollNo:modRollNo,
                        QaName:QaName,
                        QaRollNo:QaRollNo,
                        correction:correction,
                        date: new Date().setHours(0,0,0,0)
                    }
                    await db.correction.create(correctionObj);   
                }
                if(pro){
                    return true;
                }else{
                    throw new Error
                }
            }else{
                throw new Error
            }
            
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbCreateComntAdmin:async(data)=>{
        try {
            console.log({data});
            let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true, hourCycle: 'h12' })
            let curDate = new Date().toISOString().slice(0,10)
            let obj = {
                date: curDate,
                time:time,
                user:data.user,
                cmnt:data.comment
            }
        let updateCmnt = await db.AdminReviews.updateOne({clientId:data.clientId,articleId:data.articleId},{$push:{comments:obj}});
        if(updateCmnt){
            return true
        }else{
            throw new Error
        }
        // await db.modalerProducts.updateOne({clientId:data.clientId,"assignedPro.articleID": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleID":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetAdminComments:async(clientID,articleID)=>{
        try {
        let commentData = await db.AdminReviews.findOne({clientId:clientID,articleId:articleID});
        let modelDetails = await db.modalerProducts.aggregate([
            {
                $match:{clientId:new ObjectId(clientID)}
            },
            {
                $lookup:{
                    from:'clientlists',
                    localField:'clientId',
                    foreignField:'_id',
                    as:'clientDetails'
                }
            }
        ])
        if(commentData){
            let result = await polygonCounter(articleID,clientID);
            if(result){
                let gltfData = result;
                let Arr = [];
                Arr.push(commentData)
                return {Arr,gltfData,modelDetails}
            }else{
                throw new Error
            }
            
        }else{
            return false
        }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbRejectModal:async(clientID,articleID)=>{
        try {
            console.log({clientID,articleID});
            await db.AdminReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            await db.QaReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            let approve = await db.modalerProducts.updateOne({clientId:clientID,"assignedPro.articleID": articleID},{$set:{"assignedPro.$.productStatus": "Need Updates","assignedPro.$.adminStatus":"Rejected"}});

            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientID,"productList.articleID":articleID},{$set:{"productList.$.productStatus":"Need Updates","productList.$.adminStatus":"Rejected"}});

                console.log({pro});
                if(pro){
                    return true;
                }else{
                    throw new Error
                }
            }else{
                throw new Error
            }
            
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbAdminAprroveModal:async(clientID,articleID)=>{
        try {
            console.log({clientID,articleID});
            await db.AdminReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            await db.QaReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            let approve = await db.modalerProducts.updateOne({clientId:clientID,"assignedPro.articleID": articleID},{$set:{"assignedPro.$.productStatus": "Approved","assignedPro.$.adminStatus":"Approved"}});
            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientID,"productList.articleID":articleID},{$set:{"productList.$.productStatus":"Approved","productList.$.adminStatus":"Approved"}});
                
                let clientProList = await db.Products.findOne({clientId:clientID});
                
                let clientApproved = clientProList.productList.find(obj => obj.adminStatus == 'Not Approved' || obj.adminStatus == 'Rejected');
                if(clientApproved == undefined){
                    await db.clients.updateOne({_id:clientID},{$set:{status:"Approved"}})
                }
                console.log({pro});
                if(pro){
                    return true;
                }else{
                    throw new Error
                }
            }else{
                throw new Error
            }
            
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbCreateComntModaler:async(data)=>{
        try {
            let curDate = new Date().toISOString().slice(0,10);
            let cmntSecExist = await db.QaReviews.findOne({clientId:data.clientId,articleId:data.articleId});
            if(cmntSecExist){
                let modCmnt = {
                    date:curDate,
                    user:data.user,
                    cmnt:[]
                }
                modCmnt.cmnt.push(data.comment);
                let pushModCmnt = await db.QaReviews.updateOne({clientId:data.clientId,articleId:data.articleId},{$push:{comments:modCmnt}});
                if(pushModCmnt){
                    return true
                }else{
                    throw new Error("not updated")
                }
        }
        } catch (error) {
            console.log(error);
            return false
        }    
    },
    dbGetModelerMonthlyStatus:async()=>{
        let currMonth = new Date().getMonth();
        let date = new Date()
        date.setMonth(currMonth)
        date.setHours(0, 0, 0, 0);
        let models = await db.modelerList.aggregate([
            {
                $unwind:"$models"
            },
            {
                $match:{
                    "models.productStatus":  "Approved",
                    $expr: {
                        $eq: [{ $month: "$models.date" }, currMonth + 1]
                    }
                }
            },
            {
                $group:{
                    _id:"$_id",
                    name:{$first:"$modelerName"},
                    count:{$sum : 1}
                }
            },
            {
              $project:{
                _id:0
              }  
            }
        ])
        let allModelers = await db.modelerList.find({});
        return {models,allModelers};
    },

    dbGetStatusDate:async(month,year)=>{
        console.log({month,year});
        let dateModel = await db.modelerList.aggregate([
            {
                $unwind:"$models"
            },
            {
                $match:{
                    "models.productStatus":  "Approved",
                    $expr: {
                        $and:[
                            {$eq: [{ $month: "$models.date" }, month]},
                            {$eq: [{ $year: "$models.date" }, year]}
                        ] 
                    }
                }
            },
            {
                $group:{
                    _id:"$_id",
                    name:{$first:"$modelerName"},
                    count:{$sum : 1}
                }
            },
            {
              $project:{
                _id:0
              }  
            }
        ])
        console.log({dateModel});
        return  dateModel
    },

    dbSetClientManager:async(name,clientId)=>{
        try {
            let setName = await db.clients.updateOne({_id:clientId},{$set:{account_Manager:name}})
            if(setName.acknowledged){
                return true
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            return false;
        }    
    },

    dbSetDeadline:async(date,clientId,type)=>{
        try {
            if(type == 'Project'){
                let setProjectDeadLine = await db.clients.updateOne({_id:clientId},{$set:{project_deadline:date}});
                if(setProjectDeadLine.acknowledged){
                    return true;
                }else{
                    throw new Error
                }
            }else{
                let setInternalDeadLine = await db.clients.updateOne({_id:clientId},{$set:{internal_deadline:date}});
                if(setInternalDeadLine.acknowledged){
                    return true;
                }else{
                    throw new Error
                }
            }
            
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateModelPrice:async(price,clientId,articleId,modelerRollNo,budgetExceed)=>{
        try {
            if(budgetExceed != ""){
                let updateItem = await db.budget.find({}).sort({_id:-1}).limit(1);
                let result = await db.budget.updateOne({_id:updateItem[0]._id},{$set:{exceeded:true}});
                console.log({result});
            }
            await db.Products.updateOne({clientId:clientId,'productList.articleID':articleId},{$set:{'productList.$.price':price}});
           let a =  await db.modelerList.findOneAndUpdate({rollNo:modelerRollNo,models:{$elemMatch:{clientId:new ObjectId(clientId),articleID:articleId}}},{$set:{'models.$.price':price}});
           console.log({a});
            await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleID':articleId},{$set:{'assignedPro.$.price':price}});
            return true;
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbCreateBudget:async(budget)=>{
        console.log(budget);
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        try {
            let budgetData = {
            budget : budget,
            date: date
        }
        await db.budget.create(budgetData);
        return true
        } catch (error) {
            console.log(error);
            return false;
        }  
    },

    dbGetClientExpense:async()=>{
        try {
            let date = new Date().setHours(0,0,0,0)
            let clients = await db.clients.find({});
            if(clients.length){
                let exp = await db.Products.aggregate([
                    {
                        $group:{
                            _id:'$clientId',
                            expense:{$sum:{$sum:'$productList.price'}}
                        }
                    }
                ])
                let budgetData = await db.budget.find({date:date});
                budgetData = budgetData.length != 0 ? budgetData[0].budget : 0;
                return {clients,exp,budgetData}
            }
            
        } catch (error) {
            console.log(error);
            return false;
        }    
    },

    dbUpdateReff:async(url,articleId,clientId)=>{
        try {
            let updateReff = await db.Products.updateOne({clientId:clientId,'productList.articleID':articleId},{$set:{'productList.$.Reff':url}});
            console.log({updateReff});
            if(updateReff.acknowledged){
                let ack = await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleID':articleId},{$set:{'assignedPro.$.Reff':url}});
                console.log({ack});
                if(ack.acknowledged){
                    return true;
                }else{
                    throw new Error
                }
            }else throw new Error
        } catch (error) {
            console.log(error);
            return false;
        }    
    },

    dbGetNotifications:async(userRoll,rollNo,flag)=>{
        try {
            if(flag == "seeLess"){
            let today = new Date().setHours(0,0,0,0);
            let fiveDaysAgo = new Date(today - (5 * 24 * 60 * 60 * 1000));
            let data = await db.correction.find({modRollNo:rollNo,date:{$lte:today,$gte:fiveDaysAgo}});
            let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({});
            }
            console.log(data);
            return {data,helpData};  
            }else{
                let data = await db.correction.find({modRollNo:rollNo});
                console.log({data});
                let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({});
            }
                return {data,helpData};
            }  
        } catch (error) {
            console.log(error);
            return false;
        }    
    },

    dbGetProgress:async(clientId)=>{
        try {
            let data = await db.modalerProducts.aggregate([
            {
                $match:{clientId: new ObjectId(clientId)}
            },
            {
                $unwind : "$assignedPro"
            },
            {
                $group:{
                    _id:'$assignedPro.assigned',
                    totalAmount:{
                        $sum:"$assignedPro.price"
                    },
                    count:{$sum:1},
                    approvedCount:{
                        $sum:{
                            $cond:[
                                {$eq:['$assignedPro.productStatus',"Approved"]},1,0
                            ]
                        }
                    }   
                }
            }
        ])
        if(data.length != 0) return {status:true,response:data};
        else return {status:false,error:"No data found",response:data}
        } catch (error) {
            console.log(error);
            return {status:false,error:"Server error"};
        }   
    },

    dbGetGlbFileDetails:async(articleId,clientId)=>{
        try {
           let resultNew = await polygonCounter(articleId,clientId);
           if(resultNew) return resultNew; 
           else throw new Error;
        } catch (error) {
            return false;
        }    
    },

    dbGetNotificationAdmin:async(flag)=>{
        try {
            if(flag == 'seeLess'){
            let today = new Date().setHours(0,0,0,0);
            let fiveDaysAgo = new Date(today - (5 * 24 * 60 * 60 * 1000));
            let data = await db.correction.find({date:{$lte:today,$gte:fiveDaysAgo}});
            console.log(data);
            return data; 
            }else{
                let data = await db.correction.find({});
                return data;
            }     
        } catch (error) {
            return false;
        }
    },

    dbGenerateInvoice:async(rollNo)=>{
        try {
            let getModerlerModels = await db.modelerList.aggregate([
                {
                    $lookup:{
                        from:'clientlists',
                        localField:'models.clientId',
                        foreignField:'_id',
                        as:'clientDetails'
                    }
                },
                {
                    $match : {rollNo:rollNo}
                }
            ])
            console.log(getModerlerModels);
            if(getModerlerModels){
                return {status:true,data:getModerlerModels}
            }else{
                throw new Error('modeler not found')
            }
        } catch (error) {
            console.log(error);
            return {status:false,error:error}
        }   
    },

    dbCreateBankDetails:async(bankData)=>{
        try {
            let created = await db.modelerList.updateOne({rollNo:bankData.rollNo},{$push:{bankDetails:bankData.bankDetials}});
            if(created.modifiedCount != 0){
                return {status:true,error:false};
            }else{
                return {status:false,error:"not updated"};
            }
        } catch (error) {
            console.log(error);
            return {status:false,error:"server error"}
        }   
    },

    dbCreateInvoice:async(invoiceId,modelerId)=>{
        try {
            let invoiceExist = await db.invoice.find({modelerId:modelerId,invoiceId:invoiceId});
            if(invoiceExist.length == 0){
                await db.modelerList.updateOne(
                    { _id: modelerId },
                    [
                    {
                        $set: {
                        models: {
                            $map: {
                            input: "$models",
                            as: "model",
                            in: {
                                $cond: [
                                {
                                    $and: [
                                    { $eq: [ "$$model.productStatus", "Approved" ] },
                                    { $eq: [ "$$model.invoice", false ] }
                                    ]
                                },
                                { $mergeObjects: [ "$$model", { invoice: true } ] },
                                "$$model"
                                ]
                            }
                            }
                        }
                        }
                    }
                    ]
                );
                await db.modalerProducts.updateMany(
                    {
                        "assignedPro.productStatus": "Approved",
                        "assignedPro.invoice": false
                      },
                      {
                        $set: {
                          "assignedPro.$[elem].invoice": true
                        }
                      },
                      {
                        arrayFilters: [
                          {
                            "elem.productStatus": "Approved",
                            "elem.invoice": false
                          }
                        ]
                      }
                )
            let data = {
                modelerId:modelerId,
                invoiceId:invoiceId
            }
            await db.invoice.create(data)
            return {status:true};
            }else{
                return {status:false,error:"invoice exist"}
            }
        } catch (error) {
            console.log(error);
            return {status:false,error:"Something went wrong!! Server issue"}
        }
    },

    dbUpdateBudgetExceed:async()=>{
        try {
            console.log("db reached");
            let updateItem = await db.budget.find({}).sort({_id:-1}).limit(1);
            console.log(updateItem);
           
                let result = await db.budget.updateOne({_id:updateItem[0]._id},{$set:{exceeded:true}});
                console.log({result});
                if(result.acknowledged){
                    return true;
                }else{
                    return false;
                }
     
        } catch (error) {
            console.log("this one");
            console.log(error);
            return false
        }  
    },

    dbCreateTags:async(tagName)=>{
        try {
            let tagExist = await db.tags.findOne({tagName:tagName})
            if(!tagExist){
                let obj = {
                        tagName:tagName
                    }
            await db.tags.create(obj);
            return true
            } 
        } catch (error) {
            console.log(error);
            return false
        }  
    },

    dbGetTags:async()=>{
        try {
            let tags = await db.tags.find();
            if(!tags){
                return {status:false,error:"No tags has been found"}
            }else{
                return {status:true,data:tags}
            }
        } catch (error) {
            console.log(error);
            return {status:false,error:"Something went wrong!!.server error"}
        }   
    },

    dbAssignTag:async(tagName,articleId,clientId)=>{
        try {
        let taged = await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleID':articleId},{$set:{'assignedPro.$.tag':tagName}});
        if(taged.acknowledged){
            await db.Products.updateOne({clientId:clientId,'productList.articleID':articleId},{$set:{'productList.$.tag':tagName}});
            let a = await db.modelerList.updateMany(
                {
                    "models.clientId": clientId,
                    "models.articleID": articleId
                  },
                  {
                    $set: {
                      "models.$.tag": tagName
                    }
                  },
                  {
                    arrayFilters: [
                      {
                        "models.clientId": clientId,
                        "models.articleID": articleId
                      }
                    ]
                  }
            )
            return true;
        }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbCreateHelpLine:async(modelerRollNo,modelerName,articleId,clientId)=>{
        try {
            let helpLineExist = await db.helpLine.find({modelerRollNo:modelerRollNo,articleId:articleId,clientId:clientId});
            let date = new Date();
            if(helpLineExist.length != 0){
                let fetchedData = new Date(helpLineExist[0].date)
            if(fetchedData.getFullYear() === date.getFullYear() && fetchedData.getMonth() === date.getMonth() && fetchedData.getDate() === date.getDate()){
                return {status:true,resData:'Exist'}
            }else{
                let obj = {
                modelerRollNo:modelerRollNo,
                modelerName:modelerName,
                articleId:articleId,
                clientId:clientId,
                date:new Date()
            }

            let created = await db.helpLine.create(obj);
            if(created){
                return {status:true,resData:'New'};
            }else{
                throw new Error('help line was not created!. something went wrong')
            }
            } 
            }else{
                let obj = {
                    modelerRollNo:modelerRollNo,
                    modelerName:modelerName,
                    articleId:articleId,
                    clientId:clientId,
                    date:new Date()
                }
    
                let created = await db.helpLine.create(obj);
                if(created){
                    return {status:true,resData:'New'};
                }else{
                    throw new Error('help line was not created!. something went wrong')
                }
            }
            
        } catch (error) {
            console.log(error);
            return {status:false};
        }    
    },

    dbGetallModelsForModeler:async(modelerId)=>{
        try {
            console.log({modelerId});
            let modelers = await db.modelerList.find({_id:modelerId});
            console.log(modelers);
            if(modelers.length != 0){
                return modelers;
            } 
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbCreateRequirement:async(clientId,requirement)=>{
        try {
           let obj = {
            clientId:clientId,
            requirement:requirement
        }
        let created = await db.requirement.create(obj);
        console.log(created);
        if(created){
            return true
        } 
        } catch (error) {
            console.log(error);
            return false
        }
        
    }
   
}