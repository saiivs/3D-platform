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

  constructor(private titleService:Title,private route:Router,private backEnd:BackendService,private dialog:MatDialog){

  }

  ngOnInit() {
    this.titleService.setTitle("3D_Modaler-Clients")
    this.backEnd.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((res)=>{
      this.notifyData = [...res.data]; 
      console.log(this.notifyData);
      
      this.helpNotification = [...res.helpData]
      this.notificationLen += this.notifyData.length;
    })
  }

  correctionModelView(version:number,articleId:string,clientId:string){ 
    this.route.navigate(['modaler/model-correction',articleId,clientId,version])
  }

  // openDialog(correctionString:string): void {
  //   const corrData : correctionData = {
  //     correction:correctionString,
  //   }
  //   const dialogRef = this.dialog.open(CorrectionDilogComponent,{
  //     width:"35rem",
  //     data:corrData
  //   });
  // }
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
