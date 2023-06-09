import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }
  notifyData:Array<any> = [];

  search$ = new BehaviorSubject<string>("")
  searchValue = this.search$.asObservable();

  enableSearchBarForProductPage$ = new BehaviorSubject<Boolean>(false);
  enableSearch = this.enableSearchBarForProductPage$.asObservable()

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
