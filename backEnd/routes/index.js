var express = require('express');
var router = express.Router();
const routeHelper = require('../controls/routeHelper');
const auth = require('../controls/middleware');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//user login
router.post('/login',routeHelper.userLogin);

//user authentication
router.post('/AuthUser',routeHelper.checkUser);

//create the product list
router.post('/productList/post',auth.authentication,routeHelper.createPro);

//Get the list of clients
router.get('/clients/Get',auth.authentication,routeHelper.getClients);

//get approved clients
router.get('/getApprovedclients/get',auth.authentication,routeHelper.getApprovedClients)

//get the list of products
router.get('/products/get/:id',auth.authentication,routeHelper.getPro);

//get 3d modelers
router.get('/modelers/Get',auth.authentication,routeHelper.getModelres);

//assign products for 3D modelers
router.post('/assignedProducts/post',auth.authentication,routeHelper.assignProducts);

//get the client list for modelers
router.get('/clientsForModalers/Get/:modRollNo',auth.authentication,routeHelper.getClientForModaler);

//get the assigned products for modelers
router.get('/modeler-products/Get/:id/:modRollNo',auth.authentication,routeHelper.getModalerPro);

//save the modeler uploaded file
router.post('/upload-modal/post',auth.authentication,routeHelper.savemodalFile);

//get clients for QA
router.get('/clientsForQa/Get/:qaRollNo',auth.authentication,routeHelper.getClientsForQa);

//get product list for QA
router.get('/Qa-products/Get/:id/:qaRollNo',auth.authentication,routeHelper.getQaPro);

//create comment by qa
router.post('/QaComments/post',auth.authentication,routeHelper.createCommentQa);

//get the comments of qa
router.get('/QaComments/Get/:clientId/:articleId/:version',auth.authentication,routeHelper.getQaComments);

//approve the modal
router.post('/approveModal/post',auth.authentication,routeHelper.approveModal);

//create admin comments
router.post('/adminComment/post',auth.authentication,routeHelper.createAdminComments);

//get the admin comments
router.get('/adminComments/Get/:clientId/:articleId',auth.authentication,routeHelper.getAdminComments);

//reject the modal and update status
router.post('/rejectModal/post',auth.authentication,routeHelper.rejectModal);

//admin approve modal
router.post('/adminAprroveModal/post',auth.authentication,routeHelper.adminApproveModal);

//push the modeler comments
router.post('/ModelerComments/post',auth.authentication,routeHelper.createModalerComment);

//get the total approved models of modelers in every month
router.get('/modelerStatus/Get',auth.authentication,routeHelper.getModelerMonthlyStatus);

//get status for admin with submited data
router.get('/statusDate/Get/:date',auth.authentication,routeHelper.getstatusDate);

//set the manager of the client.
router.post('/SetManager/post',auth.authentication,routeHelper.setClientManager);

//set the dead line.
router.post('/setDeadLine/post',auth.authentication,routeHelper.setDeadline);

//update  the price of the  model/updatePrice/post
router.post('/updatePrice/post',auth.authentication,routeHelper.updateModelPrice);

//update the monthly budget
router.post('/createBudget/post',auth.authentication,routeHelper.createBudget);

//get the client list and the total amount spent for the models
router.get('/getClientsExpense/get',auth.authentication,routeHelper.getClientExpense);

//update the refference of the model
router.post('/updateReff/post',auth.authentication,routeHelper.updateReff);

//get the data for notification
router.get('/NotificationData/get/:rollNo/:flag',auth.authentication,routeHelper.getNotifications);

//get the progress of the modeler for a specific client.
router.get('/getProgress/get/:clientId',auth.authentication,routeHelper.getProgress);

//get more details from the glb file for fullscreen mode
router.get('/getGlbDetails/get/:articleId/:clientId/:version',auth.authentication,routeHelper.getGlbFileDetails);

//get notification for admin
router.get('/notification_Admin/get/:status',auth.authentication,routeHelper.getNotificationsAdmin);

//generate the data for invoice
router.get('/generateInvoice/get/:rollNo',auth.authentication,routeHelper.generateInvoice);

//create the bank details for modeler
router.post('/createBankDetails/post',auth.authentication,routeHelper.createBankDetails);

//store the invoice in database
router.post('/createInvoice/post',auth.authentication,routeHelper.createInvoice);

//update the exceeded status of the budget
router.post('/updateBudgetExceed/post',auth.authentication,routeHelper.updateBudgetExceed);

//create a tag name for the models
router.post('/createTags/post',auth.authentication,routeHelper.createTags);

//get the collection of tags for the admin
router.get('/getTags/get',auth.authentication,routeHelper.getTags);

//assign the tag name to the model
router.post('/assignTag/post',auth.authentication,routeHelper.assignTag);

//create the help line data
router.post('/createHelpLineData/post',auth.authentication,routeHelper.createHelpLine);

//get all the models of a modeler
router.get('/getAllModelsforModeler/get/:modelerId',auth.authentication,routeHelper.getAllModelsForModeler);

//save the png of the models
router.post('/saveModelPng/post',auth.authentication,routeHelper.savePng);

//create the requirement for the client.
router.post('/createRequirement/post',auth.authentication,routeHelper.createRequirement);

//scraping the images for QA
router.post('/scrapeImages/post',auth.authentication,routeHelper.scrapeImg);

//get client details by id
router.get('/getClientById/get/:clientId/:articleId',auth.authentication,routeHelper.getClientById);

//get the count of reference images 
router.get('/getCountOfReference/get/:clientId/:articleId',auth.authentication,routeHelper.getCountOfReferenceImage)

//uploading the multiple reference images manually by the QA.
router.post('/uploadRefManuall/post',auth.authentication,routeHelper.uploadRefManuall);

//create a hotspot for 3D model
router.post('/createHotspot/post',auth.authentication,routeHelper.createHotspot);

//get the hotspots of specific model
router.get('/getHotspots/get/:clientId/:articleId',auth.authentication,routeHelper.getHotspots);

//updating the correction and image details in hotspot collection
router.post('/updateHotspotImg/post',auth.authentication,routeHelper.updateHotspotImg);

//get the clientDetails for the Qa do part
router.get('/getClientForQADo/get/:clientId',auth.authentication,routeHelper.getClientForQADo);

router.get('/getLatestCorrection/get/:clientId/:articleId',auth.authentication,routeHelper.getLatestHotspots);

//get latest correction for the modeler with time validation
router.get('/getLatestCorrectionForModeler/get/:clientId/:articleId',auth.authentication,routeHelper.getLatestCorrectionForModeler)

router.get('/getHotspotWithId/get/:version/:clientId/:articleId',auth.authentication,routeHelper.getHotspotById);

//update the model under the Qa to restrict the modeler
router.post('/updateModelUnderQA/post',auth.authentication,routeHelper.updateModelUnderQA);

//fetch the details of modeler/QA for profile
router.get('/getUserDetailsForProfile/get/:email',auth.authentication,routeHelper.getUserDetailsForProfile);

//update the bank details of modeler
router.post('/updateBankDetails/post',auth.authentication,routeHelper.updateBankInfo);

//create the about for the modeler
router.post('/createAbout/post',auth.authentication,routeHelper.createAbout);

//get the QA details for profile
router.get('/getQAForProfile/get/:email',auth.authentication,routeHelper.getQAForPofile);

//get all models of a specific modeler
router.get('/getAllModelListForModeler/:modelerId',auth.authentication,routeHelper.getAllModelListForModeler);

//get the client by id, can be used for only fetching the client
router.get('/AgetClientById/get/:clientId',auth.authentication,routeHelper.AgetClientById);

//check the edit is enabled or not for correction and update
router.post('/editCorrection/post',auth.authentication,routeHelper.editCorrection);

//edit the existing correction
router.post("/editExistingCorrection/post",auth.authentication,routeHelper.editExistingCorrection);

//delete correction from database and directory
router.post("/deleteCorrection/post",auth.authentication,routeHelper.deleteCorrection)

//create the deadline for the modeler
router.post('/createModelerDeadLine/post',auth.authentication,routeHelper.createDeadLineForModeler);

//update the bonus array for the modeler
router.post('/updateBonus/post',auth.authentication,routeHelper.updateBonusForModeler);

//get all the approved models for the QA
router.get('/getApprovedModelsForQa/get/:qaRollNo',auth.authentication,routeHelper.getApprovedModelsForQa);

//get all the approved models for the modeler
router.get('/getApprovedModelsForModeler/get/:modelerRollNo',auth.authentication,routeHelper.getApprovedModelsForModeler);

//update the viewed notofications for the modeler as true
router.post("/updateNotificationStatus/post",auth.authentication,routeHelper.updateNotificationStatus);

//get the notification data for the QA
router.get('/getNotificationForQA/get/:rollNo',auth.authentication,routeHelper.getNotificationForQA);

//update the notification view status for QA
router.post("/updateNotificationForQA/post",auth.authentication,routeHelper.updateNotificationForQA);

//update the notification view for admin
router.post('/updateNotificationViewForAdmin/post',auth.authentication,routeHelper.updateNotificationAdmin);

//reject the bonus eligibility fo the modeler.
router.post('/rejectBonusEligibility/post',auth.authentication,routeHelper.rejectBonusEligibility);

// update the invoice list in modelers list.
router.post('/updateInvoicedList/post',auth.authentication,routeHelper.updateInvoicedList)



module.exports = router;
