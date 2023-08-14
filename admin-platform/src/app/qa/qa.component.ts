import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { NotificationService } from "../services/notification.service";
import { BackendService } from "../services/backend.service";

@Component({
  selector: "qa-root",
  templateUrl: "./qa.component.html",
  styleUrls: ["./qa.component.css"]
})

export class QaComponent implements OnInit{

  title = 'QA-Clients';
  userName!:string|null;
  notifyData:Array<any> = [];
  notificationLen:number = 0;
  helpNotification:Array<any> = [];
  seeMoreToggle:boolean = true;
  blueIndicator:boolean = false;

  constructor(private titleService:Title,private route:Router,private notficationService:NotificationService,private backEndService: BackendService){

  }

  ngOnInit() {
    this.titleService.setTitle(this.title);
    this.userName = localStorage.getItem("userName");
    this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
      this.notficationService.notification_QA.subscribe((res)=>{
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
    this.backEndService.updateNotificationViewForQA(clientId,articleId).subscribe((res)=>{});
    this.route.navigate(["QA/reviews",articleId,clientId,version])
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }

}
