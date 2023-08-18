import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { QaLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-qa-landing-page',
  templateUrl: './qa-landing-page.component.html',
  styleUrls: ['./qa-landing-page.component.css']
})
export class QaLandingPageComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,private notficationService:NotificationService){

  }

  clientsArr:Array<any> = [];
  totalRecords!:number
  page:number = 1;
  products:Array<any> = [];
  assProListComplete:string = "Incomplete";
  totalModels:number = 0;
  totalQaModels:number = 0;
  totalApprovedModels:number = 0;
  totalCorruptionModels:number = 0;
  totalApprovedClients:number = 0;
  subscription!:Subscription;
  subscription1!:Subscription;


  ngOnInit() {
    let qaRollNo = localStorage.getItem("rollNo")
   this.subscription =  this.backEnd.getClientsForQa(qaRollNo).subscribe((data)=>{
      if(data){ 
        console.log(data);
        
        this.clientsArr = [...data];
       
        for(let item of this.clientsArr){
          let flag = true;
          
          item.assignedPro.filter((obj:any)=>{
            this.totalModels ++
            if(obj.productStatus == 'Not Uploaded' || obj.productStatus == 'Uploaded' || obj.productStatus == 'Correction'){
              item.approvedClient = false;
              if(obj.productStatus == 'Correction') this.totalCorruptionModels = this.totalCorruptionModels + 1;
              if(obj.productStatus == 'Uploaded') this.totalQaModels ++
              
            }else{
              this.totalApprovedModels = this.totalApprovedModels + 1;
            }
            if(obj.productStatus != "Approved"){
              flag = false;
            }
            item.listCompleted = flag ? "Complete" : "Incomplete"
          })
          if(item.approvedClient) this.totalApprovedClients ++;
          
        }
        
        this.totalRecords = this.clientsArr.length;
      } 
    })
    this.subscription1 = this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
    })
  }

  modalerName(clientName:string){
    this.backEnd.getClientName(clientName);

  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe()
    if(this.subscription1)this.subscription1.unsubscribe()
  }

}
