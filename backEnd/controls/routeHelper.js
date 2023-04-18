const jwt = require('jsonwebtoken')
require('dotenv').config();

const  database = require("./dbQueries")

let credentials = [
    {
        email:"sai@gmail.com",
        name: 'Sai',
        password: process.env.ADMIN_PASS,
        role:"admin"
    },
    {
        email:"victor@charpstar.com",
        name:"victor",
        password: process.env.QA_VICTOR,
        role:"QA",
        rollNo :"QA5"
    },
    {
        email:"roney@charpstar.com",
        name: "Roney",
        password: process.env.QA_RONEY,
        role:"QA",
        rollNo : "QA1"
    },
    {
        email:"partha@charpstar.com",
        name: "Partha Kalyan",
        password: process.env.PARTHA_3D,
        role:"3D",
        rollNo:"4"
    },
    {
        email:"sai@charpstar.com",
        rollNo : "3",
        name : "Sai Krishna",
        role:"3D",
        password:process.env.SAI_3D
    },
    {
        email:'shreyas@charpstar.com',
        rollNo : "QA4",
        name: "Shreyas",
        role:"QA",
        password:process.env.QA_SHREYAS
    },
    {
        email:'Richard@charpstar.com',
        rollNo:'1',
        name:'Richard',
        role:'3D',
        password:process.env.RICHARD_3D
    }
]

let modalers = [
    {
        email:'Richard@charpstar.com',
        rollNo: "1",
        name:'Richard'
    },
    {
        email:"sai@charpstar.com",
        rollNo : "3",
        name : "Sai Krishna",
    },
    {
        email:"partha@charpstar.com",
        rollNo : "4",
        name : "Partha Kalyan",
    }
]

let QATeams = [
    {
        rollNo : "QA1",
        name: "Roney"
    },
    {
        rollNo : "QA3",
        name: "Urvee Shrivastava"
    },
    {
        rollNo : "QA4",
        name: "Shreyas"
    },
    {
        rollNo : "QA5",
        name: "victor"
    }
]

module.exports = {
    userLogin:async(req,res)=>{
        let userEmail = req.body.email;
        let getUser = credentials.find(user => user.email == userEmail);
        console.log(getUser);
        if(getUser){
            let passTrue = getUser.password == req.body.password ? true :false;
            if(passTrue) {
                let role = getUser.role
                getUserJson = JSON.stringify(getUser);
                let accessToken = await jwt.sign(getUserJson,process.env.ACC_TOKEN_SECRET);
                res.json({token:accessToken,userRole:role,userEmail:getUser.email})
            }else{
                res.json({password:true})
            }
        }else{console.log("user not found");
            res.json({userExist:true})
        }
    },

    checkUser:(req,res)=>{
        let header = req.headers['authorise'];
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
        let {Client,proList} = req.body
        console.log(Client);
        let clientInfo = await database.dbcreateClient(Client[0]);
        console.log({clientInfo});
        if(clientInfo){
            let id = clientInfo._id.toString()
            let proListInfo = await database.dbcreatePro(proList,id);
            console.log({proListInfo});
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
            console.log("routefun pro");
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

    getModelres:(req,res)=>{
        try {
            res.status(200).json({modalersAr:modalers,QAarr:QATeams})
        } catch (error) {
           res.status(500).json(false) 
        }  
    },

    assignProducts:async(req,res)=>{
        try {
            let rollNo = req.body.rollNo;
            let QaRollNo = req.body.QaRoll
            let modalerName = modalers.find(obj => obj.rollNo == rollNo)
            let QAname = QATeams.find(obj => obj.rollNo == QaRollNo)
           let resData = await database.assignPro(req.body,modalerName.name,QAname.name)
           if(resData){
            res.status(200).json(true)
           }else{
                throw new Error
           }
        } catch (error) {
            console.log(error);
            res.status(500).json(false)
        }
    },

    getClientForModaler:async(req,res)=>{
        try {
            let email = req.params.email;
            let modaler = modalers.find(obj => obj.email == email)
            let clients = await database.dbGetClientForModaler(modaler.rollNo);
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
            let id = req.params.id;
            console.log(id);
            let assignedPro = await database.dbGetAssignedPro(id);
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
        if(file){
            let status = "Uploaded"
            let data = await database.dbupdateProductStatus(req.body,status);
            if(data){
                file.mv(`./public/modals/${req.body.id}&&${req.body.clientId}.glb`,(err,data)=>{
                    if(err){
                        throw new Error
                    }else{
                        console.log("uploaded");
                        res.status(200).json(true)
                    }
                })
            }
        } 
        } catch (error) {
            console.log(error);
            res.status(500).status(500).json(false)
        }   
    },

    getClientsForQa:async(req,res)=>{
        try {
            let userEmail = req.params.email;
            let Qa = credentials.find(obj => obj.email == userEmail);
            let clients = await database.dbGetClientsForQa(Qa.rollNo);
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
            let Id = req.params.id;
            let products = await database.dbGetQaPro(Id)
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
           console.log(req.body);
            let cmnt = await database.dbCreateComntQa(req.body);
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
        let getData = await database.dbGetQaComments(clientId,articleId);
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
            let {clientId,articleId,status} = req.body;
            let update = await database.dbAprroveModal(clientId,articleId,status);
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
    }
}