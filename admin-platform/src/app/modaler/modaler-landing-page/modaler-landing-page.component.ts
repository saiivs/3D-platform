import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { modelerLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { BankFormComponent } from '../bank-form/bank-form.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-modaler-landing-page',
  templateUrl: './modaler-landing-page.component.html',
  styleUrls: ['./modaler-landing-page.component.css']
})
export class ModalerLandingPageComponent implements OnInit,OnDestroy{

constructor(private backEndService: BackendService,private router:Router,private dilog:MatDialog){

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

 ngOnInit() {
  this.subscription = this.backEndService.getClientsForModaler().subscribe((clientData)=>{
    if(clientData){
      console.log(clientData);
      
      this.clients = [...clientData]
      this.modelersArray = clientData[0].modelerData
      this.totalRecords = clientData.length
      for(let item of this.clients){
        item.assignedPro.filter((obj:any)=>{
          let modelerRoll = localStorage.getItem('rollNo');
         this.modeler = this.modelersArray.find(obj => obj.rollNo == localStorage.getItem("rollNo"));
          if(obj.modRollno == modelerRoll) this.productCount ++
          if(obj.productStatus == 'Correction' || obj.productStatus == 'Not Uploaded'){
            item.approvedClient = false; 
          }else if(obj.invoice == false&&obj.productStatus == 'Approved'){
            this.disableInvoice = false;
          }
        }) 
      }
    }
  })
 }

 Invoice(){
  if(this.disableInvoice == false){
     let rollNo = localStorage.getItem("rollNo");
  if(this.modeler.bankDetails.length != 0){
    this.router.navigate(['modaler/Invoice',rollNo]);
 }else{
  this.dilog.open(BankFormComponent,{
    data:localStorage.getItem("rollNo")
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

 ngOnDestroy(): void {
   this.subscription.unsubscribe();
 }


}
