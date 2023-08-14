
const db = require("../schema/modal")
const ObjectId = require('mongodb').ObjectId;
const { ISODate } = require('mongodb');
const validator = require('gltf-validator');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { time } = require("console");

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
        let productDetails = await db.modelerProducts.aggregate([
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
            let clientData = await db.clients.findOne({_id:new ObjectId(id)});
            let budget = await db.budget.find({});
            let requirement = await db.requirement.find({clientId:new ObjectId(id)});
            budget = budget.reverse();
            let budgetData = budget.length != 0 ? budget[0].budget : 0;
            if(proData){
            let Arr = [];
            Arr.push(proData)
            Arr.push({budgetValue:budgetData});
            Arr.push(clientData)
            return {Arr,requirement}
            }else{
                throw new Error("Products Not Found")
            }
        } catch (error) {
            console.log(error);
            return false
        }   
    },

    assignPro:async(data,name,email,QaName,modRoll,QaRoll)=>{
        try {
            let date = new Date()
            
            let proListforModeler  =  data.products.map(obj => {
                return {...obj,QaTeam:QaName,qaRollNo:QaRoll,modRollno:modRoll,modelerName:name,clientId:new ObjectId(data.clientId),date:date,price:0,invoice:false,tag:"",QAView:false}
            })
            let obj = {
                clientId:new ObjectId(data.clientId),
                models:[...proListforModeler],
                bonus:[30],
                complete:false,
                completeDate:false,
                adminView:false
            }
            let modeler  = {
                modelerName : name ,
                rollNo:modRoll,
                email:email,
                models:[],
                bankDetails:[],
            }
            modeler.models.push(obj)
            let modelerExist = await db.modelerList.findOne({rollNo:modRoll});
            console.log({modelerExist});
            if(modelerExist){
                let clientListExist = modelerExist.models.find(obj => obj.clientId == data.clientId);
                if(clientListExist){
                    console.log(clientListExist);
                  await db.modelerList.updateOne({rollNo:modRoll,'models.clientId':new ObjectId(data.clientId)},{$push:{'models.$.models':{$each:proListforModeler}}})      
                }else{
                  await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:obj}});
                }
                
            }else{
                console.log("new modeler");
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
                item.tag = "";
                item.QAView = false;
                     }
            let sameClientPro = await db.modelerProducts.findOne({clientId:new ObjectId(data.clientId)});
            if(sameClientPro){
                await db.modelerProducts.updateOne({_id:sameClientPro._id},{$push:{assignedPro:{$each:data.products}}});
            }else{
            let formatedData = {
                clientId:new ObjectId(data.clientId),
                assignedPro:data.products,
                approvedClient: false,
                date:date  
                  }
        let prod = new db.modelerProducts(formatedData);
        await prod.save();
        
            }
            let toBeupdated = await db.Products.findOne({clientId:new ObjectId(data.clientId)});
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
            let update = await db.Products.updateOne({clientId:new ObjectId(data.clientId)},{$set:{productList:toBeupdated.productList}});
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

    reallocationModel:async(data,modelerName,modelerEmail,QaName,modRoll,QaRoll)=>{
        try {
            let date = new Date()
            date.setHours(0, 0, 0, 0);
            let proListforModeler  =  data.products.map(obj => {
                return {...obj,QaTeam:QaName,qaRollNo:QaRoll,modRollno:modRoll,modelerName:modelerName,clientId:new ObjectId(data.clientId),date:date,price:0,invoice:false,tag:"",QAView:false}
            })
            let obj = {
                clientId:new ObjectId(data.clientId),
                models:[...proListforModeler],
                bonus:[30]
            }
              data.products.forEach(async(pro)=>{
              let result = await db.modelerProducts.findOneAndUpdate({clientId:new ObjectId(data.clientId),'assignedPro.articleId':pro.articleId},{$set:{'assignedPro.$.assigned':modelerName,'assignedPro.$.QaTeam':QaName,'assignedPro.$.modRollNo':modRoll,'assignedPro.$.qaRollNo':QaRoll,'assignedPro.$.price':0}})
              await db.Products.updateOne({clientId:new ObjectId(data.clientId),'productList.articleId':pro.articleId},{$set:{'productList.$.assigned':modelerName,'productList.$.QaTeam':QaName,'productList.$.modRollNo':modRoll,'productList.$.qaRollNo':QaRoll,'productList.$.price':0}}); 
              let findModeler = await db.modelerList.findOne({rollNo:modRoll});
              if(findModeler){
                console.log({result});
                let modeler = result.assignedPro.filter((obj)=>{
                    return pro.articleId == obj.articleId;
                })
                console.log({modeler});
                console.log({modelerName});
                if(modeler[0].assigned == modelerName){
                    await db.modelerList.findOneAndUpdate(
                        {
                          rollNo: modRoll,
                          "models.clientId": new ObjectId(data.clientId),
                          "models.models.articleId": pro.articleId
                        },
                        {
                          $set: {
                            "models.$.models.$[inner].QaTeam": QaName,
                            "models.$.models.$[inner].qaRollNo": QaRoll
                          }
                        },
                        {
                          arrayFilters: [{ "inner.articleId": pro.articleId }]
                        }
                      );
                }else{
                    await db.modelerList.updateOne( {
                        rollNo: modRoll,
                        "models.clientId":new ObjectId(data.clientId),
                      },
                      {
                        $pull: {
                          "models.$.models.articleId": pro.articleId,
                        }
                      })
                    let clientListExist = findModeler.models.find(obj => obj.clientId == data.clientId);
                    if(clientListExist){
                      await db.modelerList.updateOne({rollNo:modRoll,'models.clientId':new ObjectId(data.clientId)},{$push:{'models.$.models':{$each:proListforModeler}}})  
                    }else{
                      await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:obj}});
                    }
                    
                }  
              }else{
                let modeler  = {
                    modelerName : modelerName ,
                    rollNo:modRoll,
                    email:modelerEmail,
                    models:[],
                    bankDetails:[],
                }
                modeler.models.push(obj)
                await db.modelerList.create(modeler);
              }
            })
            return true; 
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetClientForModaler:async(modelerRollNo)=>{
        try{
          
        let clientData = await db.modelerProducts.aggregate([
            {
                $match:{
                   assignedPro:{$elemMatch :{modRollno : modelerRollNo}}
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
    
    dbGetAssignedPro:async(id,modRollNo)=>{

        try {
           let proData = await db.modelerProducts.aggregate([
            {
                $match:{_id:new ObjectId(id)}
            },
            {
                $unwind:"$assignedPro"
            },
            {
                $match:{"assignedPro.modRollno":modRollNo,"assignedPro.productStatus":{$ne:'Approved'}}
            },
            {
                $lookup:{
                    from:"clientlists",
                    localField:"clientId",
                    foreignField:"_id",
                    as:"clientDetails"
                }
            },
            {
                $group:{
                    _id:"$_id",
                    assignedPro:{$push:"$assignedPro"},
                    clientId:{$first:"$clientId"},
                    clientDetails:{$first:"$clientDetails"},
                    approvedClient:{$first:"$approvedClient"}
                }
            }
           ])
           if(proData.length > 0){
             let modeler = await db.modelerList.findOne({rollNo:modRollNo})
           let additionalInfo = await db.requirement.find({clientId:new ObjectId(proData[0].clientId)})
           let deadLineBonus;
           if(modeler){
            deadLineBonus = modeler.models.find(obj => obj.clientId.equals(proData[0].clientId));
            console.log({deadLineBonus});
           }
            if(proData){
                return {proData,deadLineBonus,additionalInfo}
            }else{
                throw new Error
            }
           }else{
            return proData
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
                clientId : new ObjectId(clientId),
                articleId : id,
                modalStatus:'Uploaded',
                adminStatus: 'Not Approved',
                comments:[]
            }
            let cmntDataExist = await db.QaReviews.findOne({clientId:new ObjectId(clientId),articleId:id});
            if(!cmntDataExist){
            let model = new db.QaReviews(cmntData);
            let admin = new db.AdminReviews(cmntData);
            await admin.save()
            await model.save()
            }
            const checkModelUnderQA = await db.QaReviews.findOne({clientId:new ObjectId(clientId),articleId:id});
            if(!checkModelUnderQA.underQA)
            {
            let updateRes = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": id},{$set:{"assignedPro.$.productStatus": status,"assignedPro.$.QAView":false}});
            await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":id},{$set:{"productList.$.productStatus":status}})
            await db.modelerList.findOneAndUpdate( {
                rollNo: modRollNo,
                "models.clientId": new ObjectId(clientId),
                "models.models.articleId": id
              },
              {
                $set: {
                  "models.$.models.$[inner].productStatus": status,
                }
              },
              {
                arrayFilters: [{ "inner.articleId": id }]
              });
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:id},{$set:{modalStatus:status}});
            let clientDetails = await db.clients.findOne({_id:new ObjectId(clientId)});
            if(updateRes){
                return {status:true,data:clientDetails,preModalStatus:checkModelUnderQA.modalStatus};
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
        try {
           let {id,clientId,modRollNo}  = data;
           let updateModelerListModel = db.modelerList.findOneAndUpdate( {
            rollNo: modRollNo,
            "models.clientId": new ObjectId(clientId),
            "models.models.articleId": id
          },
          {
            $set: {
              "models.$.models.$[inner].version": count,
            }
          },
          {
            arrayFilters: [{ "inner.articleId": id }]
          });
            let assignedPro = db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": id},{$set:{"assignedPro.$.version": count}});
            let productsList = db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":id},{$set:{"productList.$.version":count}})
            const [updateModelerListModelRes,assignedProRes,productsListRes] = await Promise.all([
                updateModelerListModel,
                assignedPro,
                productsList
            ])
            if(!updateModelerListModelRes||!assignedProRes||!productsListRes) throw new Error('One or more of the updation for version was failed')
            return true;  
        } catch (error) {
            console.log(error);
            return false
        }
       
    },

    dbGetClientsForQa:async(qaRollNo)=>{
        try {
            console.log({qaRollNo});
            let clients = await db.modelerProducts.aggregate([
                {
                    $match:{"assignedPro.qaRollNo":qaRollNo}
                },
                {
                    $lookup:{
                        from:"clientlists",
                        localField:"clientId",
                        foreignField:"_id",
                        as:"clientData"
                    }
                },
                {
                    $unwind:"$clientData"
                }
            ])
            console.log({clients});
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
            let requirement = false;
            let proList = await db.modelerProducts.aggregate([
                {
                    $match:{_id:new ObjectId(id)}
                },
                {
                    $unwind:"$assignedPro"
                },
                {
                    $match:{"assignedPro.productStatus":{$ne:"Approved"}}
                },
                {
                    $lookup:{
                        from:"clientlists",
                        localField:"clientId",
                        foreignField:"_id",
                        as:"clientData"
                    }
                },
                {
                    $group:{
                        _id:"$_id",
                        clientId: { $first: "$clientId" },
                        assignedPro: { $push: "$assignedPro" },
                        approvedClient: { $first: "$approvedClient" },
                        clientData:{$first: "$clientData"}
                    }
                }
            ])
            if(proList.length > 0){
             let clientRequirement = await db.requirement.find({clientId: new ObjectId(proList[0].clientId)});
                if(clientRequirement) requirement = clientRequirement
                if(proList){
                    if(Array.isArray(proList)){
                        return {proList,requirement}
                    }else{
                        let Arr = [];
                        Arr.push(proList);
                        return Arr
                    }   
            }
            
            }else{
                return {proList,requirement}
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
        let updateCmnt = await db.QaReviews.updateOne({clientId:new ObjectId(data.clientId),articleId:data.articleId},{$push:{comments:obj}});
        if(updateCmnt){
            console.log({updateCmnt});
            return true
        }else{
            throw new Error
        }
        // await db.modelerProducts.updateOne({clientId:data.clientId,"assignedPro.articleId": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetQaComments:async(clientId,articleId,version)=>{
        try {
            
            let commentData = await db.QaReviews.findOne({clientId:new ObjectId(clientId),articleId:articleId});
            let modelDetails = await db.modelerProducts.aggregate([
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
            console.log("updation");
            console.log({clientId,articleId,modRollNo});
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:status}});
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:status}});
            let modeler = await db.modelerList.findOne({rollNo:modRollNo});
            let modelList = modeler.models.filter((obj => {
                if(obj.clientId == clientId){
                    return [...obj.models]
                }
            }))
            let flag = false;
            let date;
            modelList.find(obj => obj.productStatus != "Approved");
            flag = modelList.length == 0 ? true : false;
            date = flag ? new Date() : flag;
            await db.modelerList.findOneAndUpdate( {
                rollNo: modRollNo,
                "models.clientId": new ObjectId(clientId),
                "models.models.articleId": articleId
              },
              {
                $set: {
                  "models.$.models.$[inner].productStatus": status,
                  "models.$.complete": flag,
                  "models.$.completedDate":date
                }
              },
              {
                arrayFilters: [{ "inner.articleId": articleId }]
              });
           
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": status}});
            
            if(approve){
                console.log("loeggegeegeg");
            
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":status}});
                if(status == "Approved"){
                    console.log("aprove the modellllll");
                    let modelList = await db.modelerList.findOne({rollNo:modRollNo,'models.clientId':new ObjectId(clientId)});
                    let checkList = modelList.models.find(model => model.productStatus != "Approved");
                    if(checkList){
                        await db.modelerList.updateOne({rollNo:modRollNo,'models.clientId':new ObjectId(clientId)},{$set:{'models.$.complete':true,'models.$.completeDate':new Date()}})
                    } 
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
        let updateCmnt = await db.AdminReviews.updateOne({clientId:new ObjectId(data.clientId),articleId:data.articleId},{$push:{comments:obj}});
        if(updateCmnt){
            return true
        }else{
            throw new Error
        }
        // await db.modelerProducts.updateOne({clientId:data.clientId,"assignedPro.articleId": data.articleId},{$set:{"assignedPro.$.productStatus": "Need Updates"}});
        // await db.Products.updateOne({clientId:data.clientId,"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Need Updates"}})
        
        
        } catch (error) {
           console.log(error);
           return false; 
        }   
    },

    dbGetAdminComments:async(clientId,articleId)=>{
        try {
        let commentData = await db.AdminReviews.findOne({clientId:new ObjectId(clientId),articleId:articleId});
        let modelDetails = await db.modelerProducts.aggregate([
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
            let clientName = modelDetails[0].clientDetails[0].clientName;
            let model = modelDetails[0].assignedPro.find(obj => obj.articleId == articleId);
            let result = await polygonCounter(articleId,clientId,clientName,model.version);
            if(result){
                let gltfData = result;
                let Arr = [];
                Arr.push(commentData)
                console.log(Arr);
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
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:"Need Updates",adminStatus:"Rejected"}});
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Need Updates","assignedPro.$.adminStatus":"Rejected"}});

            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Need Updates","productList.$.adminStatus":"Rejected"}});

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
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Approved","assignedPro.$.adminStatus":"Approved"}});
            console.log({approve});
            if(approve){
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Approved","productList.$.adminStatus":"Approved"}});
                
                let clientProList = await db.Products.findOne({clientId:new ObjectId(clientId)});
                
                let clientApproved = clientProList.productList.find(obj => obj.adminStatus == 'Not Approved' || obj.adminStatus == 'Rejected');
                if(clientApproved == undefined){
                    await db.clients.updateOne({_id:new ObjectId(clientId)},{$set:{status:"Approved"}})
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
            let cmntSecExist = await db.QaReviews.findOne({clientId:new ObjectId(data.clientId),articleId:data.articleId});
            if(cmntSecExist){
                let modCmnt = {
                    date:curDate,
                    user:data.user,
                    cmnt:[]
                }
                modCmnt.cmnt.push(data.comment);
                let pushModCmnt = await db.QaReviews.updateOne({clientId:new ObjectId(data.clientId),articleId:data.articleId},{$push:{comments:modCmnt}});
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
        let currMonth = new Date().getMonth() + 1;
        let currYear = new Date().getFullYear()
        let date = new Date()
        date.setMonth(currMonth)
        
        let models = await db.modelerList.aggregate([
            {
                $unwind:"$models"
            },
            {
                $unwind: "$models.models"
              },
              {
                $match: {
                  "models.models.productStatus": "Approved",
                  "models.models.date": {
                    $gte: new Date(currYear, currMonth - 1, 1),
                    $lt: new Date(currYear, currMonth, 1)
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
                    "models.models.productStatus":  "Approved",
                    $expr: {
                        $and:[
                            {$eq: [{ $month: "$models.models.date" }, month]},
                            {$eq: [{ $year: "$models.models.date" }, year]}
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
            let setName = await db.clients.updateOne({_id:new ObjectId(clientId)},{$set:{account_Manager:name}})
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
                let setProjectDeadLine = await db.clients.updateOne({_id:new ObjectId(clientId)},{$set:{project_deadline:date}});
                if(setProjectDeadLine.acknowledged){
                    return true;
                }else{
                    throw new Error
                }
            }else{
                let setInternalDeadLine = await db.clients.updateOne({_id:new ObjectId(clientId)},{$set:{internal_deadline:date}});
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
            await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':articleId},{$set:{'productList.$.price':price}});
           let a =  await db.modelerList.findOneAndUpdate( {
            rollNo: modelerRollNo,
            "models.clientId": new ObjectId(clientId),
            "models.models.articleId": articleId
          },
          {
            $set: {
              "models.$.models.$[inner].price": price,
            }
          },
          {
            arrayFilters: [{ "inner.articleId": articleId }]
          });
           console.log({a});
            await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.price':price}});
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
            if(clients.length != 0){
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
                return {status:true,clients,exp,budgetData}
            }else{
                return {status:false}
            }    
        } catch (error) {
            console.log(error);
            return false;
        }    
    },

    dbUpdateReff:async(url,articleId,clientId)=>{
        try {
            let updateReff = await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':articleId},{$set:{'productList.$.Reff':url}});
            console.log({updateReff});
            if(updateReff.acknowledged){
                let ack = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.Reff':url}});
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
            let data = await db.hotspot.aggregate([
                {
                    $match:{
                        mod_rollNo:rollNo,
                        modelerView:false,
                        date: { $lte: new Date(new Date() - 5 * 60 * 1000) }
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
                            QA:"$QA",
                            modelerView:"$modelerView"
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
                        modelerView:"$_id.modelerView",
                        count:1
                    }
                }
            ]);
            
            console.log({data});
            let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({});
            }
            
            return {data,helpData};  
            }else{
                let data = await db.hotspot.aggregate([
                    {
                        $match:{mod_rollNo:rollNo}
                    },
                    {
                        $group:{
                            _id:"$version",
                            articleId:{$first:"$articleId"},
                            QA:{$first:"$QA"},
                            version:{$first:"$version"},
                            clientId:{$first:"$clientId"}
                        }
                    },
                    {
                        $sort:{
                            _id:-1
                        }
                    }
                ])
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
            console.log(clientId);
            let data = await db.modelerList.aggregate([
            {
                $match:{'models.clientId':new ObjectId(clientId) }
            },
            {
                $unwind : "$models"
            },
            {
                $match:{'models.clientId': new ObjectId(clientId)}
            },
            {
                $addFields:{
                    totalProducts:{$size:"$models.models"},
                    totalAmount: {
                        $reduce: {
                          input: "$models.models",
                          initialValue: 0,
                          in: { $add: ["$$value", "$$this.price"] }
                        }
                      }
                }
            },
            {
                $group:{
                    _id:"$_id",
                    totalAmount:{
                        $sum:"$totalAmount"
                    },
                    modelerName:{$first:"$modelerName"},
                    modelerRollNo:{$first:"$rollNo"},
                    totalProducts:{$first:"$totalProducts"},
                    models:{$first:"$models.models"},
                    deadLineOne:{$first:"$models.deadLineOne"},
                    deadLineTwo:{$first:"$models.deadLineTwo"},
                }
            }
        ])
        console.log({data});
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
           console.log({resultNew});
           if(resultNew) return resultNew; 
           else throw new Error;
        } catch (error) {
            return false;
        }    
    },

    dbGetNotificationAdmin:async(flag)=>{
        try {
            if(flag == 'seeLess'){
            let modelers = await db.modelerList.aggregate([
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.complete":true,"models.adminView": false}
                },
                {
                   $lookup:{
                    from:"clientlists",
                    localField:"models.clientId",
                    foreignField:"_id",
                    as:"clientDetails"
                   } 
                },
                {
                    $unwind:"$clientDetails"
                },
                {
                    $addFields: {
                      "models.clientDetails": "$clientDetails"
                    }
                },
                {
                    $group:{
                        _id:"$_id",
                        modelerName:{$first:"$modelerName"},
                        email:{$first:"$email"},
                        rollNo:{$first:"$rollNo"},
                        completedList:{$push:"$models"},
                    }
                }
            ]);
            console.log({modelers});
            if(modelers){
                return modelers
            }else{
                return false
            }
            }else{
                let data = await db.correction.find({});
                return data;
            }     
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGenerateInvoice:async(rollNo)=>{
        try {
            let getModerlerModels = await db.modelerList.aggregate([
                {
                    $match : {rollNo:rollNo}
                },
                {
                    $unwind: "$models"
                },
                {
                    $lookup:{
                        from:'clientlists',
                        localField:'models.clientId',
                        foreignField:'_id',
                        as:'models.clientDetails'
                    }
                },
                {
                    $unwind:"$models.clientDetails"
                },
                {
                    $group: {
                        _id: "$_id",
                        modelerName: { $first: "$modelerName" },
                        rollNo: { $first: "$rollNo" },
                        bankDetails: { $first: "$bankDetails" },
                        email: { $first: "$email" },
                        models: {
                          $push: {
                            clientId: "$models.clientId",
                            clientDetails: "$models.clientDetails",
                            models: "$models.models",
                            complete:"$models.complete",
                            completeDate:"$models.completeDate",
                            deadLineOne:"$models.deadLineOne",
                            deadLineTwo:"$models.deadLineTwo"
                          }
                        }
                      }
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
                await db.modelerList.updateMany(
                    {
                        _id: modelerId,
                        "models.models.productStatus": "Approved"
                      },
                      {
                        $set: {
                          "models.models.$[inner].invoice": true
                        }
                      },
                      {
                        arrayFilters: [{ "inner.productStatus": "Approved" }]
                      }
                );
                await db.modelerProducts.updateMany(
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
        let taged = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.tag':tagName}});
        if(taged.acknowledged){
            await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':articleId},{$set:{'productList.$.tag':tagName}});
            let a = await db.modelerList.updateMany(
                {
                    rollNo: modRoll,
                    "models.clientId": new ObjectId(clientId),
                    "models.models.articleId": articleId
                  },
                  {
                    $set: {
                      "models.$.models.$[inner].tag": tagName,  
                    }
                  },
                  {
                    arrayFilters: [{ "inner.articleId": articleId }]
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
            let helpLineExist = await db.helpLine.find({modelerRollNo:modelerRollNo,articleId:articleId,clientId:new ObjectId(clientId)});
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
                clientId:new ObjectId(clientId),
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
                    clientId:new ObjectId(clientId),
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

    dbCreateRequirement:async(clientId,requirement,prodcuts)=>{
        try {
            let obj = {
                clientId:new ObjectId(clientId),
            }
           if(prodcuts.length != 0){
            prodcuts.forEach(async(pro)=>{
                let infoExist = await db.requirement.findOne({clientId:new ObjectId(clientId),articleId:pro.articleId});
                if(infoExist)
                {
                    await db.requirement.updateOne({clientId:new ObjectId(clientId),articleId:pro.articleId},{$set:{additionalInfo:requirement}});
                }else{
                    obj.articleId = pro.articleId
                    obj.additionalInfo = requirement
                    await db.requirement.create(obj)   
                }   
           })
           }else{
            obj.additionalInfo = requirement;
            await db.requirement.create(obj);
           }
           return true;
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
          let client = await db.clients.findOne({_id:new ObjectId(clientId)});
          let clientPro = await db.Products.findOne({clientId:new ObjectId(clientId)});
          
            if(client){
                const regex = /[^a-zA-Z0-9]/g;
                let clientName = client.clientName.replace(regex,"_");
                let fileCount = 0;
                if(fs.existsSync(`./public/images/${clientName}/${articleId}`)){
                    console.log("got it",fileCount);
                   let files = fs.readdirSync(`./public/images/${clientName}/${articleId}`);
                   fileCount = files.length;
                }else{
                    console.log("not found");
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
            clientId:new ObjectId(clientId),
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
            let clientDetails = await db.clients.findOne({_id:new ObjectId(clientId)});
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
            let getClient = await db.clients.findOne({_id:new ObjectId(clientId)});
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
            console.log({data});
            let clientDetails = await db.clients.findOne({_id:new ObjectId(data.clientId)});
            let modelTeam = await db.modelerProducts.findOneAndUpdate({clientId:new ObjectId(data.clientId),'assignedPro.articleId':data.articleId},{$set:{"assignedPro.$.productStatus":"Correction"}});
            const regex = /[^a-zA-Z0-9]/g;
            let clientName = clientDetails.clientName.replace(regex,"_");
            if(modelTeam){
                modelTeam = modelTeam.assignedPro.find(obj => obj.articleId == data.articleId);
                let a = await db.modelerList.findOneAndUpdate( {
                    rollNo: modelTeam.modRollno,
                    "models.clientId": new ObjectId(data.clientId),
                    "models.models.articleId": data.articleId
                  },
                  {
                    $set: {
                      "models.$.models.$[inner].productStatus": 'Correction',
                    }
                  },
                  {
                    arrayFilters: [{ "inner.articleId": data.articleId }]
                  });
                let modelLists = await db.modelerList.findOne({rollNo:modelTeam.modRollno,"models.clientId":new ObjectId(data.clientId)});
                let checkExist = modelLists.models.find(model => model.productStatus != "Approved");
                if(!checkExist){
                    await db.modelerList.updateOne({rollNo:modelTeam.modRollno,'models.clientId':new ObjectId(data.clientId)},{$set:{'models.$.complete':true,'models.$.completeDate':new Date()}})
                }
                await db.Products.updateOne({clientId:new ObjectId(data.clientId),"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Correction"}});   
                await db.QaReviews.updateOne({clientId:new ObjectId(data.clientId),articleId:data.articleId},{$set:{modalStatus:"Correction",underQA:false}});
            } 
        if(clientDetails){
            if(data.version == 1){
                console.log("first time");
                data.version = 1
                data.QA = modelTeam.QaTeam;
                data.modeler = modelTeam.assigned;
                data.QA_rollNo = modelTeam.qaRollNo;
                data.mod_rollNo = modelTeam.modRollno;
                data.modelerView = false;
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
                data.modelerView = false;
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
            let clientDetails = await db.clients.findOne({_id:new ObjectId(clientId)});
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
        console.log({maxVersion});
        if(maxVersion.length != 0){
          if(fs.existsSync(`./public/models/${clientName}/${articleId}/version-${maxVersion[0].maxOne + 1}/${articleId}.glb`)){
            console.log("Asdfdf");
            updateAvailable = true;
          }
          let latest = await db.hotspot.find({clientId:new ObjectId(clientId),articleId:articleId,version:maxVersion[0].maxOne});
        if(latest.length != 0){
            console.log({updateAvailable});
            return {status:true,data:latest,update:updateAvailable}
        }else{
            console.log("not corrections");
        } 
        }else{
            console.log("aggragation no");
            return {status:false,data:false}
        }
        
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    dbGetLatestHotspotsForModeler:async(clientId,articleId)=>{
        try {
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
            if(maxVersion.length != 0){
                let hotspots = await db.hotspot.find({clientId:new ObjectId(clientId),articleId:articleId,version:maxVersion[0].maxOne});
                if(hotspots.length != 0){
                    let targetTime = hotspots[0].date;
                    let currTime = new Date();
                    let timeDifferenceInMinutes = currTime - targetTime;
                    timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                    timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
                    if(timeDifferenceInMinutes > 5){
                        return {status:true,data:hotspots,msg:"data found"}
                    }else{ 
                        return {status:true,msg:"under QA"}
                    }
                }else{
                    throw new Error("no hotspots found!!")
                } 
            }else{
                
                return {status:true,msg:"No correction is created"}
            }    
        } catch (error) {
            console.log(error);
            return {status:false}
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
            await db.QaReviews.updateOne({clientId:new ObjectId(model.clientId),articleId:model.articleId},{$set:{underQA:model.flag}});
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetUserBankDetails:async(userInfo)=>{
        try {
            const user = await db.modelerList.findOne({rollNo:userInfo.rollNo});
            console.log({user});
            if(user){
                const bankInfo = user.bankDetails.length != 0 ? user.bankDetails[0] : false;
                return {status:true,data:bankInfo,modeler:user}
            }else{
                return {status:false}
            }
        } catch (error) {
           console.log(error);
           return {status:false}; 
        }
    },

    dbUpdateBankInfo:async(bankInfo,rollNo)=>{
        try {
            console.log(bankInfo,rollNo);
          let result = await db.modelerList.updateOne({rollNo:rollNo},{$set:{bankDetails:bankInfo}});
          console.log(result);
          if(result.modifiedCount === 1) return true ;
          else return false;  
        } catch (error) {
            console.log(error);
            return false
        }     
    },

    dbCreateAbout:async(email,txt)=>{
        try {
            let result = await db.modelerList.updateOne({email:email},{$set:{about:txt}});
            if(result.modifiedCount === 1 ){
                return true;
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    
    dbGetAllModelListForModeler:async(modelerId)=>{
        try {
            console.log("modeler list ");
            console.log(modelerId);
            const list = await db.modelerList.aggregate([
                {
                    $match: {
                      _id: new ObjectId(modelerId)
                    }
                  },
                  {
                    $unwind: "$models"
                  },
                  {
                    $addFields: {
                      "models.clientId": { $toObjectId: "$models.clientId" }
                    }
                  },
                  {
                    $lookup: {
                      from: "clientlists",
                      localField: "models.clientId",
                      foreignField: "_id",
                      as: "models.clientDetails"
                    }
                  },
                  {
                    $unwind: "$models.clientDetails"
                  },
                  {
                    $group: {
                      _id: "$_id",
                      modelerName: { $first: "$modelerName" },
                      rollNo: { $first: "$rollNo" },
                      bankDetails: { $first: "$bankDetails" },
                      email: { $first: "$email" },
                      models: {
                        $push: {
                          clientId: "$models.clientId",
                          clientDetails: "$models.clientDetails",
                          models: "$models.models"
                        }
                      }
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      modelerName: 1,
                      rollNo: 1,
                      bankDetails: 1,
                      email: 1,
                      models: 1
                    }
                  }
            ])
            console.log({list});
            console.log("sdfasdfasdfasdfas");
            if(list.length != 0){
                return list;
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbCheckQAStatus:async(data)=>{
        try {
            const checkstatus = await db.QaReviews.findOne({clientId:new ObjectId(data.clientId),articleId:data.id});
            if(checkstatus){
                return {status:true,flag:checkstatus.underQA}
            }else{
                throw new Error("QAComments not found database error!!")
            }
        } catch (error) {
            console.log(error);
            return {status:false};
        }
    },

    AdbGetClientById:async(clientId)=>{
        try {
            let client = await db.clients.findOne({_id:new ObjectId(clientId)});
            console.log({client});
            if(client) return client;
            else return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbEditCorrection:async(corrData)=>{
        try {
            let target = await db.hotspot.findOne({clientId:new ObjectId(corrData.clientId),articleId:corrData.articleId,version:corrData.version,hotspotId:corrData.hotspotId});
            if(target){
                let targetTime = new Date(target.date);
                console.log({targetTime});
                let currTime = new Date();
                let timeDifferenceInMinutes = currTime - targetTime;
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
                console.log({timeDifferenceInMinutes});
                if(timeDifferenceInMinutes <= 5){
                    let updateHotspot = await db.hotspot.findOneAndUpdate({clientId:new ObjectId(corrData.clientId),articleId:corrData.articleId,version:corrData.version,hotspotId:corrData.hotspotId},{$set:{correction:corrData.text}});
                    if(updateHotspot){
                       console.log("correction edit successfull");
                        let id = updateHotspot._id 
                        return {status:true,id:id}
                    }else{
                        return {status:false};
                    }
                }else{
                    console.log("time exceeded for correction edit");
                    return {status:false,msg:"time exceeded"}
                }
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbEditExistingCorrection:async(corrData,count,element)=>{
        try {
            let team;
            let target = await db.hotspot.findOne({clientId:new ObjectId(corrData.clientId),articleId:corrData.articleId,version:corrData.version,hotspotId:corrData.hotspotId});
            if(count == 1 && target){
                team = target;
            }else{
                let target = await db.hotspot.findOne({clientId:new ObjectId(element.clientId),articleId:element.articleId,version:element.version,hotspotId:element.hotspotId});
                team = target
            }
            if(target){
                let targetTime = new Date(target.date);
                console.log({targetTime});
                let currTime = new Date();
                let timeDifferenceInMinutes = currTime - targetTime;
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
                console.log({timeDifferenceInMinutes});
                if(timeDifferenceInMinutes <= 5){
                    let updateHotspot = await db.hotspot.findOneAndUpdate({clientId:new ObjectId(corrData.clientId),articleId:corrData.articleId,version:corrData.version,hotspotId:corrData.hotspotId},{$set:{correction:corrData.correction}});
                    if(updateHotspot){
                       console.log("correction edit successfull");
                        let id = updateHotspot._id 
                        return {status:true,id:id}
                    }else{
                        return {status:false};
                    }
                }else{
                    console.log("time exceeded for correction edit");
                    return {status:false,msg:"time exceeded"}
                }
            }else{
                console.log(team);
                corrData.date = team.date;
                corrData.modeler = team.modeler;
                corrData.QA = team.QA;
                corrData.mod_rollNo = team.mod_rollNo;
                corrData.QA_rollNo = team.QA_rollNo
              await db.hotspot.create(corrData);
              return {status:true}
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbDeleteHotspot:async(hotspotName)=>{
        try {
            let hotspot = await db.hotspot.findOne({hotspotName:hotspotName});
            let timeDifferenceInMinutes;
            if(hotspot){
                let targetTime = new Date(hotspot.date);
                let currTime = new Date();
                timeDifferenceInMinutes = currTime - targetTime;
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
            }
            if(timeDifferenceInMinutes <= 5){
                let deleteRes = await db.hotspot.deleteOne({hotspotName:hotspotName});
                if(deleteRes.deletedCount != 0){
                    return {status:true,msg:"Deleted"};
                }
            }else{
                return {status:true,msg:"Time exceeded"};
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbCreateDeadLineForModeler:async(deadLine)=>{
        try {
            if(deadLine.status == 'deadLineOne'){
                console.log("run");
                await db.modelerList.updateOne({
                    rollNo: deadLine.modRoll,
                    "models.clientId": new ObjectId(deadLine.clientId),
                  },
                  {
                    $set: {
                      "models.$.deadLineOne": deadLine.date,
                    }
                  })
            }else{
                await db.modelerList.updateOne({
                    rollNo: deadLine.modRoll,
                    "models.clientId":new ObjectId(deadLine.clientId),

                  },
                  {
                    $set: {
                      "models.$.deadLineTwo": deadLine.date,
                    }
                  })
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateBonusForModeler:async(flag,modelerId,clientId)=>{
        try {
            if(flag){
              let updateBonus = await db.modelerList.updateOne({_id:new ObjectId(modelerId),'models.clientId':new ObjectId(clientId)},{$push:{bonus:50}});
              if(updateBonus.modifiedCount != 0){
                return true;
              }else{
                return false;
              }
            } 
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetApprovedModelsForQa:async(qaRollNo)=>{
        try {
            let clients = await db.modelerProducts.aggregate([
                {
                  $match: {
                    'assignedPro.qaRollNo': qaRollNo
                  }
                },
                {
                  $unwind: "$assignedPro"
                },
                {
                  $match: {
                    'assignedPro.qaRollNo': qaRollNo,
                    'assignedPro.productStatus':"Approved"
                  }
                },
                {
                    $lookup: {
                      from: "clientlists", // Name of the collection to join with
                      localField: "clientId",
                      foreignField: "_id",
                      as: "clientInfo"
                    }
                  },
                  {
                    $unwind: "$clientInfo"
                  },
                {
                  $group: {
                    _id: "$_id",
                    clientId: { $first: "$clientId" },
                    assignedPro: { $push: "$assignedPro" },
                    approvedClient: { $first: "$approvedClient" },
                    clientName: { $first: "$clientInfo.clientName" },
                    __v: { $first: "$__v" }
                  }
                }
              ]);
              let requirements = await db.requirement.find({});
              return {clients,requirements}
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetApprovedModelsForModeler:async(modRollNo)=>{
        try {
            console.log(modRollNo);
            let clients = await db.modelerProducts.aggregate([
                {
                  $match: {
                    'assignedPro.modRollno': modRollNo
                  }
                },
                {
                  $unwind: "$assignedPro"
                },
                {
                  $match: {
                    'assignedPro.modRollno': modRollNo,
                    'assignedPro.productStatus':"Approved"
                  }
                },
                {
                    $lookup: {
                      from: "clientlists", // Name of the collection to join with
                      localField: "clientId",
                      foreignField: "_id",
                      as: "clientInfo"
                    }
                  },
                  {
                    $unwind: "$clientInfo"
                  },
                {
                  $group: {
                    _id: "$_id",
                    clientId: { $first: "$clientId" },
                    assignedPro: { $push: "$assignedPro" },
                    approvedClient: { $first: "$approvedClient" },
                    clientName: { $first: "$clientInfo.clientName" },
                    __v: { $first: "$__v" }
                  }
                }
              ]);
              let requirements = await db.requirement.find({});
              return {clients,requirements}
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateNotificationStatus:async(hotspotInfo)=>{
        try {
            console.log(hotspotInfo);
            let updatedRes = await db.hotspot.updateMany({
                mod_rollNo:hotspotInfo.modelerRollNo,
                clientId:new ObjectId(hotspotInfo.clientId),
                articleId:hotspotInfo.articleId,
                version:hotspotInfo.version
            },{$set:{modelerView:true}});
            console.log(updatedRes);
            if(updatedRes.modifiedCount > 0){
                return true;
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetNotificationForQA:async(rollNo)=>{
        try {
            const notifications = await db.modelerProducts.aggregate([
                {
                    $match:{
                        "assignedPro.qaRollNo" : rollNo
                    }
                },
                {
                    $addFields:{
                        assignedPro:{
                            $filter:{
                                input:"$assignedPro",
                                as:"item",
                                cond:{
                                    $and:[
                                        {$eq:["$$item.qaRollNo",rollNo]},
                                        {$eq:["$$item.productStatus","Uploaded"]},
                                        {$eq:["$$item.QAView",false]}
                                    ]
                                }
                            }
                        }
                    }
                }
            ])
            console.log({notifications});
            if(notifications){
                
                return notifications
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateNotificationForQA:async(clientId,articleId)=>{
        try {
           const updateRes = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.QAView':true}});
           if(updateRes.acknowledged > 0){
            return true;
           }else{
            return false;
           }
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbUpdateNotificationAdmin:async(modelerId,clientId)=>{
        try {
            let updateRes = await db.modelerList.updateOne({_id:new ObjectId(modelerId),'models.clientId':new ObjectId(clientId)},{$set:{'models.$.adminView':true}});
            if(updateRes.modifiedCount > 0){
                return true;
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return true;   
        }
    }
} 