
const db = require("../schema/modal")
const ObjectId = require('mongodb').ObjectId;
const validator = require('gltf-validator');
const fs = require('fs');


const polygonCounter = async(articleID,clientID)=>{
    try {
        let fullpath = `public/modals/${articleID}&&${clientID}.glb`
        const modelData = fs.readFileSync(`public/modals/${articleID}&&${clientID}.glb`);
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
        if(data){
            if(Array.isArray(data)){
                return data;
            }else{
                let Arr = [];
                Arr.push(data)
                return Arr
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
            if(proData){
            let Arr = [];
            Arr.push(proData) 
            return Arr
            }else{
                throw new Error("Products Not Found")
            }
        } catch (error) {
            console.log(error);
            return false
        }   
    },

    assignPro:async(data,name,QaName)=>{
        try {
            for(let item of data.products){
                item.assigned = name;
                item.QaTeam = QaName;
                item.productStatus = "Not Uploaded"  
                     }
            let sameClientPro = await db.modalerProducts.findOne({clientId:data.clientId,modalerName:name,QATeamName:QaName});
            if(sameClientPro){
                let pushPro = await db.modalerProducts.updateOne({_id:sameClientPro._id},{$push:{assignedPro:data.products[0]}});
                console.log(pushPro);
            }else{
            let formatedData = {
                modalerName : name,
                modalerRollNo:data.rollNo,
                QATeamName : QaName,
                QATeamRollNo:data.QaRoll,
                clientId:new ObjectId(data.clientId),
                assignedPro:data.products,
                approvedClient: true,     
                  }
        let prod = new db.modalerProducts(formatedData);
        let saved = await prod.save();
        
            }
            let toBeupdated = await db.Products.findOne({clientId:data.clientId});
            for(let item of data.products){
               for(let x of toBeupdated.productList){
                    if(x.articleID == item.articleID){
                        x.assigned = name;
                        x.QaTeam = QaName
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

    dbGetClientForModaler:async(ModalerRollNo)=>{
        try{
            console.log(ModalerRollNo);
        let clientData = await db.modalerProducts.aggregate([
            {
                $match:{
                    modalerRollNo:ModalerRollNo
                }
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
            console.log("db upload");
            let {id,clientId}  = data;
            console.log(id);
            console.log({clientId});
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
            console.log(updateRes);
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

    dbCreateComntQa:async(data)=>{
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
        console.log({commentData});
        if(commentData){
            let result = await polygonCounter(articleID,clientID);
            if(result){
              let polygonCount = result.info.totalTriangleCount;
              let Arr = [];
              Arr.push(commentData)
            return {Arr,polygonCount}  
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

    dbAprroveModal:async(clientID,articleID,status)=>{
        try {
            await db.QaReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:status}});
            await db.AdminReviews.updateOne({clientId:clientID,articleId:articleID},{$set:{modalStatus:status}});
            let approve = await db.modalerProducts.updateOne({clientId:clientID,"assignedPro.articleID": articleID},{$set:{"assignedPro.$.productStatus": status}});
            if(approve){
                let pro = await db.Products.updateOne({clientId:clientID,"productList.articleID":articleID},{$set:{"productList.$.productStatus":status}});

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
        if(commentData){
            let result = await polygonCounter(articleID,clientID);
            if(result){
                let polygonCount = result.info.totalTriangleCount;
                let Arr = [];
                Arr.push(commentData)
                return {Arr,polygonCount}
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
        
        
    }
        
    
}