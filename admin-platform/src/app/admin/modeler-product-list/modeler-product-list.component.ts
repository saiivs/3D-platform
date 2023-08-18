import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-modeler-product-list',
  templateUrl: './modeler-product-list.component.html',
  styleUrls: ['./modeler-product-list.component.css']
})
export class ModelerProductListComponent implements OnInit,OnDestroy{

  constructor(private route:ActivatedRoute,private backEndService:BackendService,private notificationService :NotificationService){};

  modelerId:string = "";
  modelList:Array<any> = [];
  totalRecords!:number
  page:number = 1;
  serachForModel:string = "";
  subscriptionModelList!:Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
 
  ngOnInit(): void {
    try {
      this.subscription2 = this.route.params.subscribe((params)=>{
        this.modelerId = params['modelerId']
        this.subscriptionModelList = this.backEndService.getAllModelListForModeler(this.modelerId).subscribe((res)=>{
      console.log(res);
      this.modelList = res
      res[0].models.forEach((obj:any)=>{
        this.totalRecords = obj.models.length + this.totalRecords
      })
    })
      })
    } catch (error) {
      console.log(error);
    }
    this.subscription1 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  ngOnDestroy(): void {
    if(this.subscriptionModelList)this.subscriptionModelList.unsubscribe();
    if(this.subscription1)this.subscription1.unsubscribe();
    if(this.subscription2)this.subscription2.unsubscribe();
  }
}
