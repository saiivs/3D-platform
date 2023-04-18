import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { user , userRes, client, products, team, message, modelerLanding, QaLanding} from '../models/interface'
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Types } from 'mongoose';



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

  emitModalerName$ = new BehaviorSubject<string>(localStorage.getItem('modalerName')||"default value");
  currModeler = this.emitModalerName$.asObservable();

  emitQaName$ = new BehaviorSubject<string>(localStorage.getItem('QaName')||"default value");
  currQa = this.emitQaName$.asObservable();

  emitModelDetailsAdmin$ = new BehaviorSubject<string>(localStorage.getItem('adminModeler')||'default value');
  adminCurrModeler = this.emitModelDetailsAdmin$.asObservable()

  emitProNameDetailsAdmin$ = new BehaviorSubject<string>(localStorage.getItem('adminPro')||'default value');
  adminCurrProName = this.emitProNameDetailsAdmin$.asObservable()
  
//error handling function which redirects the user to the error page "**"
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

  createProduct(proList:any,Client:any):Observable<any>{
    return this.http.post<any>(`${this.url}/productList/post`,{proList,Client}).pipe((catchError(this.erroHandler)));
  }

  getClient():Observable<client[]>{
    return this.http.get<client[]>(`${this.url}/clients/Get`).pipe((catchError(this.erroHandler)))
  }

  getProlist(id:any):Observable<products[]>{
    return this.http.get<products[]>(`${this.url}/products/get/${id}`).pipe((catchError(this.erroHandler)))
  }

  getModalers():Observable<team>{
    return this.http.get<team>(`${this.url}/modalers/Get`).pipe((catchError(this.erroHandler)))
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
    localStorage.setItem("modalerName",modelerName)
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
    localStorage.setItem('adminPro',proName)
  }

  getClientsForModaler():Observable<modelerLanding[]>{
    let userEmail = localStorage.getItem('userEmail')
    return this.http.get<modelerLanding[]>(`${this.url}/clientsForModalers/Get/${userEmail}`).pipe((catchError(this.erroHandler)))
  }

  getModalerPro(id:any):Observable<modelerLanding[]>{
    return this.http.get<modelerLanding[]>(`${this.url}/modaler-products/Get/${id}`).pipe((catchError(this.erroHandler)))
  }

  uploadModal(formData:FormData):Observable<any>{
    return this.http.post<any>(`${this.url}/upload-modal/post`,formData).pipe((catchError(this.erroHandler)))
  }

  getClientsForQa():Observable<QaLanding[]>{
    let userEmail = localStorage.getItem('userEmail')
    return this.http.get<QaLanding[]>(`${this.url}/clientsForQa/Get/${userEmail}`).pipe((catchError(this.erroHandler)))
  }

  getQaPro(Id:string):Observable<any>{
    return this.http.get<any>(`${this.url}/Qa-products/Get/${Id}`).pipe((catchError(this.erroHandler)))
  }

  pushComment(comment:string,clientId:string,articleId:string,user:any):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/QaComments/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }

  getQaComments(clientId:string,articleId:string):Observable<any>{
    return this.http.get<any>(`${this.url}/QaComments/Get/${clientId}/${articleId}`).pipe((catchError(this.erroHandler)))
  }

  approveModal(clientId:string,articleId:string,status:string):Observable<any>{
    return this.http.post<any>(`${this.url}/approveModal/post`,{clientId,articleId,status}).pipe((catchError(this.erroHandler)))
  }

  pushAdminComment(comment:string,clientId:string,articleId:string,user:any):Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/adminComment/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }

  getAdminComment(clientId:string,articleId:string):Observable<message>{
    return this.http.get<message>(`${this.url}/adminComments/Get/${clientId}/${articleId}`).pipe((catchError(this.erroHandler)))
  }

  AdminApproveModal(clientId:string,articleId:string):Observable<any>{
    return this.http.post<any>(`${this.url}/adminAprroveModal/post`,{clientId,articleId}).pipe((catchError(this.erroHandler)))
  }

  rejectModal(clientId:string,articleId:string):Observable<any>{
    return this.http.post<any>(`${this.url}/rejectModal/post`,{clientId,articleId}).pipe((catchError(this.erroHandler)))
  }

  updateAssListStatus():Observable<any>{
    return this.http.post<any>(`${this.url}/updateAssListStatus/post`,{}).pipe((catchError(this.erroHandler)))
  }

  pushModelerComment(comment:string,clientId:string,articleId:string,user:any):Observable<any>{
    return this.http.post<boolean>(`${this.url}/ModelerComments/post`,{comment,clientId,articleId,user}).pipe((catchError(this.erroHandler)))
  }
}
