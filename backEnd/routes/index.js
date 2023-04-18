var express = require('express');
var router = express.Router();
const routeHelper = require('../controls/routeHelper');
const auth = require('../controls/middleware')

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

//get the list of products
router.get('/products/get/:id',auth.authentication,routeHelper.getPro);

//get 3d modelers
router.get('/modalers/Get',auth.authentication,routeHelper.getModelres);

//assign products for 3D modalers
router.post('/assignedProducts/post',auth.authentication,routeHelper.assignProducts);

//get the client list for modalers
router.get('/clientsForModalers/Get/:email',auth.authentication,routeHelper.getClientForModaler);

//get the assigned products for modalers
router.get('/modaler-products/Get/:id',auth.authentication,routeHelper.getModalerPro);

//save the modaler uploaded file
router.post('/upload-modal/post',auth.authentication,routeHelper.savemodalFile);

//get clients for QA
router.get('/clientsForQa/Get/:email',auth.authentication,routeHelper.getClientsForQa);

//get product list for QA
router.get('/Qa-products/Get/:id',auth.authentication,routeHelper.getQaPro);

//create comment by qa
router.post('/QaComments/post',auth.authentication,routeHelper.createCommentQa);

//get the comments of qa
router.get('/QaComments/Get/:clientId/:articleId',auth.authentication,routeHelper.getQaComments);

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
router.post('/ModelerComments/post',auth.authentication,routeHelper.createModalerComment)

module.exports = router;
