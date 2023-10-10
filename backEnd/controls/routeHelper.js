const jwt = require('jsonwebtoken')
require('dotenv').config();
const  database = require("./dbQueries");
const fs = require('fs');

let credentials = [
    {
        email:"admin@charpstar.com",
        name: 'admin',
        password: process.env.ADMIN_PASS,
        role:"admin",
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:"roney@charpstar.com",
        name:"Roney",
        password: process.env.QA_PASS,
        role:"QA",
        rollNo :"QA5",
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:"shreyas@charpstar.com",
        name:"Shreyas",
        password: process.env.QA_PASS,
        role:"QA",
        rollNo :"QA3",
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:"urvee@charpstar.com",
        name: "Urvee",
        password: process.env.QA_PASS,
        role:"QA",
        rollNo : "QA1",
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:"user3D1@charpstar.com",
        name: "user3D1",
        password: process.env.PASS_3D,
        role:"3D",
        rollNo:"4",
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:"user3D2@charpstar.com",
        rollNo : "3",
        name : "user3D2",
        role:"3D",
        password:process.env.PASS_3D,
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:'rafi@charpstar.com',
        rollNo : "QA4",
        name: "Rafi",
        role:"QA",
        password:process.env.QA_PASS,
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
    {
        email:'richard@charpstar.com',
        rollNo:'1',
        name:'Richard',
        role:'3D',
        password:process.env.PASS_3D,
        phone:"23232323232",
        address:"Lorem ipsum dolor sit 07/6"
    },
]

let modelers = [
    {
        email:'richard@charpstar.com',
        rollNo: "1",
        name:'Richard'
    },
    {
        email:"user3D2@charpstar.com",
        rollNo : "3",
        name : "user3D2",
    },
    {
        email:"user3D1@charpstar.com",
        rollNo : "4",
        name : "user3D1",
    }
]

let QATeams = [
    {
        rollNo : "QA1",
        name: "Urvee"
    },
    {
        rollNo : "QA3",
        name: "Shreyas"
    },
    {
        rollNo : "QA4",
        name: "Rafi"
    },
    {
        rollNo : "QA5",
        name: "Roney"
    }
]

module.exports = {
    userLogin:async(req,res)=>{
        let userEmail = req.body.email;
        let getUser = credentials.find(user => user.email == userEmail);
        if(getUser){
            let passTrue = getUser.password == req.body.password ? true :false;
            if(passTrue) {
                let role = getUser.role
                let userName = getUser.name
                getUserJson = JSON.stringify(getUser);
                let accessToken = await jwt.sign(getUserJson,process.env.ACC_TOKEN_SECRET);
                res.cookie('auth-token', accessToken);
                res.json({token:accessToken,userRole:role,userEmail:getUser.email,rollNo:getUser.rollNo,userName: userName})
            }else{
                res.json({password:true})
            }
        }else{console.log("user not found");
            res.json({userExist:true})
        }
    },

    checkUser:(req,res)=>{
        let header = req.headers['authorise'];
        let a  = req.cookies['auth-token'];
        if(header == null){
            res.status(200).json({prevent: true})
        }else{
            jwt.verify(header,process.env.ACC_TOKEN_SECRET,(err,data)=>{
                if(err) res.json({prevent:true})
                else res.json({prevent: false})
            })
        }
    },

    createPro:async(req,res)=>{
        try{
        let {client,proList} = req.body
        console.log(client);
        let clientInfo = await database.dbcreateClient(client[0]);
        console.log({clientInfo});
        if(clientInfo){
            let id = clientInfo.client._id.toString()
            console.log(id);
            let proListInfo = await database.dbcreatePro(proList,id,clientInfo.exist);
            
            if(proListInfo){
            res.json(clientInfo)
            }else{
                throw new Error
            }
        }else{
            throw new Error
        }
        }catch(error){
            console.log(error);
            res.status(500).json(false)
        }  
    },

    getClients:async(req,res)=>{
        try{
        let clientData = await database.dbGetClients();
        if(clientData){
            res.status(200).json(clientData)
        }else{
            throw new Error
        }
        }catch(error){
            console.log(error);
            res.status(500).json(false)
        }    
    },

    getPro:async(req,res)=>{
        try{
            let proId = req.params.id;
            let dbres = await database.dbGetPro(proId);
            if(dbres){
                res.status(200).json(dbres)
            }else{
                throw new Error("products not found")
            }
        }catch(error){
            res.status(500).json({status:error})
        }
    },

    getApprovedClients:async(req,res)=>{
        try {
           let clients = await database.dbGetapprovedClients();
           if(clients){
            res.status(200).json(clients)
           }else{
            throw new Error;
           }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
    },

    getModelres:(req,res)=>{
        try {
            res.status(200).json({modelersAr:modelers,QAarr:QATeams})
        } catch (error) {
           res.status(500).json(false) 
        }  
    },

    assignProducts:async(req,res)=>{
        try {
            let rollNo = req.body.rollNo;
            let QaRollNo = req.body.QaRoll
            let modelerName = modelers.find(obj => obj.rollNo == rollNo)
            let QAname = QATeams.find(obj => obj.rollNo == QaRollNo)
            console.log({QAname});
            let resData;
            if(!req.body.reallocation){
                console.log("reallocation false");
            resData = await database.assignPro(req.body,modelerName.name,modelerName.email,QAname.name,rollNo,QaRollNo);
            if(resData.status){
                res.status(200).json(resData)
               }else{
                    throw new Error("something went wrong in product assignment!!")
               }
            }else{
            console.log("reallocation");
            console.log(req.body);
            resData = await database.reallocationModel(req.body,modelerName.name,modelerName.email,QAname.name,rollNo,QaRollNo);
            console.log({resData});
            if(resData.status){
                res.status(200).json(resData)
               }else{
                    throw new Error("something went wrong in product assignment!!")
               }
            }
           
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getClientForModaler:async(req,res)=>{
        try {
            let modRollNo = req.params.modRollNo;
            let clients = await database.dbGetClientForModaler(modRollNo);
            if(clients){
                res.status(200).json(clients)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getModalerPro:async(req,res)=>{
        try {
            let {id,modRollNo} = req.params;
            console.log(id);
            let assignedPro = await database.dbGetAssignedPro(id,modRollNo);
            console.log({assignedPro});
            if(assignedPro){
                res.status(200).json(assignedPro)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }   
    },

    savemodalFile:async(req,res)=>{
        try {
           let file = req.files.file; 
           if(fs.existsSync(`./public/pngFiles/${req.body.clientId}/${req.body.id}.png`)){
            fs.unlinkSync(`./public/pngFiles/${req.body.clientId}/${req.body.id}.png`,(err)=>{
                if(err){
                    console.log(`${err}-Something went wrong while deleting the png`);
                }
            })
           }
        if(file){
            let status = "Uploaded"
            let data = await database.dbupdateProductStatus(req.body,status); 
            let count = 1;
            if(data.status){ 
                const regex = /[^a-zA-Z0-9]/g;
                const updatedClientName = data.data.clientName.replace(regex,'_')
                if(!fs.existsSync(`./public/models/${updatedClientName}/${req.body.id}`)){
                    console.log("new model directory creation");
                    fs.mkdirSync(`./public/models/${updatedClientName}/${req.body.id}/version-1`,{recursive:true});
                }else{
                    console.log("new versionss");
                    let checkQAStatus = await database.dbCheckQAStatus(req.body)
                    if(checkQAStatus.status){
                        if(!checkQAStatus.flag&&data.preModalStatus == "Uploaded"){
                            content = fs.readdirSync(`./public/models/${updatedClientName}/${req.body.id}`);
                            count = content.length
                        }else{
                            content = fs.readdirSync(`./public/models/${updatedClientName}/${req.body.id}`);
                            count = content.length + count;
                            fs.mkdirSync(`./public/models/${updatedClientName}/${req.body.id}/version-${count}`,{recursive:true})
                        }
                    }
                                    }
                let updateResult = await database.dbupdateVersion(req.body,status,count);

                if(updateResult){
                   file.mv(`./public/models/${updatedClientName}/${req.body.id}/version-${count}/${req.body.id}.glb`,async(err,data)=>{
                    if(err){
                        console.log(err);
                        throw new Error
                    }else{ 
                        console.log("uploaded");
                        console.log("differen");
                        res.status(200).json({status:true,version:count});
                    }
                }) 
                }else{
                    throw new Error("something went wrong over version update!! *dbupdateVersion");
                }   
            }else if(data.msg == "model under QA"){
                    res.status(200).json({status:false,msg:data.msg})
            }else{
                throw new Error(data.msg)
            }
        } 
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
    },

    getClientsForQa:async(req,res)=>{
        try {
            console.log("reachedddd");
            let qaRollNo = req.params.qaRollNo;
            let clients = await database.dbGetClientsForQa(qaRollNo);
            if(clients){
                res.status(200).json(clients)
            }else{
                throw new Error
            } 
        } catch (error) {
            res.status(500).json(false)
        }  
    },

    getQaPro:async(req,res)=>{
        try {
            let {id,qaRollNo} = req.params;
            let products = await database.dbGetQaPro(id,qaRollNo)
            if(products){
                res.status(200).json(products);
            }else{
                throw new Error
            }
        } catch (error) { 
            res.status(500).json(false)
        }    
    },

    createCommentQa:async(req,res)=>{
        try {
            let data = req.body;
            user = credentials.find(obj => obj.email == data.user);
            let cmnt = await database.dbCreateComntQa(req.body,user);
        if(cmnt){
            res.status(200).json(true)
        }else{
            throw new Error
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
        
    },

    getQaComments:async(req,res)=>{
        try {
        let clientId = req.params.clientId;
        let articleId = req.params.articleId;
        let version = req.params.version;
        console.log({clientId});
        let getData = await database.dbGetQaComments(clientId,articleId,version);
        console.log({getData});
        if(getData){
            res.status(200).json(getData)
        } else{
            res.status(500).json(false)
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }   
    },

    approveModal:async(req,res)=>{
        try {
            console.log(req.body);
            let {clientId,articleId,status,rollNo,modelerName,correction,modelName,modelerRollNo,productName,list} = req.body;
            let QaName = credentials.find(obj => obj.rollNo == rollNo);
            let update = await database.dbAprroveModal(clientId,articleId,status,QaName.name,modelerName,correction,modelName,modelerRollNo,rollNo,productName,list);
            if(update){
                res.status(200).json(true)
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    createAdminComments:async(req,res)=>{
        try {
            console.log("asdfasdf"); 
            console.log(req.body);
            let cmnt = await database.dbCreateComntAdmin(req.body);
        if(cmnt){
            res.status(200).json(true)
        }else{
            throw new Error
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }   
    },

    getAdminComments:async(req,res)=>{
        try {
         let clientId = req.params.clientId;
         let articleId = req.params.articleId;
         let getData = await database.dbGetAdminComments(clientId,articleId);
         console.log({getData});
         if(getData){
             res.status(200).json(getData)
         } else{
             res.status(500).json({message:"Invalid product id"})
         }
         } catch (error) {
             console.log(error);
             res.status(500).json(false)
         }   
    },

    rejectModal:async(req,res)=>{
        try {
            let {clientId,articleId} = req.body;
            let update = await database.dbRejectModal(clientId,articleId);
            if(update){
                res.status(200).json(true)
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    adminApproveModal:async(req,res)=>{
        try {
            let {clientId,articleId} = req.body;
            let update = await database.dbAdminAprroveModal(clientId,articleId);
            if(update){
                res.status(200).json(true)
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    createModalerComment:async(req,res)=>{
        try {
            let cmnt = await database.dbCreateComntModaler(req.body);
        if(cmnt){
            res.status(200).json(true)
        }else{
            throw new Error
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getModelerMonthlyStatus:async(req,res)=>{
        try {
            let modeler = await database.dbGetModelerMonthlyStatus()
            if(modeler){
                res.status(200).json(modeler);
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getstatusDate:async(req,res)=>{
        try {
            let date = req.params.date;
            let dateToFetch = new Date(date);
            let mnth = dateToFetch.getMonth();
            let year = dateToFetch.getFullYear();
            let adminStatus = await database.dbGetStatusDate(mnth,year);
            if(adminStatus){
                res.status(200).json(adminStatus)
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }    
    },

    setClientManager:async(req,res)=>{
        try {
            let {name,clientId} = req.body;
            let setStatus = await database.dbSetClientManager(name,clientId);
            if(setStatus){
                res.status(200).json(true);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
    },

    setDeadline:async(req,res)=>{
        try {
            let {date,clientId,type} = req.body;
            let deadlineStatus = await database.dbSetDeadline(date,clientId,type);
            if(deadlineStatus){
                res.status(200).json(true);
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
    },

    updateModelPrice:async(req,res)=>{
        try {
            let {price,clientId,articleId,modelerRollNo,budgetExceed,totalExpense,remainingBudget,list,budget} =  req.body;
            let priceUpdated =  await database.dbUpdateModelPrice(price,clientId,articleId,modelerRollNo,budgetExceed,totalExpense,remainingBudget,list,budget);
            if(priceUpdated.status){
                res.status(200).json(true);
            }else if(priceUpdated.err == 'budget not updated'){
                res.status(200).json(priceUpdated.err);
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
    },

    createBudget:async(req,res)=>{
        console.log(req.body);
        try {
            let {budgetPrice} = req.body;
            let budgetUpdated = await database.dbCreateBudget(budgetPrice);
            if(budgetUpdated){
                res.status(200).json(true)
            }else{
                throw new Error('budget was not created!something went wrong')
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
    },

    getClientExpense:async(req,res)=>{
        try {
            let expData = await database.dbGetClientExpense();
            if(expData.status){
                res.status(200).json(expData);
            }else{
                res.status(200).json(expData)
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }   
    },

    updateReff:async(req,res)=>{
        try {
            console.log(req.body);
            let {url,articleId,clientId,productName} = req.body;
            let updatedReff = await database.dbUpdateReff(url,articleId,clientId,productName);
            if(updatedReff){
                res.status(200).json(true)
            }else throw new Error
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }    
    },

    getNotifications:async(req,res)=>{
        try {
            let {rollNo,flag} = req.params;
            let notifyData = await database.dbGetNotifications(rollNo,flag);
            if(notifyData){
                res.status(200).json(notifyData);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }    
    },

    getProgress:async(req,res)=>{
        try {
            let {clientId} = req.params;
            let modelerProgress = await database.dbGetProgress(clientId);
            if(modelerProgress.status){
                res.status(200).json(modelerProgress);
            }else if(modelerProgress.error == 'No data found'){
                res.status(200).json(modelerProgress)
            }else{
                throw new Error
            }

        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getGlbFileDetails:async(req,res)=>{
        try {
            let {articleId,clientId,version} = req.params;
            let glbData = await database.dbGetGlbFileDetails(articleId,clientId,version);
            if(glbData){
                res.status(200).json(glbData)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }    
    },

    getNotificationsAdmin:async(req,res)=>{
        try {
            let flag = req.params.status
            let adminNotify = await database.dbGetNotificationAdmin(flag);
            if(adminNotify){
                res.status(200).json(adminNotify)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    generateInvoice:async(req,res)=>{
        try {
            let {rollNo} = req.params;
            let invoiceData = await database.dbGenerateInvoice(rollNo);
            if(invoiceData.status){
                res.status(200).json(invoiceData.data);
            }else{
                throw new Error(invoiceData.error)
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }    
    },

    createBankDetails:async(req,res)=>{
        try {
            console.log("bankDetails reqqqqqqq");
            console.log(req.body);
            let bankData = req.body;
            let bankDetailsSaved = await database.dbCreateBankDetails(bankData);
            if(bankDetailsSaved.status){
                res.status(200).json(true);
            }else{
                throw new Error(bankDetailsSaved.error);
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
    },

    createInvoice:async(req,res)=>{
        try { 
           let pdf = req.files.pdfFile;
           let {invoiceId,modelerId,bonus} = req.body;
           let invoiceSaved = await database.dbCreateInvoice(invoiceId,modelerId,bonus);
           if(invoiceSaved.status){
            if(pdf){
                pdf.mv(`./public/invoices/${invoiceId}.pdf`,(err,data)=>{
                if(err){
                    throw new Error('pdf is not stored!! some thing went wrong')
                }else{
                    res.status(200).json(true);
                }
            })
            } 
           }else if(invoiceSaved.error == "invoice exist"){
            res.status(200).json(false);
           }else{
            throw new Error(invoiceSaved.error)
           }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
    },
    updateBudgetExceed:async(req,res)=>{
        try {
            console.log("reached roiut");
            let statusUpdated = await database.dbUpdateBudgetExceed();
            if(statusUpdated){
                console.log("returend value");
                res.status(200).json(true);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
    },

    createTags:async(req,res)=>{
        try {
            let tagName = req.body.tagName;
            let result = await database.dbCreateTags(tagName); 
            if(result){
                res.status(200).json(true);
            } else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
     },

     getTags:async(req,res)=>{
        try {
           let result = await database.dbGetTags();
            if(result.status){
                res.status(200).json(result.data);
            }else if(result.error == "No tags has been found"){
                result.data = []
                res.status(200).json(result.data)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
     },

     assignTag:async(req,res)=>{
        try {
        let {tagName,articleId,clientId} = req.body;
        let result = await database.dbAssignTag(tagName,articleId,clientId);
        if(result){
            res.status(200).json(true);
        }
        else{
            throw new Error
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
     },

     createHelpLine:async(req,res)=>{
        try {
            let {modelerRollNo,articleId,clientId} = req.body;
            let modeler = credentials.find(obj => obj.rollNo == modelerRollNo);
            let result = await database.dbCreateHelpLine(modelerRollNo,modeler.name,articleId,clientId);
            if(result.status){
                if(result.resData == 'Exist') res.status(200).json({status:true,data:"Exist"});
                else res.status(200).json({status:true,data:'New'});   
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
     },

     getAllModelsForModeler:async(req,res)=>{
        try {
            let {modelerId} = req.params;
            let result = await database.dbGetallModelsForModeler(modelerId);
            console.log({result});
            if(result){
                res.status(200).json(result);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
     },

     savePng:(req,res)=>{
        try {
        let image = req.files.screenshot;
        let {articleId,clientId,clientName} = req.body;
        if(!fs.existsSync(`./public/pngFiles/${clientId}`)){
            fs.mkdirSync(`./public/pngFiles/${clientId}`)
        }
        image.mv(`./public/pngFiles/${clientId}/${articleId}.png`,(err,data)=>{
            if(!err){
                res.status(200).json(true);
            }else{
                console.log(err);
                res.status(200).json(false);
            }
        });  
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
     },

     createRequirement:async(req,res)=>{
        try {
            let {clientId,requirement,prodcuts} = req.body;
            console.log({clientId,requirement,prodcuts});
            let result = await database.dbCreateRequirement(clientId,requirement,prodcuts);
            if(result){
                res.status(200).json(true);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
     },

     scrapeImg:async(req,res)=>{
        try {
            let {link,productName,articleId,clientName} = req.body;
            let scrapedImg = await database.dbScrapeImg(link,productName,articleId,clientName);

            if(scrapedImg.success && scrapedImg.message == "Complete"){
                res.status(200).json({status:"success"});
            }else if(scrapedImg.message == 'Incomplete'){
                res.status(200).json({status:"Incomplete"});
            }else if(scrapedImg.message == 'No images found!'){
                res.status(200).json({status:"No images found!"});
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }   
      },

      getClientById:async(req,res)=>{
        try {
           let {clientId,articleId} = req.params;
           let getClientData = await database.dbGetClientById(clientId,articleId);
           if(getClientData){
            return res.status(200).json(getClientData);
            }else{
                throw new Error('no client found');
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        } 
      },

      getCountOfReferenceImage:async(req,res)=>{
        try {
            let {clientId,articleId} = req.params;
            let fileCount = await database.dbGetCountOfReferenceImage(clientId,articleId);
            console.log({fileCount});
            if(fileCount.status){
                res.status(200).json(fileCount.count);
            }else{
                console.log("asdfasdf");
                res.status(500).json(false);
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      uploadRefManuall:(req,res)=>{
        try {
            let imageFiles = req.files.images
            
            console.log(typeof(imageFiles));
            console.log(imageFiles);
            let {articleId,clientName} = req.body;
            const regex = /[^a-zA-Z0-9]/g;
            clientName = clientName.replace(regex,'_')
            if(!fs.existsSync(`./public/images/${clientName}/${articleId}`)){
                fs.mkdirSync(`./public/images/${clientName}/${articleId}`,{ recursive: true });
            }
            let content = fs.readdirSync(`./public/images/${clientName}/${articleId}`);
            let count = content.length;
            let flag = true;
            if(Array.isArray(imageFiles)){ 
               imageFiles.forEach(file => {
                count = count + 1;
                file.mv(`./public/images/${clientName}/${articleId}/${count}.jpg`,(err,data)=>{
                    if(!err){
                        console.log("uploaded");
                    }else{
                        console.log(err);
                        console.log("not uploaded");
                        flag = false;
                    }
                })
            }); 
            }else{
                count = count + 1;
                console.log({count});
                console.log("new");
                imageFiles.mv(`./public/images/${clientName}/${articleId}/${count}.jpg`,(err,data)=>{
                    if(!err){
                        console.log("uploaded");
                    }else{
                        console.log(err);
                        console.log("not uploaded");
                        flag = false;
                    }
                })
            }
            
            if(flag){
                res.status(200).json(true)
            }
            else{
               throw new Error("some of the images were not uploaded!!")
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }  
      },

      createHotspot:async(req,res)=>{
        try {
            console.log(req.body);
            let {hotspotName,normal,position,articleId,clientId,nor} = req.body;
            let result = await database.dbCreateHotspot(hotspotName,normal,position,articleId,clientId,nor);
            if(result){
                res.status(200).json(true)
            }else{
                throw new Error('hotspot not created! something went wrong')
            }   
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getHotspots:async(req,res)=>{
        try {
            let {articleId,clientId} = req.params;
            let result = await database.dbGetHotspots(articleId,clientId);
            if(result){
                res.status(200).json(result)
            }else if(result.msg = "New model"){
                res.status(200).json({status:true,version:0});
            }else{
                throw new Error(result.error);
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }    
      },

      getClientForQADo:async(req,res)=>{
        try {
            let clientId = req.params.clientId;
            let result = await database.dbGetClientForQaDo(clientId);
            if(result){
                res.status(200).json(result)
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
    },

      updateHotspotImg:async(req,res)=>{
        try {
        let data = req.body;
        console.log(data);
        let count = 0;
        let images = req.files
        for(let key in data){
            count ++
            console.log({key});
            let objString = data[key];
            let item = JSON.parse(objString);
            let saveCorrection = await database.createCorrection(item);
            if(saveCorrection.status){
             const regex = /[^a-zA-Z0-9]/g;
             saveCorrection.client.clientName = saveCorrection.client.clientName.replace(regex,"_")
             if(images){
                fs.mkdirSync(`./public/corrections/${saveCorrection.client.clientName}/${item.articleId}/version-${saveCorrection.version}`,{recursive:true});
                let image = images[`image${count}`];
                if(image){
                  image.mv(`./public/corrections/${saveCorrection.client.clientName}/${item.articleId}/version-${saveCorrection.version}/${item.hotspotName}.jpg`,(err,data)=>{
                    if(!err){
                        console.log("uploaded");
                    }else{
                        throw new Error('correction image uploading failed')
                    }
                })   
                }  
             }
            }
        }
        res.status(200).json(true);
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
      },

      getLatestHotspots:async(req,res)=>{
        try {
           let {clientId,articleId} = req.params;
        let result = await database.dbGetLatestHotspots(clientId,articleId);
        if(result){
            if(result.status){
                res.status(200).json(result)
            }else{
             res.status(200).json(false); 
            }    
        } else{
            throw new Error("something went wrong while fetching the latest hotspots!")
        }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }  
      },

      getLatestCorrectionForModeler:async(req,res)=>{
        try {
            const {clientId,articleId} = req.params;
            let result = await database.dbGetLatestHotspotsForModeler(clientId,articleId);
            console.log(result);
            if(result.status){
                console.log(result.msg);
                if(result.msg == "under QA" || result.msg === "No correction is created"){
                    console.log("asdfadfasdfasdfasdfasdf");
                    console.log(result.data);
                    res.status(200).json(false);
                }else{
                    res.status(200).json(result.data)
                }
            }else{
                throw new Error("hotspot not found!!")
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
      },

      getHotspotById:async(req,res)=>{
        try {
          const {version,clientId,articleId} = req.params;
        let result = await database.dbGetHotspotById({version,clientId,articleId});
        if(result) res.status(200).json(result);
        else res.status(500).json(false);   
        } catch (error) {
            console.log(error);
            res.status(500).json(false);  
        } 
      },

      updateModelUnderQA:async(req,res)=>{
        try {
          const {clientId,articleId,flag} = req.body; 
          const result = await database.dbUpdateModelUnderQA(clientId,articleId); 
          if(result) res.status(200).json(true);
          else throw new Error('Something went wrong while updating the under QA status!!')
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getUserDetailsForProfile:async(req,res)=>{
        try {
            const email = req.params.email;
            let user = credentials.find(obj => obj.email == email); 
            if(user){
             let userInfo = await database.dbGetUserBankDetails(user)
            if(userInfo.status){
                userInfo.userData = user
                res.status(200).json(userInfo)
            }else{
                res.status(200).json(false)
            }   
            }else{
                res.status(200).json(false)
            }
            
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateBankInfo:async(req,res)=>{
        try {
            const {bankInfo,rollNo} = req.body;
            let result = await database.dbUpdateBankInfo(bankInfo,rollNo);
            if(result) res.status(200).json(true);
            else throw new Error;
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      createAbout:async(req,res)=>{
        try {
            const {modelerEmail,aboutTxt} = req.body;
            let result = await database.dbCreateAbout(modelerEmail,aboutTxt);
            if(result){
                res.status(200).json(true);
            }else{
                throw new Error
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getQAForPofile:async(req,res)=>{
        try {
        const email = req.params.email;
        let QA = credentials.find(obj => obj.email == email);
        if(QA) res.status(200).json(QA) ;
        else throw new Error;
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        } 
      },

      getAllModelListForModeler:async(req,res)=>{
        try {
            console.log("adsfadfa");
            const {modelerId} = req.params;
            const result = await database.dbGetAllModelListForModeler(modelerId);
            if(result){
                res.status(200).json(result);
            }else{
                throw new Error("model list for modeler not found!!");
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      AgetClientById:async(req,res)=>{
        try {
            console.log("Asdfasdfasdfasdfasdf");
            const {clientId} = req.params;
            console.log("asdfasdfasdf");
            console.log({clientId});
            let result = await database.AdbGetClientById(clientId);
            if(result) res.status(200).json(result);
            else throw new Error("something wwent wrong while fetching client!!");
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      editCorrection:async(req,res)=>{
        try {
            const imageFile = req.files?.image;
            const {text,clientId,articleId,version,hotspotId,clientName} = req.body;
            let result = await database.dbEditCorrection({text,clientId,articleId,version,hotspotId});
            if(result.status){
                if(imageFile != null){
                  imageFile.mv(`./public/corrections/${clientName}/${articleId}/version-${version}/${result.id}.jpg`,(err,data)=>{
                    if(!err){
                        res.status(200).json(true);
                    }else{
                        throw new Error(err)
                    }
                });  
                } else{
                    res.status(200).json(true)
                }
            }else if(result.msg){
                res.status(200).json(false)
            }else{
                throw new Error('edit correction in database went wrong!!')
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false); 
        }
      },

      editExistingCorrection:async(req,res)=>{
        try {
            let data = req.body;
            console.log(data);
            let count = 0;
            let firstElement = 0;
            let images = req.files
            let shouldBreak = false;
            console.log(images);
            for(let key in data){
                if(!shouldBreak){
                    count ++
                    console.log({key});
                    let objString = data[key];
                    let item = JSON.parse(objString); 
                    if(count == 1){
                        firstElement = item
                    }
                    console.log({item});
                    if(item.edited){
                    let saveCorrection = await database.dbEditExistingCorrection(item,count,firstElement);
                    if(saveCorrection.status){
                    if(images != null){
                        fs.mkdirSync(`./public/corrections/${item.clientName}/${item.articleId}/version-${item.version}`,{recursive:true});
                        let image = images[`image${count}`];
                        console.log({image});
                        if(image != null){
                        image.mv(`./public/corrections/${item.clientName}/${item.articleId}/version-${item.version}/${item.hotspotName}.jpg`,(err,data)=>{
                            if(!err){
                                console.log("uploaded");
                            }else{
                                throw new Error('correction image uploading failed')
                            }
                        })   
                        }  
                    }   
                    } else if(saveCorrection.msg == "time exceeded"){
                        shouldBreak = true;
                    }
                    }  
                }    
            }
            if(shouldBreak){
               res.status(200).json(false); 
            }else{
                res.status(200).json(true);
            } 
            } catch (error) {
                console.log(error);
                res.status(500).json(false)
            }
      },

      deleteCorrection:async(req,res)=>{
        try {
            const {hotspotName,clientName,articleId,version,clientId} = req.body;
            let result = await database.dbDeleteHotspot(hotspotName,articleId,clientId)
            if(result.msg == 'Deleted'){
                let filePath = `./public/corrections/${clientName}/${articleId}/version-${version}/${hotspotName}.jpg`;
                if(fs.existsSync(filePath)){
                    fs.unlinkSync(filePath,(err,data)=>{
                    if(!err){
                        console.log("correction deleted from direcotry");
                    }else{
                        console.log(err);
                    }
                })
                }   
            }
            if(result.status){
                res.status(200).json(result.msg)
            }else{
                throw new Error("Hotsopt was not deleted!!")
            }
        } catch (error) {
           console.log(error);
           res.status(500).json(false); 
        }
      },

      createDeadLineForModeler:async(req,res)=>{
        try {
            let {date,status,modRoll,clientId,list} = req.body;
            const result = await database.dbCreateDeadLineForModeler({date,status,modRoll,clientId,list});
            if(result){
                res.status(200).json(true);
            }else{
                throw new Error("something went wrong while updating deadline for modeler")
            }
        }catch(error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateBonusForModeler:async(req,res)=>{
        try {
            let {flag,modRoll,clientId,list} = req.body;
            let result = await database.dbUpdateBonusForModeler(flag,modRoll,clientId,list);
            if(result){
                res.status(200).json(true)
            }else{
                throw new Error("bonus was not updated for modeler!!")
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getApprovedModelsForQa:async(req,res)=>{
        try {
            let {qaRollNo} = req.params;
            let models = await database.dbGetApprovedModelsForQa(qaRollNo);
            if(models){
                res.status(200).json(models);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getApprovedModelsForModeler:async(req,res)=>{
        try {
            let {modelerRollNo} = req.params;
            let models = await database.dbGetApprovedModelsForModeler(modelerRollNo);
            if(models){
                res.status(200).json(models);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateNotificationStatus:async(req,res)=>{
        try {
            const {clientId,articleId,modelerRollNo,version,status} = req.body;
            let result = await database.dbUpdateNotificationStatus({clientId,articleId,version,status,modelerRollNo});
            if(result){
                res.status(200).json(true);
            }else{
                res.status(500).json(false);
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      getNotificationForQA:async(req,res)=>{
        try {
            const {rollNo} = req.params;
            const notifications = await database.dbGetNotificationForQA(rollNo);
            if(notifications){
                res.status(200).json(notifications);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateNotificationForQA:async(req,res)=>{
        try {
            const {clientId,articleId} = req.body;
            const result = await database.dbUpdateNotificationForQA(clientId,articleId);
            if(result){
                res.status(200).json(true);
            }else{
                throw new Error("notification update for QA went wrong!!");
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateNotificationAdmin:async(req,res)=>{
        try {
           const {modelerId,clientId} = req.body;
           let result = await database.dbUpdateNotificationAdmin(modelerId,clientId);
           if(result){
            res.status(200).json(true);
           }else{
            throw new Error("something went wrong while updating the admin notification status")
           }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      rejectBonusEligibility:async(req,res)=>{
        try {
            const {modelerRollNo,list,clientId} = req.body;
            let rejectBonus = await database.dbRejectBonus(modelerRollNo,list,clientId);
            if(rejectBonus){
                res.status(200).json(true);
            }else{
                throw new Error("something went wrong while update bonus eligibility")
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateInvoicedList:async(req,res)=>{
        try {
            const invoiceList = req.body.invoiceList;
            for(let list of invoiceList){
                await database.dbUpdateInvoiceList(list);
            }
            console.log("promise completed");
            res.status(200).json(true);
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      addRequirement:async(req,res) =>{
        try {
            let {info,articleId,clientId} = req.body;
            let createInfo = await database.dbAddRequirement(info,articleId,clientId);
            if(createInfo){
                res.status(200).json(true);
            }else{
                throw new Error("something went wrong while updating aditional info");
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      createListRequirement:async(req,res) =>{
        try {
            let {info,clientId} = req.body;
            let createInfo = await database.dbCreateListRequirement(info,clientId);
            if(createInfo) {
                res.status(200).json(true);
            }else{
                throw new Error("something went wrong with the global requirement creation!!")
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
      },

      editGlobalRequirement:async(req,res)=>{
        try {
            let {info,clientId} = req.body;
            let updateInfo = await database.dbEditGlobalRequirement(info,clientId);
            if(updateInfo){
                res.status(200).json(true);
            }else{
                throw new Error;
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      deleteClient:async(req,res) =>{
        try {
            let clientId = req.params.clientId;
            let deleteClient = await database.dbDeleteClient(clientId);
            if(deleteClient){
                res.status(200).json(true);
            }else{
                throw new Error('Something went wrong with deleting the client!!')
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      },

      updateClientListInfo:async(req,res) =>{
        try {
            let {info,clientId,field,uniquefieldValue} = req.body;
            let updateList = await database.dbUpdateClientListInfo(info,clientId,field,uniquefieldValue);
            if(updateList){
                res.status(200).json(true);
            }else{
                throw new Error("something went wrong with missing info updation!!");
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(false);
        }
      }

}

