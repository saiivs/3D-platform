import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
 
  url: any;
  readonly serverURL = environment.apiUrl;
  constructor(private http:HttpClient) { }
  notifyData!:Observable<any>;

  search$ = new BehaviorSubject<string>("")
  searchValue = this.search$.asObservable();

  enableSearchBarForProductPage$ = new BehaviorSubject<Boolean>(false);
  enableSearch = this.enableSearchBarForProductPage$.asObservable();

  //notification for modeler
  notificationData$ = new BehaviorSubject<any>([]);
  notificationSubject = this.notificationData$.asObservable()

  getNotificationData(rollNo:string|null,flag:string):Observable<any>{
    return this.http.get<any>(`${this.serverURL}/NotificationData/get/${rollNo}/${flag}`); 
  }

  setNotificationDAta(data:Array<any>){
    this.notificationData$.next(data);
  }

  //notification for QA
  notification_QA$ = new BehaviorSubject<any>([]);
  notification_QA = this.notification_QA$.asObservable();

  getNotificationForQA(rollNo:string|null):Observable<any>{
    return this.http.get<any>(`${this.serverURL}/getNotificationForQA/get/${rollNo}`)
  }

  setNotificationForQA(data:Array<any>){
    this.notification_QA$.next(data);
  }

  //notification for admin
  notification_admin$ = new BehaviorSubject<any>([]);
  notification_admin = this.notification_admin$.asObservable();

  getNotificationForAdmin(status:string):Observable<any>{
    return this.http.get<any>(`${this.serverURL}/notification_Admin/get/${status}`)
  }

  setNotificationForAdmin(data:Array<any>){
    this.notification_admin$.next(data);
  }

  setSearchalue(data:string){
    this.search$.next(data)
  }

  checkUrlForSearchBtn(url:Boolean){
    this.enableSearchBarForProductPage$.next(url)
  }

  getNotifyData(){
    return this.notifyData
  }
}
