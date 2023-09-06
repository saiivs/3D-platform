import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { modelerLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { BankFormComponent } from '../bank-form/bank-form.component';
import { MatDialog , MatDialogRef} from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-modaler-landing-page',
  templateUrl: './modaler-landing-page.component.html',
  styleUrls: ['./modaler-landing-page.component.css']
})
export class ModalerLandingPageComponent implements OnInit,OnDestroy{

constructor(private backEndService: BackendService,private router:Router,private dilog:MatDialog,private notificatinService:NotificationService){

}

clients:modelerLanding[] = [];
totalRecords!:number
page:number = 1;
assProListComplete:string = "complete";
disableInvoice:Boolean = true;
noModelsToInvoiceMsg:string = "";
modeler:any = {}
modelersArray:Array<any> = []
productCount: number = 0;
subscription!:Subscription;
subscription2!:Subscription;

 ngOnInit() {
  let modRollNo = localStorage.getItem('rollNo')
  this.subscription = this.backEndService.getClientsForModaler(modRollNo).subscribe((clientData)=>{ 
    
    if(clientData.length > 0){
      
      let flag = true;
      this.clients = [...clientData]
      
      this.modelersArray = clientData[0].modelerData
      this.totalRecords = clientData.length
      for(let item of this.clients){
        item.assignedPro.filter((obj:any)=>{
          let modelerRoll = localStorage.getItem('rollNo');
         this.modeler = this.modelersArray[0]
          if(obj.modRollno == modelerRoll) this.productCount ++
          if(obj.productStatus == 'Correction' || obj.productStatus == 'Not Uploaded'){
            item.approvedClient = false; 
          }else if(obj.invoice == false&&obj.productStatus == 'Approved'){
            this.disableInvoice = false;
          }
          if(obj.productStatus != "Approved"){
            flag = false;
          }
          item.listCompleted = flag ? "Complete" : "Incomplete"
        }) 
      }
    }
  })
    this.subscription2 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
      this.notificatinService.setNotificationDAta(data);
    })
 }

 Invoice(){
  if(this.disableInvoice == false){
     let rollNo = localStorage.getItem("rollNo");
  if(this.modeler.bankDetails.length != 0){
    this.router.navigate(['modeler/Invoice',rollNo]);
 }else{
  const dilogRef = this.dilog.open(BankFormComponent);
  dilogRef.afterClosed().subscribe((bankDetails)=>{
    if(bankDetails.valid){
      this.subscription = this.backEndService.createBankDetails(bankDetails.bankInfo,localStorage.getItem("rollNo")).subscribe((res)=>{
      if(res) {
        this.router.navigate(['modeler/Invoice',localStorage.getItem('rollNo')]);
      } 
    })
    } 
  })
 }
  }else{
    this.noModelsToInvoiceMsg = "Sorry no approved models to make an invoice for you."
    setTimeout(()=>{
      this.noModelsToInvoiceMsg = ""
    },10000)
  }
}
  
 QaNameLoad(name:string,clientName:string){ 
  this.backEndService.getQaName(name)
  this.backEndService.getClientName(clientName)
 }

 viewProList(clientId:string){
  this.router.navigate(['modeler/modeler-products', clientId]);
 }

 ngOnDestroy(): void {
   if(this.subscription)this.subscription.unsubscribe();
   if(this.subscription2)this.subscription2.unsubscribe();
 }


}
