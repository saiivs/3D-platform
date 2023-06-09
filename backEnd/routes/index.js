var express = require('express');
var router = express.Router();
const routeHelper = require('../controls/routeHelper');
const auth = require('../controls/middleware')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//user login
router.post('/api/login',routeHelper.userLogin);

//user authentication
router.post('/api/AuthUser',routeHelper.checkUser);

//create the product list
router.post('/api/productList/post',auth.authentication,routeHelper.createPro);

//Get the list of clients
router.get('/api/clients/Get',auth.authentication,routeHelper.getClients);

//get the list of products
router.get('/api/products/get/:id',auth.authentication,routeHelper.getPro);

//get 3d modelers
router.get('/api/modalers/Get',auth.authentication,routeHelper.getModelres);

//assign products for 3D modalers
router.post('/api/assignedProducts/post',auth.authentication,routeHelper.assignProducts);

//get the client list for modalers
router.get('/api/clientsForModalers/Get/:email',auth.authentication,routeHelper.getClientForModaler);

//get the assigned products for modalers
router.get('/api/modaler-products/Get/:id',auth.authentication,routeHelper.getModalerPro);

//save the modaler uploaded file
router.post('/api/upload-modal/post',auth.authentication,routeHelper.savemodalFile);

//get clients for QA
router.get('/api/clientsForQa/Get/:email',auth.authentication,routeHelper.getClientsForQa);

//get product list for QA
router.get('/api/Qa-products/Get/:id',auth.authentication,routeHelper.getQaPro);

//create comment by qa
router.post('/api/QaComments/post',auth.authentication,routeHelper.createCommentQa);

//get the comments of qa
router.get('/api/QaComments/Get/:clientId/:articleId',auth.authentication,routeHelper.getQaComments);

//approve the modal
router.post('/api/approveModal/post',auth.authentication,routeHelper.approveModal);

//create admin comments
router.post('/api/adminComment/post',auth.authentication,routeHelper.createAdminComments);

//get the admin comments
router.get('/api/adminComments/Get/:clientId/:articleId',auth.authentication,routeHelper.getAdminComments);

//reject the modal and update status
router.post('/api/rejectModal/post',auth.authentication,routeHelper.rejectModal);

//admin approve modal
router.post('/api/adminAprroveModal/post',auth.authentication,routeHelper.adminApproveModal);

//push the modeler comments
router.post('/api/ModelerComments/post',auth.authentication,routeHelper.createModalerComment);

//get the total approved models of modelers in every month
router.get('/api/modelerStatus/Get',auth.authentication,routeHelper.getModelerMonthlyStatus);

//get status for admin with submited data
router.get('/api/statusDate/Get/:date',auth.authentication,routeHelper.getstatusDate);

//set the manager of the client.
router.post('/api/SetManager/post',auth.authentication,routeHelper.setClientManager);

//set the dead line.
router.post('/api/setDeadLine/post',auth.authentication,routeHelper.setDeadline);

//update  the price of the  model/updatePrice/post
router.post('/api/updatePrice/post',auth.authentication,routeHelper.updateModelPrice);

//update the monthly budget
router.post('/api/createBudget/post',auth.authentication,routeHelper.createBudget);

//get the client list and the total amount spent for the models
router.get('/api/getClientsExpense/get',auth.authentication,routeHelper.getClientExpense);

//update the refference of the model
router.post('/api/updateReff/post',auth.authentication,routeHelper.updateReff);

//get the data for notification
router.get('/api/NotificationData/get/:userRoll/:rollNo/:flag',auth.authentication,routeHelper.getNotifications);

//get the progress of the modeler for a specific client.
router.get('/api/getProgress/get/:clientId',auth.authentication,routeHelper.getProgress);

//get more details from the glb file for fullscreen mode
router.get('/api/getGlbDetails/get/:articleId/:clientId',auth.authentication,routeHelper.getGlbFileDetails);

//get notification for admin
router.get('/api/notification_Admin/get/:status',auth.authentication,routeHelper.getNotificationsAdmin);

//generate the data for invoice
router.get('/api/generateInvoice/get/:rollNo',auth.authentication,routeHelper.generateInvoice);

//create the bank details for modeler
router.post('/api/createBankDetails/post',auth.authentication,routeHelper.createBankDetails);

//store the invoice in database
router.post('/api/createInvoice/post',auth.authentication,routeHelper.createInvoice);

//update the exceeded status of the budget
router.post('/api/updateBudgetExceed/post',auth.authentication,routeHelper.updateBudgetExceed);

//create a tag name for the models
router.post('/api/createTags/post',auth.authentication,routeHelper.createTags);

//get the collection of tags for the admin
router.get('/api/getTags/get',auth.authentication,routeHelper.getTags);

//assign the tag name to the model
router.post('/api/assignTag/post',auth.authentication,routeHelper.assignTag);

//create the help line data
router.post('/api/createHelpLineData/post',auth.authentication,routeHelper.createHelpLine);

//get all the models of a modeler
router.get('/api/getAllModelsforModeler/get/:modelerId',auth.authentication,routeHelper.getAllModelsForModeler);

//save the png of the models
router.post('/api/saveModelPng/post',auth.authentication,routeHelper.savePng);

//create the requirement for the client.
router.post('/api/createRequirement/post',auth.authentication,routeHelper.createRequirement);

module.exports = router;
