import { AfterContentInit, Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { NotificationService } from "../services/notification.service";
import { Subscriber } from "rxjs";
import { MatDialog } from '@angular/material/dialog';
import { BackendService } from "../services/backend.service";
import { CorrectionDilogComponent } from "../correction-dilog/correction-dilog.component";
import { correctionData } from "../models/interface";


@Component({
  selector: "modaler-root",
  templateUrl : "./modaler.component.html",
  styleUrls : ["./modaler.component.css"]
})

export class ModalerComponent implements OnInit{

  title = '3D_Modaler-Clients';
  notifyData:Array<any> = [];
  notificationLen:number = 0;
  helpNotification:Array<any> = [];
  seeMoreToggle:boolean = true;
  userName!:string|null;
  blueIndicator:boolean = false;

  constructor(private titleService:Title,private route:Router,private backEnd:BackendService,private notficationService:NotificationService){

  }

  ngOnInit() {
    this.titleService.setTitle("3D_Modaler-Clients");
    this.userName =localStorage.getItem("userName")||null
    this.notficationService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
      this.notficationService.setNotificationDAta(data);
      this.notficationService.notificationSubject.subscribe((res)=>{
        console.log({res});
        
      this.notifyData = [...res.data];  
      this.helpNotification = [...res.helpData]
      this.blueIndicator = this.notifyData.some(correction => correction.modelerView == false);
      this.notificationLen += this.notifyData.length;
    })
    })
    }

  correctionModelView(version:number,articleId:string,clientId:string,index:number){ 
    console.log(this.notifyData);
    this.notifyData[index].modelerView = true;
    this.blueIndicator = this.notifyData.some(correction => correction.modelerView == false)
    this.backEnd.updateNotificationViewForModeler(clientId,articleId,version,localStorage.getItem("rollNo"),true).subscribe(()=>{})
    this.route.navigate(['modeler/model-correction',articleId,clientId,version])
  }

  getAllNotification(flag:string){
    this.seeMoreToggle = !this.seeMoreToggle;
    this.backEnd.getNotificationData(localStorage.getItem("rollNo"),flag).subscribe((res)=>{
      this.notifyData = [...res.data];
      this.helpNotification = [...res.helpData]
    })
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }
}
