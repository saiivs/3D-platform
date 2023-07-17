
const db = require("../schema/modal")
const ObjectId = require('mongodb').ObjectId;
const { ISODate } = require('mongodb');
const validator = require('gltf-validator');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


const polygonCounter = async(articleId,clientId,clientName,version)=>{
    try {
        const regex = /[^a-zA-Z0-9]/g;
        clientName = clientName.replace(regex,'_')
        let fullpath = `public/models/${clientName}/${articleId}/version-${version}/${articleId}.glb`
        const modelData = fs.readFileSync(`public/models/${clientName}/${articleId}/version-${version}/${articleId}.glb`);
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

const downloadImages = async(url, path)=>{
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
    
      response.data.pipe(fs.createWriteStream(path));
    
      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve("Success");
        });
    
        response.data.on('error', (err) => {
          reject(err);
        });
      });
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
                    if(x.articleId == item.articleId){
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

    dbGetClientForModaler:async(modalerRollNo)=>{
        try{
          
        let clientData = await db.modalerProducts.aggregate([
            {
                $match:{
                   assignedPro:{$elemMatch :{modRollno : modalerRollNo}}
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
            let cmntDataExist = await db.QaReviews.findOne({clientId:clientId,articleId:id});
            if(!cmntDataExist){
            let model = new db.QaReviews(cmntData);
            let admin = new db.AdminReviews(cmntData);
            await admin.save()
            await model.save()
            }
            const checkModelUnderQA = await db.QaReviews.findOne({clientId:clientId,articleId:id});
            if(!checkModelUnderQA.underQA)
            {
            let updateRes = await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleId": id},{$set:{"assignedPro.$.productStatus": status}});
            await db.Products.updateOne({clientId:clientId,"productList.articleId":id},{$set:{"productList.$.productStatus":status}})
            await db.modelerList.findOneAndUpdate({rollNo:modRollNo,models:{$elemMatch:{articleId:id,clientId:new ObjectId(clientId)}}},{$set:{'models.$.productStatus':status}});
            await db.QaReviews.updateOne({clientId:clientId,articleId:id},{$set:{modalStatus:status}});
            let clientDetails = await db.clients.findOne({_id:clientId});
            if(updateRes){
                return {status:true,data:clientDetails};
            }else{
                throw new Error
            }   
            }else{
               return {status:false,msg:"model under QA"} 
            }
            
        } catch (error) {
            console.log(error);
            return {status:false,msg:"something went wrong while uploading the model!!"};
        }
    },

    dbupdateVersion:async(data,status,count)=>{
        let {id,clientId,modRollNo}  = data;
        let updateModelerListModel = await db.modelerList.findOneAndUpdate({rollNo:modRollNo,models:{$elemMatch:{articleId:id,clientId:new ObjectId(clientId)}}},{$set:{'models.$.version':count}});
        await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleId": id},{$set:{"assignedPro.$.version": count}});
        console.log({updateModelerListModel});
        return;
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
        // await db.modalerProducts.updateOne({clientId:data.clientId,"assignedPro.articleId": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetQaComments:async(clientId,articleId,version)=>{
        try {
            
            let commentData = await db.QaReviews.findOne({clientId:clientId,articleId:articleId});
            let modelDetails = await db.modalerProducts.aggregate([
                {
                    $match:{clientId:new ObjectId(clientId)}
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
            let pngExist = fs.existsSync(`./public/pngFiles/${articleId}&&${clientId}.png`);
            console.log({modelDetails});
        console.log({commentData});
        if(commentData){
            let result = await polygonCounter(articleId,clientId,modelDetails[0].clientDetails[0].clientName,version);
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

    dbAprroveModal:async(clientId,articleId,status,QaName,modelerName,correction,modelName,modRollNo,QaRollNo,productName)=>{
        try {
            console.log({clientId,articleId,modRollNo});
            await db.QaReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{modalStatus:status}});
            await db.AdminReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{modalStatus:status}});
            await db.modelerList.findOneAndUpdate({rollNo:modRollNo,models:{$elemMatch:{articleId:articleId,clientId:new ObjectId(clientId)}}},{$set:{'models.$.productStatus':status}});
           
            let approve = await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": status}});
            
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientId,"productList.articleId":articleId},{$set:{"productList.$.productStatus":status}});
                if(status == 'Correction'){
                    let correctionObj = {
                        clientId:clientId,
                        articleId:articleId,
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
        // await db.modalerProducts.updateOne({clientId:data.clientId,"assignedPro.articleId": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetAdminComments:async(clientId,articleId)=>{
        try {
        let commentData = await db.AdminReviews.findOne({clientId:clientId,articleId:articleId});
        let modelDetails = await db.modalerProducts.aggregate([
            {
                $match:{clientId:new ObjectId(clientId)}
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
            let result = await polygonCounter(articleId,clientId);
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

    dbRejectModal:async(clientId,articleId)=>{
        try {
            console.log({clientId,articleId});
            await db.AdminReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            await db.QaReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            let approve = await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Need Updates","assignedPro.$.adminStatus":"Rejected"}});

            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientId,"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Need Updates","productList.$.adminStatus":"Rejected"}});

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

    dbAdminAprroveModal:async(clientId,articleId)=>{
        try {
            console.log({clientId,articleId});
            await db.AdminReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            await db.QaReviews.updateOne({clientId:clientId,articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            let approve = await db.modalerProducts.updateOne({clientId:clientId,"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Approved","assignedPro.$.adminStatus":"Approved"}});
            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientId,"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Approved","productList.$.adminStatus":"Approved"}});
                
                let clientProList = await db.Products.findOne({clientId:clientId});
                
                let clientApproved = clientProList.productList.find(obj => obj.adminStatus == 'Not Approved' || obj.adminStatus == 'Rejected');
                if(clientApproved == undefined){
                    await db.clients.updateOne({_id:clientId},{$set:{status:"Approved"}})
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
            await db.Products.updateOne({clientId:clientId,'productList.articleId':articleId},{$set:{'productList.$.price':price}});
           let a =  await db.modelerList.findOneAndUpdate({rollNo:modelerRollNo,models:{$elemMatch:{clientId:new ObjectId(clientId),articleId:articleId}}},{$set:{'models.$.price':price}});
           console.log({a});
            await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleId':articleId},{$set:{'assignedPro.$.price':price}});
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
            let updateReff = await db.Products.updateOne({clientId:clientId,'productList.articleId':articleId},{$set:{'productList.$.Reff':url}});
            console.log({updateReff});
            if(updateReff.acknowledged){
                let ack = await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleId':articleId},{$set:{'assignedPro.$.Reff':url}});
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

    dbGetNotifications:async(rollNo,flag)=>{
        try {
            console.log("sdfasdf");
            if(flag == "seeLess"){
            // let today = new Date().setHours(0,0,0,0);
            // let fiveDaysAgo = new Date(today - (5 * 24 * 60 * 60 * 1000));
            let data = await db.hotspot.aggregate([
                {
                    $match:{
                        mod_rollNo:rollNo,
                        date: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $sort:{
                        date:-1
                    }
                },
                {
                    $group:{
                        _id:{
                            version:"$version",
                            articleId:"$articleId",
                            clientId:"$clientId",
                            QA:"$QA"
                        },
                        count:{$sum:1}  
                    }
                },
                {
                    $project:{
                        _id:0,
                        version:"$_id.version",
                        articleId:"$_id.articleId",
                        clientId:"$_id.clientId",
                        QA:"$_id.QA",
                        count:1
                    }
                }
            ]);
            console.log(data);
            let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({});
            }
            
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

    dbGetGlbFileDetails:async(articleId,clientId,version)=>{
        try {
           let clientDetails = await db.clients.findOne({_id:new ObjectId(clientId)});
           let clientName = clientDetails.clientName;
           let resultNew = await polygonCounter(articleId,clientId,clientName,version);
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
        let taged = await db.modalerProducts.updateOne({clientId:clientId,'assignedPro.articleId':articleId},{$set:{'assignedPro.$.tag':tagName}});
        if(taged.acknowledged){
            await db.Products.updateOne({clientId:clientId,'productList.articleId':articleId},{$set:{'productList.$.tag':tagName}});
            let a = await db.modelerList.updateMany(
                {
                    "models.clientId": clientId,
                    "models.articleId": articleId
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
                        "models.articleId": articleId
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
    },

    dbScrapeImg:async(link,productName,articleId,clientName)=>{
        try {console.log("started");
            const folderPath = `./public/images/${clientName}/${articleId}`;
            if(!fs.existsSync(folderPath)){
            const response = await axios.get(link);
            const $ = cheerio.load(response.data);
            let hasMatchingWord = (altText,searchText)=>{
                console.log("hasMAtch called");
                const altWords = altText.toLowerCase().split(' ');
                const searchWords = searchText.toLowerCase().split(' ');
                return searchWords.some(word => altWords.includes(word));
            }
    
            let images = $('img').filter(function() {
                console.log(`image tag: ${this}`);
                const altText = $(this).attr('alt');
                return altText && hasMatchingWord(altText,productName)
            })
            console.log("reached");
           
            const scrapedImages = images.map(function() {
                console.log("called");
                let src = $(this).attr('src');
                let dataZoomImage = $(this).attr('data-zoom-image');
                const srcset = $(this).attr('srcset');
                console.log({src,dataZoomImage,srcset});
    
                const baseUrl = new URL(link);
                if (src && !src.startsWith('http')) {
                  src = new URL(src, baseUrl).href;
                }
                if (dataZoomImage && !dataZoomImage.startsWith('http')) {
                  dataZoomImage = new URL(dataZoomImage, baseUrl).href;
                }
                if(srcset && !srcset.startsWith('http')){
                  srcset = new URL(srcset,baseUrl).href;
                }
                return { src, dataZoomImage, srcset };
              });
              console.log({scrapedImages});

              if(scrapedImages.length != 0 ){
                const imageUrls = Object.values(scrapedImages).map((image) => {
                    if(image.dataZoomImage) return image.dataZoomImage
                    else return image.src
                });
                let nameWithoutSpace = productName.replace(/\s/g, "")  
                const downloadPromises = imageUrls.map((url, index) => {
                  const folderPath = `./public/images/${clientName}/${articleId}`;
                  if(!fs.existsSync(folderPath)){
                    fs.mkdirSync(folderPath,{ recursive: true });
                  }
                  const path = `./public/images/${clientName}/${articleId}/${index + 1}.jpg`;
                  return downloadImages(url, path);
                });
                try {
                  let response = await Promise.allSettled(downloadPromises);
                  response = response.some(obj => obj.status == 'rejected');
                  if(response) return {success:true,message:"Incomplete"};
                  else return {success:true,message:"Complete"}
                } catch (err) {
                  console.error('Error downloading images:', err);
                  return {success:true,message:"No images found!"}
                }   
              }else{
                return {success:true,message:"No images found!"}
              }
            }else{
                return {success:true,message:"Complete"}
            }
        } catch (error) {
            console.log(error);
            return {success:false,message:"server error!!"}
        }
    },

    dbGetClientById:async(clientId,articleId)=>{
        try {
          let client = await db.clients.findOne({_id:clientId});
          let clientPro = await db.Products.findOne({clientId:clientId});
          console.log({clientPro});
            if(client){
                let fileCount = 0;
                if(fs.existsSync(`./public/images/${client.clientName}/${articleId}`));{
                   let files = fs.readdirSync(`./public/images/${client.clientName}/${articleId}`);
                   fileCount = files.length;
                }
                clientPro = clientPro.productList.find(obj => obj.articleId == articleId);
                return {client,fileCount,clientPro}
            } else{
                throw new Error;
            } 
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbCreateHotspot:async(hotspotName,normal,position,articleId,clientId,nor)=>{
        try {
          let obj = {
            hotspotName:hotspotName,
            normalValue:normal,
            positionValue:position,
            articleId:articleId,
            clientId:clientId,
            hotspotId:nor
        }
        await db.hotspot.create(obj)  
        return true;
        } catch (error) {
            console.log(error);
            return false
        }    
    },

    dbGetHotspots:async(articleId,clientId)=>{
        try {
            let clientDetails = await db.clients.findOne({_id:clientId});
            const regex =  /[^a-zA-Z0-9]/g;
            console.log(clientDetails);
            let clientName = clientDetails.clientName.replace(regex,"_");
           let hotspots = await db.hotspot.aggregate([
            {
                $match:{clientId:new ObjectId(clientId),articleId:articleId}
            },
            {
                $group:{
                    _id:null,
                    maxOne:{$max:"$version"}
                }
            }
           ])
           console.log(hotspots);
           if(hotspots.length != 0){
            if(!fs.existsSync(`./public/models/${clientName}/${articleId}/version-${hotspots[0].maxOne + 1}/${articleId}.glb`)){
                return {status:true,version:hotspots.maxOne,msg:"no updates"}
            }else{
                return {status:true,version:hotspots.maxOne,msg:"update available"}
            }  
           }else{
            return {status:false,msg:"New model"};
           }
        } catch (error) {
            console.log(error);
            return {status:false,error:"server error.Something went wrong over fetching hotspots"}
        }    
    },

    dbGetClientForQaDo:async(clientId)=>{
        try {
            let getClient = await db.clients.findOne({_id:clientId});
            if(getClient){
                return getClient
            }else{
                throw new Error;
            } 
        } catch (error) {
            console.log(error);
            return false
        }   
    },

    createCorrection:async(data)=>{
        try {
            let clientDetails = await db.clients.findOne({_id:data.clientId});
            let modelTeam = await db.modalerProducts.findOneAndUpdate({clientId:data.clientId,'assignedPro.articleId':data.articleId},{$set:{"assignedPro.$.productStatus":"Correction"}});
            const regex = /[^a-zA-Z0-9]/g;
            let clientName = clientDetails.clientName.replace(regex,"_");
            if(modelTeam){
                modelTeam = modelTeam.assignedPro.find(obj => obj.articleId == data.articleId);
                let a = await db.modelerList.findOneAndUpdate({rollNo:modelTeam.modRollno,models:{$elemMatch:{articleId:data.articleId,clientId:new ObjectId(data.clientId)}}},{$set:{'models.$.productStatus':"Correction"}});
                await db.Products.updateOne({clientId:data.clientId,"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Correction"}});   
                await db.QaReviews.updateOne({clientId:data.clientId,articleId:data.articleId},{$set:{modalStatus:"Correction",underQA:false}});
            } 
        if(clientDetails){
            if(data.version == 1){
                console.log("first time");
                data.version = 1
                data.QA = modelTeam.QaTeam;
                data.modeler = modelTeam.assigned;
                data.QA_rollNo = modelTeam.qaRollNo;
                data.mod_rollNo = modelTeam.modRollno;
                data.date = new Date()
                let correction = await db.hotspot.create(data);
                console.log({correction});
                return {status:true,version:1,correction:correction._id,client:clientDetails}
            }else{
                console.log("else case run");
                data.QA = modelTeam.QaTeam;
                data.modeler = modelTeam.assigned;
                data.QA_rollNo = modelTeam.qaRollNo;
                data.mod_rollNo = modelTeam.modRollno;
                data.date = new Date()
                let correction = await db.hotspot.create(data);
                return {status:true,version:data.version,correction:correction._id,client:clientDetails}
            }   
        }else{
            throw new Error("client not found")
        }
        } catch (error) {
            console.log(error);
            return {status:false,msg:error}
        }     
    },

    dbGetLatestHotspots:async(clientId,articleId)=>{
        try {
            let updateAvailable = false;
            let clientDetails = await db.clients.findOne({_id:clientId});
            const regex =  /[^a-zA-Z0-9]/g;
            let clientName = clientDetails.clientName.replace(regex,"_");
            let maxVersion = await db.hotspot.aggregate([
            {
                $match:{clientId:new ObjectId(clientId),articleId:articleId}
            },
            {
                $group:{
                    _id:null,
                    maxOne:{$max:"$version"}
                }
            }
        ])
        console.log("asdffffffffffffffffffffffffffff");
        console.log({maxVersion});
        if(maxVersion.length != 0){
          if(fs.existsSync(`./public/models/${clientName}/${articleId}/version-${maxVersion[0].maxOne + 1}/${articleId}.glb`)){
            console.log("Asdfdf");
            updateAvailable = true;
          }
          let latest = await db.hotspot.find({clientId:clientId,articleId:articleId,version:maxVersion[0].maxOne});
        if(latest.length != 0){
            console.log({updateAvailable});
            return {data:latest,update:updateAvailable}
        }else{
            console.log("not corrections");
        } 
        }else{
            console.log("aggragation no");
            return {data:false}
        }
        
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbGetHotspotById:async(hotspotInfo)=>{
        try {
            console.log(hotspotInfo);
            let hotspot = await db.hotspot.find({articleId:hotspotInfo.articleId,clientId:new ObjectId(hotspotInfo.clientId),version:hotspotInfo.version});
            console.log({hotspot});
            if(hotspot.length != 0) return hotspot;
            else throw new Error(`unable to find the hotspot of ${hotspotInfo.version}!!`)
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbUpdateModelUnderQA:async(model)=>{
        try {
            await db.QaReviews.updateOne({clientId:model.clientId,articleId:model.clientId},{$set:{underQA:model.flag}});
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
   
} 