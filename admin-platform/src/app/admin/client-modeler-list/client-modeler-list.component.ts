
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-client-modeler-list',
  templateUrl: './client-modeler-list.component.html',
  styleUrls: ['./client-modeler-list.component.css']
})
export class ClientModelerListComponent implements OnInit,OnDestroy {

  constructor(private backEnd: BackendService, private route: ActivatedRoute,private notificationService:NotificationService) {
  }

  modelerList: Array<any> = [];
  clientId: any = "";
  page:number = 1;
  totalRecords!:number;
  models:Array<any> = [];
  deadLineOne!:Date
  deadLineTwo!:Date;
  isChecked:Boolean = false; 
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  subscription6!:Subscription;

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId']
    this.subscription1 = this.backEnd.getModelersProgress(this.clientId).subscribe((res) => {
      if(res.length != 0){
        this.modelerList = [...res]
      this.modelerList = this.modelerList.map((obj) => {
        let count = 0;
        obj.models.forEach((model:any)=>{
          if(model.productStatus == 'Approved') count ++;
        })
        let percnt = (count / obj.totalProducts) * 100;
        percnt = Number((percnt).toFixed(2));
        let final = `${percnt}%`;
        return { ...obj, percentage: final }
      })
      this.totalRecords = this.modelerList.length;
      }  
    })
    
    
    this.subscription2 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  getDeadLineOne(event:Event,modRoll:string,index:number){
    let i = (this.page - 1) * 50 + index;
    let date = (event.target as HTMLInputElement).value
    this.modelerList[i].deadLineOne = date;
    let dateObj = new Date(date);
    this.subscription3 = this.backEnd.createModelerDeadLine(dateObj,"deadLineOne",modRoll,this.clientId).subscribe(()=>{});
  }

  getDeadLineTwo(event:Event,modRoll:string){
    let date = (event.target as HTMLInputElement).value
    let dateObj = new Date(date);
    this.subscription4 = this.backEnd.createModelerDeadLine(dateObj,"deadLineTwo",modRoll,this.clientId).subscribe(()=>{})
  }

  addBonus(event:Event,modelerId:string):void{
    let element = event.target as HTMLInputElement;
    if(element.checked){
      this.subscription5 = this.backEnd.updateBonus(true,modelerId,this.clientId).subscribe(()=>{})
    }else{
      this.subscription6 = this.backEnd.updateBonus(false,modelerId,this.clientId).subscribe(()=>{})
    }
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe()
    if(this.subscription6)this.subscription6.unsubscribe() 
  }
}
