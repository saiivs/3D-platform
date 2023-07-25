import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { user , userRes, client, products, team, message, modelerLanding, QaLanding, clientandBudget} from '../models/interface'
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Types } from 'mongoose';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';



@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http:HttpClient,private router:Router) {   }

  readonly url = environment.apiUrl;

  emitClientName$ = new BehaviorSubject<string>(localStorage.getItem('clientName')||"default value");
  currentData = this.emitClientName$.asObservable();

  emitProductName$ = new BehaviorSubject<string>(localStorage.getItem('ProductName')||"default value");
  currProName = this.emitProductName$.asObservable();

  emitModalerName$ = new BehaviorSubject<string>(localStorage.getItem('modelerName')||"default value");
  currModeler = this.emitModalerName$.asObservable();

  emitModelerRollNo$ = new BehaviorSubject<string>(localStorage.getItem('modRollNo')||"default value");
  modRollNo = this.emitModelerRollNo$.asObservable();

  emitQaName$ = new BehaviorSubject<string>(localStorage.getItem('QaName')||"default value");
  currQa = this.emitQaName$.asObservable();

  emitModelDetailsAdmin$ = new BehaviorSubject<string>(localStorage.getItem('adminModeler')||'default value');
  adminCurrModeler = this.emitModelDetailsAdmin$.asObservable()

  emitProNameDetailsAdmin$ = new BehaviorSubject<string>(localStorage.getItem('ProductName')||'default value');
  adminCurrProName = this.emitProNameDetailsAdmin$.asObservable()
  
//error handling function which redirects the user to the error page "*"
  erroHandler = (error: HttpErrorResponse)=> {
    let message;
    switch (error.status) {
      case 400:
        message = 'Bad Request';
        break;
      case 401:
        message = 'Unauthorized';
        break;
      case 403:
        message = 'Forbidden';
        break;
      case 404:
        message = 'Not Found';
        break;
      case 500:
        message = 'Internal Server Error';
        break;
      default:
        message = 'An error occurred';
    }
    this.router.navigate(['/error'],{queryParams:{message,statusCode:error.status}});
    return throwError(error.message || 'server Error');
  }

  userLogin(data:user):Observable<userRes>{
    return this.http.post<userRes>(`${this.url}/login`,data).pipe((catchError(this.erroHandler)))

  }

  checkUser():Observable<any>{
    return this.http.post<any>(`${this.url}/AuthUser`,{}).pipe((catchError(this.erroHandler)))
  }

  getToken(){
    return localStorage.getItem('userToken')||" "
  }

  createProduct(proList:any,client:any):Observable<any>{
    return this.http.post<any>(`${this.url}/productList/post`,{proList,client}).pipe((catchError(this.erroHandler)));
  }

  getClient():Observable<clientandBudget>{
    return this.http.get<clientandBudget>(`${this.url}/clients/Get`).pipe((catchError(this.erroHandler)))
  }

  getProlist(id:any):Observable<any>{
    return this.http.get<products[]>(`${this.url}/products/get/${id}`).pipe((catchError(this.erroHandler)))
  }

  getModalers():Observable<team>{
    return this.http.get<team>(`${this.url}/modelers/Get`).pipe((catchError(this.erroHandler)))
  }

  assignedPro(products:Array<any>,rollNo:string,clientId:Types.ObjectId,QaRoll:string):Observable<any>{
    return this.http.post<any>(`${this.url}/assignedProducts/post`,{products,rollNo,clientId,QaRoll}).pipe((catchError(this.erroHandler)))
  }

  //Behavior Subject for client name
  getClientName(clientName:string){
    this.emitClientName$.next(clientName)
    localStorage.setItem('clientName',clientName);
  }

  //behaviour subject for product name
  getProName(proName:string){
   this.emitProductName$.next(proName);
   localStorage.setItem('ProductName',proName)
  }

  //behaviour subject for modeler name
  getModelerName(modelerName:string){
    this.emitModalerName$.next(modelerName);
    localStorage.setItem("modelerName",modelerName)
  }

  getModRollNo(rollNo:string){
    this.emitModelerRollNo$.next(rollNo);
    localStorage.setItem("modRollNo",rollNo);
  }

  getQaName(QaName:string){
    this.emitQaName$.next(QaName);
    localStorage.setItem('QaName',QaName)
  }

  getAdminModeler(modelerName:string){
    this.emitModelDetailsAdmin$.next(modelerName);
    localStorage.setItem('adminModeler',modelerName)
  }

  getAdminPro(proName:string){
    this.emitProNameDetailsAdmin$.next(proName);
    localStorage.setItem('ProductName',proName)
  }

  getClientsForModaler():Observable<modelerLanding[]>{
    let userEmail = localStorage.getItem('userEmail')
    return this.http.get<modelerLanding[]>(`${this.url}/clientsForModalers/Get/${userEmail}`).pipe((catchError(this.erroHandler)))
  }

  getModalerPro(id:any):Observable<modelerLanding[]>{
    return this.http.get<modelerLanding[]>(`${this.url}/modeler-products/Get/${id}`).pipe((catchError(this.erroHandler)))
  }

  uploadModal(formData:FormData):Observable<any>{
    return this.http.post<any>(`${this.url}/upload-modal/post`,formData).pipe((catchError(this.erroHandler)))
  }

  getClientsForQa():Observable<any>{
    let userEmail = localStorage.getItem('userEmail')
    return this.http.get<any>(`${this.url}/clientsForQa/Get/${userEmail}`).pipe((catchError(this.erroHandler)))
  }

  getQaPro(Id:string):Observable<any>{
    return this.http.get<any>(`${this.url}/Qa-products/Get/${Id}`).pipe((catchError(this.erroHandler)))
  }

  pushComment(comment:string,clientId:string,articleId:string,user:any):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/QaComments/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }

  getQaComments(clientId:string,articleId:string,version:number):Observable<any>{
    return this.http.get<any>(`${this.url}/QaComments/Get/${clientId}/${articleId}/${version}`).pipe((catchError(this.erroHandler)))
  }

  approveModal(clientId:string,articleId:string,status:string,rollNo:string|null,modelerName:string,correction:string = "",modelName:string = "",modelerRollNo:string):Observable<any>{
    return this.http.post<any>(`${this.url}/approveModal/post`,{clientId,articleId,status,rollNo,modelerName,correction,modelName,modelerRollNo}).pipe((catchError(this.erroHandler)))
  }

  pushAdminComment(comment:string,clientId:string,articleId:string,user:any):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/adminComment/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }

  getAdminComment(clientId:string,articleId:string):Observable<any>{
    return this.http.get<message>(`${this.url}/adminComments/Get/${clientId}/${articleId}`).pipe((catchError(this.erroHandler)))
  }

  AdminApproveModal(clientId:string,articleId:string|undefined):Observable<any>{
    return this.http.post<any>(`${this.url}/adminAprroveModal/post`,{clientId,articleId}).pipe((catchError(this.erroHandler)))
  }

  rejectModal(clientId:string,articleId:string|undefined):Observable<any>{
    return this.http.post<any>(`${this.url}/rejectModal/post`,{clientId,articleId}).pipe((catchError(this.erroHandler)))
  }

  updateAssListStatus():Observable<any>{
    return this.http.post<any>(`${this.url}/updateAssListStatus/post`,{}).pipe((catchError(this.erroHandler)))
  }

  pushModelerComment(comment:string,clientId:string,articleId:string,user:any):Observable<any>{
    return this.http.post<boolean>(`${this.url}/ModelerComments/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }

  getModelersStatus():Observable<any>{
    return this.http.get<any>(`${this.url}/modelerStatus/Get`).pipe((catchError(this.erroHandler)))
  }

  submitDate(date:string):Observable<any>{
    return this.http.get<any>(`${this.url}/statusDate/Get/${date}`).pipe((catchError(this.erroHandler)))
    }

  addClientManager(name:string,clientId:any):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/SetManager/post`,{name,clientId}).pipe((catchError(this.erroHandler)))
  }

  setDeadLine(date:string,clientId:any,type:string):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/setDeadLine/post`,{date,clientId,type}).pipe((catchError(this.erroHandler)))
  }

  updatePrice(price:number,clientId:Types.ObjectId,articleId:string,modelerRollNo:string,budgetExceed:string):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/updatePrice/post`,{price,clientId,articleId,modelerRollNo,budgetExceed}).pipe((catchError(this.erroHandler)))
  }

  createBudget(budgetPrice:number):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/createBudget/post`,{budgetPrice}).pipe((catchError(this.erroHandler)))
  }

  getClientandExpense():Observable<any>{
    return this.http.get<any>(`${this.url}/getClientsExpense/get`).pipe((catchError(this.erroHandler)))
  }

  updateRefference(url:string,articleId:string,clientId:Types.ObjectId,ProductName:string):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/updateReff/post`,{url,articleId,clientId,ProductName}).pipe((catchError(this.erroHandler)))
  }

  getNotificationData(rollNo:string|null,flag:string):Observable<any>{
    return this.http.get<any>(`${this.url}/NotificationData/get/${rollNo}/${flag}`).pipe((catchError(this.erroHandler)));
  }

  getModelersProgress(clientId:Types.ObjectId):Observable<any>{
    return this.http.get<any>(`${this.url}/getProgress/get/${clientId}`).pipe((catchError(this.erroHandler)));
  }

  getGlbFileDetails(articleId:String,clientId:string,version:number):Observable<any>{
    return this.http.get<any>(`${this.url}/getGlbDetails/get/${articleId}/${clientId}/${version}`).pipe((catchError(this.erroHandler)))
  }

  getNotificationForAdmin(status:string):Observable<any>{
    return this.http.get<any>(`${this.url}/notification_Admin/get/${status}`).pipe((catchError(this.erroHandler)));
  }

  generateInvoice(rollNo:string|null):Observable<any>{
    return this.http.get<any>(`${this.url}/generateInvoice/get/${rollNo}`).pipe((catchError(this.erroHandler)))
  }

  getBankDetails(bankDetials:any,rollNo:string):Observable<any>{
    return this.http.post<any>(`${this.url}/createBankDetails/post`,{bankDetials,rollNo}).pipe((catchError(this.erroHandler)))
  }

  saveModelerInvoice(file:any):Observable<any>{
    return this.http.post<any>(`${this.url}/createInvoice/post`,file).pipe((catchError(this.erroHandler)))
  }

  updateBudgetExceed():Observable<any>{
    return this.http.post<any>(`${this.url}/updateBudgetExceed/post`,{status:true}).pipe((catchError(this.erroHandler)))
  }

  createTags(tagName:string):Observable<any>{
    return this.http.post<any>(`${this.url}/createTags/post`,{tagName}).pipe((catchError(this.erroHandler)));
  }

  getTagCollections():Observable<any>{
    return this.http.get<any>(`${this.url}/getTags/get`).pipe((catchError(this.erroHandler)))
  }

  assignTag(tagName:string,articleId:string,clientId:any):Observable<any>{
    return this.http.post<any>(`${this.url}/assignTag/post`,{tagName,articleId,clientId}).pipe((catchError(this.erroHandler)));
  }

  helpLine(modelerRollNo:string|null,articleId:string,clientId:any):Observable<any>{
    return this.http.post<any>(`${this.url}/createHelpLineData/post`,{modelerRollNo,articleId,clientId}).pipe((catchError(this.erroHandler)))
  }

  getAllModelsOfModeler(modelerId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getAllModelsforModeler/get/${modelerId}`).pipe((catchError(this.erroHandler)))
  }

  sendpngOfModel(file:any):Observable<any>{
    return this.http.post<any>(`${this.url}/saveModelPng/post`,file).pipe((catchError(this.erroHandler)));
  }

  saveRequirement(requirement:string,clientId:any):Observable<any>{
    return this.http.post(`${this.url}/createRequirement/post`,{requirement,clientId});
  }

  scrapeImages(link:string,productName:string,articleId:string,clientName:string):Observable<any>{
    return this.http.post<any>(`${this.url}/scrapeImages/post`,{link,productName,articleId,clientName});
  }

  getScrapedImg(articleId:string,productName:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getScrapedImgs/get/${articleId}/${productName}`);
  }

  getClientDetailsById(clientId:any,articleId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getClientById/get/${clientId}/${articleId}`)
  }

  uploadReferenceManually(formData:FormData,articleId:string,clientName:string):Observable<any>{
    formData.append('articleId', articleId);
    formData.append('clientName', clientName);
    return this.http.post<any>(`${this.url}/uploadRefManuall/post`,formData);
  }

  createHotSpot(hotspotName:string,normal:string,position:string,articleId:string,clientId:string,nor:string):Observable<any>{
    return this.http.post<any>(`${this.url}/createHotspot/post`,{hotspotName,normal,position,articleId,clientId,nor});
  }

  checkForHotspots(clientId:string,articleId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getHotspots/get/${clientId}/${articleId}`)
  }

  getLatestCorrection(clientId:string,articleId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getLatestCorrection/get/${clientId}/${articleId}`)
  }

  updateHotspotCorrections(correctionData:Array<any>):Observable<any>{
    return this.http.post<any>(`${this.url}/updateHotspot/post`,correctionData)
  }

  updateHotspotCorrectionImg(formData:FormData):Observable<any>{
    return this.http.post<any>(`${this.url}/updateHotspotImg/post`,formData);
  }

  getClientDetailsForQADo(clientId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getClientForQADo/get/${clientId}`);
  }

  getHotspotwithVersion(version:number,clientId:string,articleId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getHotspotWithId/get/${version}/${clientId}/${articleId}`);
  }

  updateModelUnderQa(clientId:string,articleId:string,flag:boolean):Observable<any>{
    return this.http.post<any>(`${this.url}/updateModelUnderQA/post`,{clientId,articleId,flag})
  }

  getUserDetailsForProfile(userEmail:string|null):Observable<any>{
    return this.http.get<any>(`${this.url}/getUserDetailsForProfile/get/${userEmail}`)
  }

  updateBankDetails(bankInfo:any,rollNo:string|null):Observable<any>{
    return this.http.post<any>(`${this.url}/updateBankDetails/post`,{bankInfo,rollNo})
  }

  createAboutforModeler(modelerEmail:string,aboutTxt:string):Observable<any>{
    return this.http.post<any>(`${this.url}/createAbout/post`,{modelerEmail,aboutTxt})
  }

  getQAForProfile(userEmail:string|null):Observable<any>{
    return this.http.get<any>(`${this.url}/getQAForProfile/get/${userEmail}`)
  }

  getAllModelListForModeler(modelerId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/getAllModelListForModeler/${modelerId}`)
  }
}

