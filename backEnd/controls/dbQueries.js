
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
            maxIssues: 16 * 1024, // limit max number of output issues to 10
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
            let clientExist = await db.clients.findOne({clientName:client.clientName});
            if(clientExist){
                await db.clients.updateOne({_id:new ObjectId(clientExist._id)},{$set:{productCount:clientExist.productCount + client.productCount}})
                return {exist:true,client:clientExist}
            }else{
                let data = new db.clients(client);
                let res = await data.save()
                if(res){
                    return {exist:false,client:res}
                }else{
                    return false
                }   
            }
            
        }catch(error){
            return false;
        }
            
    },

    dbcreatePro:async(proData,Id,clientExist)=>{
        try{
            let res;
            proData = proData.map((pro)=>{
                return {...pro,assigned:false,QaTeam:false,approved:false,productStatus:"Not Uploaded",adminStatus:"Not Approved"}
            })
            console.log(Id);
            if(clientExist){
                res = await db.Products.updateOne({clientId:new ObjectId(Id)},{$push:{productList:{$each:proData}}});
                await db.Products.updateOne({clientId:new ObjectId(Id)},{$set:{approvedClient:false}})
                await db.clients.updateOne({_id:new ObjectId(Id)},{$set:{status:'Not Approved'}})
            }else{
                let newData = {
                    clientId:new ObjectId(Id),
                    productList:[...proData]
                }
                let data = new db.Products(newData);
                res = await data.save()  
            }
            
            if(res){
                return true
            }else{
                throw new Error
            }
        }catch(error){
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

    dbGetapprovedClients:async()=>{
        try {
            let clients = await db.Products.aggregate([
                {
                    $match:{approvedClient:true}
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
            if(clients){
                return clients;
            }else{
                throw new Error("something went wrong while fetching the approved clients");
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbGetPro:async(id)=>{
        try {
            let proData = await db.Products.findOne({clientId:new ObjectId(id)});
            let globalRquirement = await db.requirement.findOne({clientId:new ObjectId(id)});
            console.log(globalRquirement);
            globalRquirement = globalRquirement ? globalRquirement : false;
            let clientData = await db.clients.findOne({_id:new ObjectId(id)});
            let budget = await db.budget.find().sort({ _id: -1 }).limit(1);
            budget = budget.reverse();
            let budgetData = budget.length != 0 ? budget[0].remainingBudget : null;
            let exactBudget = budget.length != 0 ? budget[0].budget : null;
            let totalExpense = budget.length != 0 && budget[0]?.totalExpense ? budget[0].totalExpense : null;
            if(proData){
            let Arr = [];
            Arr.push(proData)
            Arr.push({budgetValue:budgetData,exactBudget:exactBudget,totalExpense:totalExpense,requirement:globalRquirement});
            Arr.push(clientData)
            return {Arr}
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
            let listNoForOthers = 0;
            
            let proListforModeler  =  data.products.map(obj => {
                return {...obj,QaTeam:QaName,qaRollNo:QaRoll,modRollno:modRoll,assigned:name,clientId:new ObjectId(data.clientId),date:date,price:0,invoice:false,tag:"",QAView:false,list:1}
            })
            let obj = {
                clientId:new ObjectId(data.clientId),
                list:1,
                models:[...proListforModeler],
                bonus:[30],
                complete:false,
                eligibleForBonus:true,
                invoicedList:false,
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
            if(modelerExist){
                let clientListExist = modelerExist.models.find(obj => obj.clientId == data.clientId);
                if(clientListExist){
                  let maxListNo = await db.modelerList.aggregate([
                    {
                        $match:{rollNo:modRoll}
                    },
                    {
                        $unwind:"$models"
                    },
                    {
                        $match:{"models.clientId":new ObjectId(data.clientId)}
                    },
                    {
                        $group:{
                            _id:"$_id",
                            maxList:{$max:"$models.list"}
                        }
                    }
                  ])
                  let listNo = maxListNo[0].maxList;
                 
                  obj.list = listNo + 1;
                  let checkDeadLine = modelerExist.models.find((client)=>{
                    return client.clientId.equals(data.clientId) && client.list == listNo
                  })
                  if(!checkDeadLine.deadLineTwo){
                    console.log("deadline is false");
                    listNoForOthers = listNo;
                    proListforModeler.forEach(obj => {
                        obj.list = listNoForOthers
                    })
                    await db.modelerList.updateOne(
                        {rollNo:modRoll,
                            "models": {
                                $elemMatch: {
                                clientId: new ObjectId(data.clientId),
                                list: listNo
                                }}},{$push:{'models.$.models':{$each:proListforModeler}}})
                  }else{
                    console.log("deadline is true");
                    listNoForOthers = listNo + 1
                    console.log({listNoForOthers});
                    obj.models.forEach(obj => obj.list = listNoForOthers)
                    await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:obj}});
                  }  
                //   await db.modelerList.updateOne({rollNo:modRoll,'models.clientId':new ObjectId(data.clientId)},{$push:{'models.$.models':{$each:proListforModeler}}})      
                }else{
                  listNoForOthers = 1;
                  await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:obj}});
                }   
            }else{
                console.log("new modeler");
                listNoForOthers = 1;
                await db.modelerList.create(modeler)
            }
            for(let item of data.products){
                item.assigned = name;
                item.QaTeam = QaName;
                item.modRollno = modRoll;
                item.qaRollNo = QaRoll;
                item.list = listNoForOthers;
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
                console.log("created");
            let formatedData = {
                clientId:new ObjectId(data.clientId),
                assignedPro:data.products,
                approvedClient: false,
                date:date  
                  }
        let prod = new db.modelerProducts(formatedData);
        await prod.save();
        
            }
            for(let item of data.products){
                await db.Products.updateOne({clientId:new ObjectId(data.clientId),'productList.articleId':item.articleId},{$set:{
                    "productList.$.assigned" : item.assigned,
                    "productList.$.QaTeam": item.QaTeam,
                    "productList.$.modRollno" : item.modRollno,
                    "productList.$.qaRollNo" : item.qaRollNo,
                    "productList.$.list" : listNoForOthers,
                    "productList.$.productStatus" : "Not Uploaded", 
                    "productList.$.date" : item.date,
                    "productList.$.price" : 0,
                    "productList.$.invoice" : false,
                    "productList.$.tag" : "",
                    "productList.$.QAView" : false}})
            }
            return {status:true,list:listNoForOthers};
        } catch (error) {
            console.log(error);
            return false;
        }   
    },

    reallocationModel:async(data,modelerName,modelerEmail,QaName,modRoll,QaRoll)=>{
       try {
        let date = new Date();
        let list = 0;

        //retaining the budget
        // let retainBudget = 0;
        // let currRemainingBudget = await db.budget.find({}).sort({ _id: -1 }).limit(1);
        // data.products.forEach((pro)=>{
        //     retainBudget += Number(pro.price)
        // });
        //update the budget with retained budget amount.
        // await db.budget.updateOne({_id:currRemainingBudget[0]._id},{$set:{remainingBudget:currRemainingBudget[0].remainingBudget+retainBudget,totalExpense:currRemainingBudget[0].totalExpense - retainBudget}});
        
        //maping the reallocated modeler and Qa to the product list object.
        data.products  =  data.products.map(obj => {
            return {...obj,QaTeam:QaName,qaRollNo:QaRoll,modRollno:modRoll,assigned:modelerName,clientId:new ObjectId(data.clientId),date:date,invoice:false,tag:"",QAView:false}
        })

        //creating an object to be used for creating a new modeler.
        let obj = {
            clientId:new ObjectId(data.clientId),
            list: 1,
            models:[],
            bonus:[30],
            complete:false,
            eligibleForBonus:true,
            invoicedList:false,
            completeDate:false,
            adminView:false
        }

        //to check if the modeler is eligible for bonus or not.
        let askBonusEligibility = false;
        let modelerToCheckeligibility = {};

        let promises = [];

        let resultPromise;
        let updateModeler;
 
        //check if the modeler exist or not.if not create the modeler.
        const findModeler = await db.modelerList.findOne({rollNo:modRoll});
        if(!findModeler){
            console.log("new modeler");
            let modeler  = {
                modelerName : modelerName ,
                rollNo:modRoll,
                email:modelerEmail,
                models:[],
                bankDetails:[],
            }
            modeler.models.push(obj)
            await db.modelerList.create(modeler);

            //pushing the model to new modeler.
            for(const pro of data.products){
                
                resultPromise = await db.modelerProducts.findOneAndUpdate({clientId:new ObjectId(data.clientId),'assignedPro.articleId':pro.articleId},{$set:{'assignedPro.$.assigned':modelerName,'assignedPro.$.QaTeam':QaName,'assignedPro.$.modRollno':modRoll,'assignedPro.$.qaRollNo':QaRoll}});

                //get the model before updation.
                let model = resultPromise.assignedPro.find((model)=>{
                    if(model.articleId == pro.articleId) return model;
                });
                
                //pull the model from the modeler.
                await db.modelerList.updateOne({
                    rollNo: model.modRollno,
                    "models": {
                        $elemMatch: {
                          clientId: new ObjectId(data.clientId),
                          list: pro.list
                        }
                      }
                  },
                  {
                    $pull: {
                        "models.$.models": { articleId: pro.articleId },
                    }
                  })
                list = pro.list;

                //setting the eligibility.
                askBonusEligibility = true;
                modelerToCheckeligibility.modelerName = model.assigned;
                modelerToCheckeligibility.modelerRollNo = model.modRollno;
                modelerToCheckeligibility.clientId = data.clientId;

                  //push the models to modeler
                  updateModeler = await db.modelerList.updateOne({rollNo:modRoll,"models": {
                    $elemMatch: {
                      clientId: new ObjectId(data.clientId),
                      list: 1
                    }
                  }},{$push:{'models.$.models':pro},$set:{'models.$.deadLineOne':false,'models.$.deadLineTwo':false}});
                  //update the list value in the assigned list
                  await db.modelerProducts.updateOne({clientId:new ObjectId(data.clientId),'assignedPro.articleId':pro.articleId},{$set:{'assignedPro.$.list':1}});
                let updateProductList = await db.Products.updateOne({clientId:new ObjectId(data.clientId),'productList.articleId':pro.articleId},{$set:{'productList.$.assigned':modelerName,'productList.$.QaTeam':QaName,'productList.$.modRollNo':modRoll,'productList.$.qaRollNo':QaRoll,'productList.$.list':1}}); 
                promises.push(updateModeler,resultPromise,updateProductList);
                await Promise.all(promises);
                }
        }else{
            for(const pro of data.products){
                resultPromise = await db.modelerProducts.findOneAndUpdate({clientId:new ObjectId(data.clientId),'assignedPro.articleId':pro.articleId},{$set:{'assignedPro.$.assigned':modelerName,'assignedPro.$.QaTeam':QaName,'assignedPro.$.modRollno':modRoll,'assignedPro.$.qaRollNo':QaRoll}});

                //check if the reallocation changes the modeler.
                let model = resultPromise.assignedPro.find((model)=>{
                    if(model.articleId == pro.articleId) return model;
                });

                let modelerBeforeUpdate = model.assigned;
                if(modelerBeforeUpdate != pro.assigned){
                    //pull the model from old modeler.
                    await db.modelerList.updateOne({
                        rollNo: model.modRollno,
                        "models": {
                            $elemMatch: {
                              clientId: new ObjectId(data.clientId),
                              list: pro.list
                            }
                          }
                      },
                      {
                        $pull: {
                            "models.$.models": { articleId: pro.articleId },
                        }
                      })
                    list = pro.list;
                    //push the model to the reallocated modeler.
                    let maxListNo = await db.modelerList.aggregate([
                        {
                            $match:{rollNo:modRoll}
                        },
                        {
                            $unwind:"$models"
                        },
                        {
                            $match:{"models.clientId":new ObjectId(data.clientId)}
                        },
                        {
                            $group:{
                                _id:"$_id",
                                maxList:{$max:"$models.list"}
                            }
                        }
                      ])
                      if(maxListNo.length == 0){
                        obj.models.push(pro);
                        updateModeler = await db.modelerList.updateOne({rollNo:modRoll},{$push:{models:obj}});
                      }else{
                        let listNo = maxListNo[0].maxList;
                        pro.list = listNo
                        list = listNo;
                        updateModeler = await db.modelerList.updateOne({rollNo:modRoll,"models": {
                            $elemMatch: {
                            clientId: new ObjectId(data.clientId),
                            list: listNo
                            }
                        }},{$push:{'models.$.models':pro},$set:{'models.$.deadLineOne':false,'models.$.deadLineTwo':false}});
                        //update the list value in the assigned list
                        await db.modelerProducts.updateOne({clientId:new ObjectId(data.clientId),'assignedPro.articleId':pro.articleId},{$set:{'assignedPro.$.list':listNo}});
                      }
                     
                }else{
                    updateModeler = await db.modelerList.findOneAndUpdate(
                        {
                          rollNo: modRoll,
                          "models.clientId": new ObjectId(data.clientId),
                          "models.models.articleId": pro.articleId,
                          "models.models.clientId" : new ObjectId(data.clientId),
                          "models.list":pro.list
                        },
                        {
                          $set: {
                            "models.$.models.$[inner].QaTeam": QaName,
                            "models.$.models.$[inner].qaRollNo": QaRoll
                          }
                        },
                        {
                          arrayFilters: [{ "inner.articleId": pro.articleId ,"inner.clientId": new ObjectId(data.clientId)}]
                        }
                      );
                      list = pro.list
                }
                let updateProductList = await db.Products.updateOne({clientId:new ObjectId(data.clientId),'productList.articleId':pro.articleId},{$set:{'productList.$.assigned':modelerName,'productList.$.QaTeam':QaName,'productList.$.modRollNo':modRoll,'productList.$.qaRollNo':QaRoll,'productList.$.list':list}}); 
                promises.push(updateModeler,resultPromise,updateProductList);
                await Promise.all(promises);
            }
        }

        if(askBonusEligibility){
            return {status:true,list:list,bonusEligibility:askBonusEligibility,modeler:modelerToCheckeligibility}
        }else{
            return {status:true,list:list};
        }

       } catch (error) {
        console.log(error);
       }
    },

    dbGetClientForModaler:async(modelerRollNo)=>{
        try{
          
        let clientData = await db.modelerProducts.aggregate([
            {
                $unwind:"$assignedPro"
            },
            {
                $match:{"assignedPro.modRollno":modelerRollNo}
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
                $lookup:{
                    from:'modelers',
                    localField:"assignedPro.modRollno",
                    foreignField:'rollNo',
                    as:"modelerData"
                        }
            },
            {
                $group:{
                    _id:"$_id",
                    clientId:{$first:"$clientId"},
                    assignedPro:{$push:"$assignedPro"},
                    clientData:{$first:"$clientData"},
                    modelerData:{$first:"$modelerData"}
                }
            },
            {
                $sort: { _id: -1 } 
            }
        ])
        if(clientData){
            console.log(clientData);
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
                $match:{"assignedPro.modRollno":modRollNo}
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
           let client = await db.modelerProducts.findOne({_id:new ObjectId(id)});
           let modeler = await db.modelerList.findOne({rollNo:modRollNo})
           let requirement = await db.requirement.findOne({clientId:new ObjectId(client.clientId)})
           let deadLineBonus;
           if(modeler){
            let maxListNo = await db.modelerList.aggregate([
                {
                    $match:{rollNo:modRollNo}
                },
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.clientId":new ObjectId(proData[0].clientId)}
                },
                {
                    $group:{
                        _id:"$_id",
                        maxList:{$max:"$models.list"}
                    }
                }
              ])
              
              console.log(maxListNo);
            let list = maxListNo[0].maxList
            deadLineBonus = modeler.models.find((obj) =>{
                if(obj.clientId.equals(proData[0].clientId)&&obj.list==list){
                    return obj
                }
            });
           }
            if(proData){
                return {proData,deadLineBonus,requirement}
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
            let {id,clientId,modRollNo,list}  = data;
            list = Number(list)
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
            let updateRes = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": id},{$set:{"assignedPro.$.productStatus": status,"assignedPro.$.QAView":false,"assignedPro.$.uploadedDate":new Date()}});
            await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":id},{$set:{"productList.$.productStatus":status,"productList.$.uploadedDate":new Date()}});
            await db.modelerList.findOneAndUpdate( {
                rollNo: modRollNo,
                "models.clientId": new ObjectId(clientId),
                "models.list":list,
                "models.models.articleId": id,
                "models.models.clientId" : new ObjectId(clientId)
              },
              {
                $set: {
                  "models.$.models.$[inner].productStatus": status,
                  "models.$.models.$[inner].uploadedDate":new Date()
                }
              },
              {
                arrayFilters: [{ "inner.articleId": id,"inner.clientId": new ObjectId(clientId) }]
              });
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:id},{$set:{modalStatus:status}});
            let clientDetails = await db.clients.findOne({_id:new ObjectId(clientId)});

            let modeler = await db.modelerList.findOne({rollNo:modRollNo});
            let modelList = modeler.models.find(model => model.list == list&&model.clientId.equals(clientId));
            let checkAllUploaded = modelList.models.find(model => model.productStatus != 'Uploaded');
            if(!checkAllUploaded){
                await db.modelerList.updateOne({rollNo:modRollNo,"models": {
                    $elemMatch: {
                      clientId: new ObjectId(clientId),
                      list: list
                    }
                  }},{$set:{'models.$.completeDate':new Date().toUTCString()}});
            }
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
           let maxListNo = await db.modelerList.aggregate([
            {
                $match:{rollNo:modRollNo}
            },
            {
                $unwind:"$models"
            },
            {
                $match:{"models.clientId":new ObjectId(clientId)}
            },
            {
                $group:{
                    _id:"$_id",
                    maxList:{$max:"$models.list"}
                }
            }
          ])
           let list = maxListNo[0].maxList
           let updateModelerListModel = db.modelerList.findOneAndUpdate( {
            rollNo: modRollNo,
            "models.clientId": new ObjectId(clientId),
            "models.list":list,
            "models.models.articleId": id,
            "models.models.clientId" : new ObjectId(clientId)
          },
          {
            $set: {
              "models.$.models.$[inner].version": count,
            }
          },
          {
            arrayFilters: [{ "inner.articleId": id , "inner.clientId": new ObjectId(clientId)}]
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
            let clients = await db.modelerProducts.aggregate([
                {
                    $unwind:"$assignedPro"
                },
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
                },
                {
                   $group:{
                    _id:"$_id",
                    clientId: { $first: "$clientId" },
                    assignedPro: { $push: "$assignedPro" },
                    approvedClient: { $first: "$approvedClient" },
                    clientData:{$first: "$clientData"}
                   } 
                },
                {
                    $sort: { _id: -1 } 
                }
            ])
            if(clients){
                console.log(clients);
                return clients
            }else{
                throw new Error
            } 
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbGetQaPro:async(id,qaRollNo)=>{
        try {

            let client = await db.modelerProducts.findOne({_id:new ObjectId(id)});

            let proList = await db.modelerProducts.aggregate([
                {
                    $match:{_id:new ObjectId(id)}
                },
                {
                    $unwind:"$assignedPro"
                },
                {
                    $match:{"assignedPro.productStatus":{$ne:"Approved"},"assignedPro.qaRollNo":qaRollNo}
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
            let requirement = await db.requirement.findOne({clientId:new ObjectId(client.clientId)});
            if(proList.length > 0){
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
                return {proList}
            }
        } catch (error) {
            console.log(error);
            return false
        }
    },

    dbCreateComntQa:async(data,user)=>{
        try {
            console.log({data});
            let time = new Date().toISOString();
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
            let pngExist = fs.existsSync(`./public/pngFiles/${clientId}/${articleId}.png`);
        if(commentData){
            let result = await polygonCounter(articleId,clientId,modelDetails[0].clientDetails[0].clientName,version);
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

    dbAprroveModal:async(clientId,articleId,status,QaName,modelerName,correction,modelName,modRollNo,QaRollNo,productName,list)=>{
        try {
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:status}});
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:status}});
            let modeler = await db.modelerList.findOne({rollNo:modRollNo});
            let modelList = modeler.models.filter((obj => {
                if(obj.clientId == clientId){
                    return [...obj.models]
                }
            }))
            await db.modelerList.findOneAndUpdate( {
                rollNo: modRollNo,
                "models.clientId": new ObjectId(clientId),
                "models.list":list,
                "models.models.articleId": articleId,
                "models.models.clientId" : new ObjectId(clientId)
              },
              {
                $set: {
                  "models.$.models.$[inner].productStatus": status,
                }
              },
              {
                arrayFilters: [{ "inner.articleId": articleId ,"inner.clientId": new ObjectId(clientId)}]
              });
           
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": status}});
            if(approve){
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":status}}); 
                if(status == 'Approved'){
                    let modeler = await db.modelerList.findOne({rollNo:modRollNo});
                    let modelList = modeler.models.find(model => model.list == list && model.clientId.equals(clientId));
                    if(modelList){
                        let checkAllModelApproved = modelList.models.find(model => model.productStatus != 'Approved');
                        if(!checkAllModelApproved) {
                            await db.modelerList.updateOne({rollNo:modRollNo,"models": {
                                $elemMatch: {
                                  clientId: new ObjectId(clientId),
                                  list: list
                                }
                              }},{$set:{'models.$.complete':true}});
                        }else{
                            await db.modelerList.updateOne({rollNo:modRollNo,"models": {
                                $elemMatch: {
                                  clientId: new ObjectId(clientId),
                                  list: list
                                }
                              }},{$set:{'models.$.complete':false}});
                        }
                    }
                    let products = await db.Products.findOne({clientId:new ObjectId(clientId)});
                    let clientCompleteCheck = products.productList.find(pro => pro.productStatus != 'Approved');
                    if(!clientCompleteCheck){
                        await db.Products.updateOne({clientId: new ObjectId(clientId)},{$set:{approvedClient:true}})
                        await db.clients.updateOne({_id: new ObjectId(clientId)},{$set:{status:"Approved"}})
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
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:"Correction",adminStatus:"Rejected"}});
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{modalStatus:"Correction",adminStatus:"Rejected"}});
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Need Updates","assignedPro.$.adminStatus":"Rejected"}});

            if(approve){
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Correction","productList.$.adminStatus":"Rejected"}});

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
            await db.AdminReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            await db.QaReviews.updateOne({clientId:new ObjectId(clientId),articleId:articleId},{$set:{adminStatus:'Approved',modalStatus:'Approved'}});
            let approve = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),"assignedPro.articleId": articleId},{$set:{"assignedPro.$.productStatus": "Approved","assignedPro.$.adminStatus":"Approved"}});

            if(approve){
                let pro = await db.Products.updateOne({clientId:new ObjectId(clientId),"productList.articleId":articleId},{$set:{"productList.$.productStatus":"Approved","productList.$.adminStatus":"Approved"}});
                
                let clientProList = await db.Products.findOne({clientId:new ObjectId(clientId)});
                
                let clientApproved = clientProList.productList.find(obj => obj.adminStatus == 'Not Approved' || obj.adminStatus == 'Rejected');
                if(clientApproved == undefined){
                    await db.clients.updateOne({_id:new ObjectId(clientId)},{$set:{status:"Approved"}})
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
            date = new Date(date).toUTCString()
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

    dbUpdateModelPrice:async(price,clientId,articleId,modelerRollNo,budgetExceed,totalExpense,remainingBudget,list,budget)=>{
        try {
            let updateItem = await db.budget.find({}).sort({_id:-1}).limit(1);
            if(budgetExceed != ""){
                let result = await db.budget.updateOne({_id:updateItem[0]._id},{$set:{exceeded:true,remainingBudget:remainingBudget,totalExpense:totalExpense}});
            }else if(budget != 0){
                let result = await db.budget.updateOne({_id:updateItem[0]._id},{$set:{exceeded:false,remainingBudget:remainingBudget,totalExpense:totalExpense}});
            }
            else{
                return {status:false,err:'budget not updated'}
            }
            // const lastDocument =await db.budget.find().sort({ _id: -1 }).limit(1);
            // if(lastDocument.length > 0){
            //    if(budgetExceed == ""){
            //     totalExpense = lastDocument[0].totalExpense + price;
            //      await db.budget.findOneAndUpdate(
            //         { _id: lastDocument[0]._id },
            //         { $set:{remainingBudget:updatedBudget,totalExpense:totalExpense}},
            //         { returnOriginal: false }
            //       );
            //    }
            // }
            await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':articleId},{$set:{'productList.$.price':price}});
           let a =  await db.modelerList.findOneAndUpdate( {
            rollNo: modelerRollNo,
            "models.clientId": new ObjectId(clientId),
            "models.list":list,
            "models.models.articleId": articleId,
            "models.models.clientId" : new ObjectId(clientId)
          },
          {
            $set: {
              "models.$.models.$[inner].price": price,
            }
          },
          {
            arrayFilters: [{ "inner.articleId": articleId ,"inner.clientId": new ObjectId(clientId)}]
          });
            await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.price':price}});
            return {status:true};
        } catch (error) {
            console.log(error);
            return {status:true,err:'something went wrong while updating the price'}
        }
    },

    dbCreateBudget:async(budget)=>{
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        try {
            let budgetData = {
            budget : budget,
            date: date,
            remainingBudget:budget,
            totalExpense:0
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
                let budgetData = await db.budget.find({date:date}).sort({_id:-1}).limit(1);;
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
            if(updateReff.acknowledged){
                let ack = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.Reff':url}});
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
            
            let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({}).sort({_id:-1});
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
                let helpData = [];
            if(rollNo == "1"){
                helpData = await db.helpLine.find({}).sort({_id:-1});;
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
            let client = await db.clients.findOne({_id:new ObjectId(clientId)});
            let maxList = await db.modelerList.aggregate([
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.clientId":new ObjectId(clientId)}
                },
                {
                    $group:{
                        _id:"$_id",
                        modelerId:{$first:"$_id"},
                        maxList:{$max:"$models.list"}
                    }
                },
                {
                    $sort: { _id: -1 } 
                }
            ])
            let modelerList = await db.modelerList.aggregate([
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.clientId":new ObjectId(clientId)}
                },
                {
                    $sort: { _id: -1 } 
                }
            ])
            let data = [];
            
            for(let item1 of maxList){
                for(let item2 of modelerList){
                    let obj = {}
                    if(item1.maxList == item2.models.list&&item1.modelerId.equals(item2._id)){
                        let totalAmount = 0;
                        obj.modelerName = item2.modelerName;
                        obj.modelerRollNo = item2.rollNo;
                        obj.totalProducts = item2.models.models.length;
                        item2.models.models.forEach((model)=>{
                           totalAmount += model.price; 
                        })
                        obj.totalAmount = totalAmount;
                        obj.deadLineOne = item2.models.deadLineOne || null
                        obj.deadLineTwo = item2.models.deadLineTwo || null;
                        obj.list = item2.models.list || null
                        obj.models = [...item2.models.models]

                        data.push(obj);
                    }   
                }
            }
            

        //     let data = await db.modelerList.aggregate([
        //     {
        //         $match:{'models.clientId':new ObjectId(clientId)}
        //     },
        //     {
        //         $unwind : "$models"
        //     },
        //     {
        //         $match:{'models.clientId': new ObjectId(clientId)}
        //     },
        //     {
        //         $addFields:{
        //             totalProducts:{$size:"$models.models"},
        //             totalAmount: {
        //                 $reduce: {
        //                   input: "$models.models",
        //                   initialValue: 0,
        //                   in: { $add: ["$$value", "$$this.price"] }
        //                 }
        //               }
        //         }
        //     },
        //     {
        //         $group:{
        //             _id:"$models.clientId",
        //             totalAmount:{
        //                 $sum:"$totalAmount"
        //             },
        //             list:{$first:"$models.list"},
        //             modelerName:{$first:"$modelerName"},
        //             modelerRollNo:{$first:"$rollNo"},
        //             totalProducts:{$first:"$totalProducts"},
        //             models:{$first:"$models.models"},
        //             deadLineOne:{$first:"$models.deadLineOne"},
        //             deadLineTwo:{$first:"$models.deadLineTwo"},
        //         }
        //     }
        // ])
        
        if(data.length != 0){
         return {status:true,response:data,client:client};   
        } 
        else return {status:false,error:"No data found",response:data,client:client}
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
                console.log("asfafadfasd");
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
            let clients = await db.clients.find({});
            clients.forEach((client)=>{
                let currDate = new Date();
                let internalDeadLine = new Date(client.internal_deadline);
                let projectDeadLine = new Date(client.project_deadline);
                if(currDate > internalDeadLine){
                    client.internal_deadline = 'exceeded';
                }
                if(currDate > projectDeadLine){
                    client.project_deadline = 'exceeded';
                }
                return client
            })
            if(modelers){
                return {modelers,clients}
            }else{
                return false
            }
            }else{
                let data = await db.correction.find({});
                return {data,clients};
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
                            list:"$models.list",
                            complete:"$models.complete",
                            eligibleForBonus:"$models.eligibleForBonus",
                            invoicedList:"$models.invoicedList",
                            completeDate:"$models.completeDate",
                            deadLineOne:"$models.deadLineOne",
                            deadLineTwo:"$models.deadLineTwo"
                          }
                        }
                      }
                }
            ])
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
            if(created){
                return {status:true,error:false};
            }else{
                return {status:false,error:"not updated"};
            }
        } catch (error) {
            console.log(error);
            return {status:false,error:"server error"}
        }   
    },

    dbCreateInvoice:async(invoiceId,modelerId,bonus)=>{
        try {
            let invoiceExist = await db.invoice.find({modelerId:modelerId,invoiceId:invoiceId});
            if(invoiceExist.length == 0){
                let a=await db.modelerList.updateMany(
                    {
                        _id: new ObjectId(modelerId),
                      },
                      {
                        $set: {
                            "models.$[outer].models.$[inner].invoice": true
                        }
                      },
                      {
                        arrayFilters: [{ "outer.models.productStatus": "Approved" },
                        { "inner.productStatus": "Approved" }],
                      }
                );
                let b=await db.modelerProducts.updateMany(
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
            let budgetData = await db.budget.find({}).sort({_id:-1}).limit(1);
            let remainingBudget = budgetData[0].remainingBudget;
            let totalExpense = budgetData[0].totalExpense;
            totalExpense = totalExpense + bonus;
            remainingBudget = remainingBudget - bonus;
            await db.budget.updateOne({_id:new ObjectId(budgetData[0]._id)},{$set:{remainingBudget:remainingBudget,totalExpense:totalExpense}});
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
            let updateItem = await db.budget.find({}).sort({_id:-1}).limit(1);
            
                let result = await db.budget.updateOne({_id:updateItem[0]._id},{$set:{exceeded:true}});
                if(result.acknowledged){
                    return true;
                }else{
                    return false;
                }
     
        } catch (error) {
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
            // let a = await db.modelerList.updateMany(
            //     {
            //         rollNo: modRoll,
            //         "models.clientId": new ObjectId(clientId),
            //         "models.models.articleId": articleId
            //       },
            //       {
            //         $set: {
            //           "models.$.models.$[inner].tag": tagName,  
            //         }
            //       },
            //       {
            //         arrayFilters: [{ "inner.articleId": articleId }]
            //       }
            // )
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
            let modelers = await db.modelerList.find({_id:modelerId});
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
        try {
            const folderPath = `./public/images/${clientName}/${articleId}`;
            if(!fs.existsSync(folderPath)){
            const response = await axios.get(link);
            const $ = cheerio.load(response.data);
            let hasMatchingWord = (altText,searchText)=>{
                const altWords = altText.toLowerCase().split(' ');
                const searchWords = searchText.toLowerCase().split(' ');
                return searchWords.some(word => altWords.includes(word));
            }
    
            let images = $('img').filter(function() {
                const altText = $(this).attr('alt');
                return altText && hasMatchingWord(altText,productName)
            })
            
            const scrapedImages = images.map(function() {
                let src = $(this).attr('src');
                let dataZoomImage = $(this).attr('data-zoom-image');
                const srcset = $(this).attr('srcset');
                
    
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

    dbGetCountOfReferenceImage:async(clientId,articleId)=>{
        try {
            let client = await db.clients.findOne({_id:new ObjectId(clientId)});
            if(client){
                const regex = /[^a-zA-Z0-9]/g;
                let clientName = client.clientName.replace(regex,"_");
                let fileCount = 0;
                if(fs.existsSync(`./public/images/${clientName}/${articleId}`)){
                   let files = fs.readdirSync(`./public/images/${clientName}/${articleId}`);
                   fileCount = files.length;
                }else{
                    console.log("not found");
                }
                return {status:true,count:fileCount} 
                
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

            let clientDetails = await db.clients.findOne({_id:new ObjectId(data.clientId)});
            let modelTeam = await db.modelerProducts.findOneAndUpdate({clientId:new ObjectId(data.clientId),'assignedPro.articleId':data.articleId},{$set:{"assignedPro.$.productStatus":"Correction"}});
            const regex = /[^a-zA-Z0-9]/g;
            let clientName = clientDetails.clientName.replace(regex,"_");
            if(modelTeam){
                modelTeam = modelTeam.assignedPro.find(obj => obj.articleId == data.articleId);
                let list = modelTeam.list;
                let a = await db.modelerList.findOneAndUpdate( {
                    rollNo: modelTeam.modRollno,
                    "models.clientId": new ObjectId(data.clientId),
                    "models.list":list,
                    "models.models.articleId": data.articleId,
                    "models.models.clientId" : new ObjectId(data.clientId)
                  },
                  {
                    $set: {
                      "models.$.models.$[inner].productStatus": 'Correction',
                    }
                  },
                  {
                    arrayFilters: [{ "inner.articleId": data.articleId , "inner.clientId": new ObjectId(data.clientId)}]
                  });
                let modeler = await db.modelerList.findOne({rollNo:modelTeam.modRollno,"models.clientId":new ObjectId(data.clientId)});
        
                let client = modeler.models.find((client)=>{
                    if(client.clientId==data.clientId && client.list==list){
                        return client
                    }
                })
                let checkExist = client.models.find(model => model.productStatus != "Approved");
                if(!checkExist){
                    await db.modelerList.updateOne({rollNo:modelTeam.modRollno,"models": {
                        $elemMatch: {
                          clientId: new ObjectId(data.clientId),
                          list: list
                        }
                      }},{$set:{'models.$.complete':true}})
                }else{
                    await db.modelerList.updateOne({rollNo:modelTeam.modRollno,"models": {
                        $elemMatch: {
                          clientId: new ObjectId(data.clientId),
                          list: list
                        }
                      }},{$set:{'models.$.complete':false}})
                }
                await db.Products.updateOne({clientId:new ObjectId(data.clientId),"productList.articleId":data.articleId},{$set:{"productList.$.productStatus":"Correction"}});   
                await db.QaReviews.updateOne({clientId:new ObjectId(data.clientId),articleId:data.articleId},{$set:{modalStatus:"Correction",underQA:false}});
            } 
        if(clientDetails){
            if(data.version == 1){

                data.version = 1
                data.QA = modelTeam.QaTeam;
                data.modeler = modelTeam.assigned;
                data.QA_rollNo = modelTeam.qaRollNo;
                data.mod_rollNo = modelTeam.modRollno;
                data.modelerView = false;
                data.date = new Date()
                let correction = await db.hotspot.create(data);

                return {status:true,version:1,correction:correction._id,client:clientDetails}
            }else{
                
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
        
        if(maxVersion.length != 0){
          if(fs.existsSync(`./public/models/${clientName}/${articleId}/version-${maxVersion[0].maxOne + 1}/${articleId}.glb`)){
            
            updateAvailable = true;
          }
          let latest = await db.hotspot.find({clientId:new ObjectId(clientId),articleId:articleId,version:maxVersion[0].maxOne});
        if(latest.length != 0){
            
            return {status:true,data:latest,update:updateAvailable}
        }else{
            console.log("not corrections");
        } 
        }else{
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
                // let hotspots = await db.hotspot.find({clientId:new ObjectId(clientId),articleId:articleId,version:maxVersion[0].maxOne});
                // if(hotspots.length != 0){
                //     let targetTime = hotspots[0].date;
                //     let currTime = new Date();
                //     let timeDifferenceInMinutes = currTime - targetTime;
                //     timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                //     timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
                //     if(timeDifferenceInMinutes > 5){
                //         console.log("correction is found");
                //         return {status:true,data:hotspots,msg:"data found"}
                //     }else{ 
                //         console.log(timeDifferenceInMinutes);
                //         console.log("model is under QA");
                //         return {status:true,msg:"under QA"}
                //     }
                // }else{
                //     throw new Error("no hotspots found!!")
                // } 
                // asdfasdfsadfasdf

                let testhotspot = await db.hotspot.aggregate([
                    {
                        $match:{clientId:new ObjectId(clientId),articleId:articleId,version:maxVersion[0].maxOne,date:{$lte:new Date(new Date() - 1 * 60 * 1000)}}
                    },
                ])
        
                if(testhotspot.length != 0){
                            console.log("correction is found");
                            return {status:true,data:testhotspot,msg:"data found"}
                        }else{ 
                            
                            console.log("model is under QA");
                            return {status:true,msg:"under QA"}
                        }
                
            }else{
                console.log("no correction is created");
                return {status:true,msg:"No correction is created"}
            }    
        } catch (error) {
            console.log(error);
            return {status:false}
        }
    },

    dbGetHotspotById:async(hotspotInfo)=>{
        try {
            
            let hotspot = await db.hotspot.find({articleId:hotspotInfo.articleId,clientId:new ObjectId(hotspotInfo.clientId),version:hotspotInfo.version});
            
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
          let result = await db.modelerList.updateOne({rollNo:rollNo},{$set:{bankDetails:bankInfo}});
          
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
            
            const list = await db.modelerList.aggregate([
                {
                    $match: {
                      _id: new ObjectId(modelerId)
                    }
                  },
                  {
                    $unwind: "$models"
                  },
                //   {
                //     $addFields: {
                //       "models.clientId": { $toObjectId: "$models.clientId" }
                //     }
                //   },
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
                          list:"$models.list",
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
                
                let currTime = new Date();
                let timeDifferenceInMinutes = currTime - targetTime;
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
                
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
            let target = await db.hotspot.findOne({clientId:new ObjectId(corrData.clientId),articleId:corrData.articleId,version:corrData.version,hotspotId:corrData.hotspotId,hotspotName:corrData.hotspotName});
            if(count == 1 && target){
                team = target;
            }else{
                let target = await db.hotspot.findOne({clientId:new ObjectId(element.clientId),articleId:element.articleId,version:element.version,hotspotId:element.hotspotId});
                team = target
            }
            
            if(target){
                let targetTime = new Date(target.date);
               
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

    dbDeleteHotspot:async(hotspotName,articleId,clientId)=>{
        try {
            let hotspot = await db.hotspot.findOne({hotspotName:hotspotName});
            let timeDifferenceInMinutes;
            if(hotspot){
                let targetTime = new Date(hotspot.date);
                let currTime = new Date();
                console.log(targetTime);
                console.log(currTime);
                timeDifferenceInMinutes = Math.floor((currTime.getTime() - targetTime.getTime()) / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 1000);
                timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
            }
            console.log("timing differences");
            console.log({timeDifferenceInMinutes});
            if(timeDifferenceInMinutes <= 5){
                let deleteRes = await db.hotspot.deleteOne({hotspotName:hotspotName,articleId:articleId,clientId:new ObjectId(clientId)});
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
            deadLine.date = new Date(deadLine.date).toISOString().slice(0,10)
            let maxListNo = await db.modelerList.aggregate([
                {
                    $match:{rollNo:deadLine.modRoll}
                },
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.clientId":new ObjectId(deadLine.clientId)}
                },
                {
                    $group:{
                        _id:"$_id",
                        maxList:{$max:"$models.list"}
                    }
                }
              ])
            const list = maxListNo[0].maxList
            
            if(deadLine.status == 'deadLineOne'){
                
                
              let a =  await db.modelerList.updateOne({
                    rollNo: deadLine.modRoll,
                    "models": {
                        $elemMatch: {
                          clientId: new ObjectId(deadLine.clientId),
                          list: deadLine.list
                        }
                      }
                  },
                  {
                    $set: {
                      "models.$.deadLineOne": deadLine.date,
                    }
                  })
                  
            }else{
              let b =  await db.modelerList.updateOne({
                    rollNo: deadLine.modRoll,
                    "models": {
                        $elemMatch: {
                          clientId: new ObjectId(deadLine.clientId),
                          list: deadLine.list
                        }
                      }
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

    dbUpdateBonusForModeler:async(flag,modRoll,clientId,list)=>{
        try {
            if(!flag){
                
                let removeFirstDeadLine = await db.modelerList.updateOne({rollNo:modRoll,'models.clientId':new ObjectId(clientId),'models.list':list},{$set:{"models.$.deadLineOne":null}});
                if(removeFirstDeadLine){
                 
                 return true;
                }else{
                 return false;
                }
            }else{
               
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
            
            let updatedRes = await db.hotspot.updateMany({
                mod_rollNo:hotspotInfo.modelerRollNo,
                clientId:new ObjectId(hotspotInfo.clientId),
                articleId:hotspotInfo.articleId,
                version:hotspotInfo.version
            },{$set:{modelerView:true}});
            
            if(updatedRes){
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
            let maxListNo = await db.modelerList.aggregate([
                {
                    $match:{_id:new ObjectId(modelerId)}
                },
                {
                    $unwind:"$models"
                },
                {
                    $match:{"models.clientId":new ObjectId(clientId)}
                },
                {
                    $group:{
                        _id:"$_id",
                        maxList:{$max:"$models.list"}
                    }
                }
              ])
            let list = maxListNo[0].maxList
            let updateRes = await db.modelerList.updateOne({_id:new ObjectId(modelerId),"models": {
                $elemMatch: {
                  clientId: new ObjectId(clientId),
                  list: list
                }
              }},{$set:{'models.$.adminView':true}});
            if(updateRes.modifiedCount > 0){
                return true;
            }else{
                return false;
            }
        } catch (error) {
            console.log(error);
            return true;   
        }
    },

    dbRejectBonus:async(modelerRollNo,list,clientId)=>{
        try {
           const bonusRejected = await db.modelerList.updateOne({rollNo:modelerRollNo,"models": {
            $elemMatch: {
              clientId: new ObjectId(clientId),
              list: list
            }
          }},{$set:{'models.$.eligibleForBonus':false}});
           if(bonusRejected.modifiedCount > 0){
            return true;
           } else{
            return false;
           }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateInvoiceList:async(invoiceList)=>{
        try {
            let updateRes = await db.modelerList.updateOne({rollNo:invoiceList.modRollNo,"models": {
                $elemMatch: {
                  clientId: new ObjectId(invoiceList.clientId),
                  list: invoiceList.list
                }
              }},{$set:{'models.$.invoicedList':true}});
            if(updateRes.modifiedCount > 0){
                return ;
            }else{
                throw new Error("")
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbAddRequirement:async(info,articleId,clientId)=>{
        try {
           let updateProductList = await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':articleId},{$set:{'productList.$.extraInfo':info}});
           let updateAssignedProductList = await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':articleId},{$set:{'assignedPro.$.extraInfo':info}});
           await Promise.all([updateProductList, updateAssignedProductList]);
           return true
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbCreateListRequirement:async(info,clientId) => {
        try {
            let obj = {
                clientId:new ObjectId(clientId),
                additionalInfo:info
            }
            const requirement = await db.requirement.create(obj);
            return !!requirement;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbEditGlobalRequirement:async(info,clientId)=>{
        try {
          const updateInfo = await db.requirement.updateOne({clientId:new ObjectId(clientId)},{$set:{additionalInfo:info}}); 
          return !!updateInfo;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbDeleteClient:async(clientId)=>{
        try {
            const deleteClient = await db.clients.deleteOne({_id:new ObjectId(clientId)});
            const deleteProductList = await db.Products.deleteOne({clientId:new ObjectId(clientId)});
            await Promise.all([deleteClient,deleteProductList]);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    dbUpdateClientListInfo:async(info,clientId,field,uniquefieldValue) =>{
        try {
            let updateProductList
            if(field == 'ArticleId'){
              updateProductList = await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.articleId':uniquefieldValue},{$set:{'productList.$.articleId':info}}); 
            //  const client = await db.modelerProducts.findOne({clientId:new ObjectId(clientId)});
            //  let productExist = client?.assignedPro.find(pro => pro.articleId == uniquefieldValue);

            //  if(productExist){
            //     await db.modelerProducts.updateOne({clientId:new ObjectId(clientId),'assignedPro.articleId':uniquefieldValue},{$set:{'assignedPro.$.articleId':info}})
            //  }
            }else{
              updateProductList = await db.Products.updateOne({clientId:new ObjectId(clientId),'productList.productLink':uniquefieldValue},{$set:{'productList.$.productLink':info}});  
            } 
            return !!updateProductList
        } catch (error) {
            console.log(error);
            return false;
        }
    }
} 