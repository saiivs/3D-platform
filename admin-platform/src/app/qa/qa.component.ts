import { Component, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { NotificationService } from "../services/notification.service";
import { BackendService } from "../services/backend.service";
import { Subscription } from "rxjs";

@Component({
  selector: "qa-root",
  templateUrl: "./qa.component.html",
  styleUrls: ["./qa.component.css"]
})

export class QaComponent implements OnInit,OnDestroy{

  title = 'QA';
  userName!:string|null;
  notifyData:Array<any> = [];
  notificationLen:number = 0;
  helpNotification:Array<any> = [];
  seeMoreToggle:boolean = true;
  blueIndicator:boolean = false;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  
  constructor(private titleService:Title,private route:Router,private notficationService:NotificationService,private backEndService: BackendService){

  }

  ngOnInit() {
    this.titleService.setTitle(this.title);
    this.userName = localStorage.getItem("userName");
    this.subscription1 = this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
      this.subscription2 = this.notficationService.notification_QA.subscribe((res)=>{
      let count = 0;
      if(res.length != 0){ 
        this.notifyData = res
        this.blueIndicator = true;
        this.notifyData.forEach((obj) =>{
         count += obj.assignedPro.length;
        })
        this.notificationLen = count;
        }else{
        this.blueIndicator = false;
      }   
    })
    })
  }

  viewUploadedModel(clientId:string,articleId:string,version:number,modelIndex:number,clientIndex:number){
    console.log("exicuting");
    
    this.notifyData[clientIndex].assignedPro[modelIndex].QAView = true;
    let count = 0;
    this.notifyData.forEach((obj) =>{
      for(let model of obj.assignedPro){
        if(!model.QAView){
          count += 1
        }
      } 
     })
     this.notificationLen = count;
    this.subscription3 = this.backEndService.updateNotificationViewForQA(clientId,articleId).subscribe((res)=>{});
    console.log("exicutetddsdfasdfasdf");
    
    this.route.navigate(["QA/reviews",articleId,clientId,version])
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
  }

}
