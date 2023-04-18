import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { modelerLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-modaler-landing-page',
  templateUrl: './modaler-landing-page.component.html',
  styleUrls: ['./modaler-landing-page.component.css']
})
export class ModalerLandingPageComponent implements OnInit,OnDestroy{

constructor(private backEndService: BackendService){

}

clients:modelerLanding[] = [];
totalRecords!:number
page:number = 1;
assProListComplete:string = "complete";
subscription!:Subscription;

 ngOnInit() {
  this.subscription = this.backEndService.getClientsForModaler().subscribe((clientData)=>{
    if(clientData){
      this.clients = [...clientData]
      this.totalRecords = clientData.length
      for(let item of this.clients){
        item.assignedPro.filter((obj:any)=>{
          if(obj.adminStatus == 'Rejected' || obj.adminStatus == 'Not Approved'){
            item.approvedClient = false;
          }
        })
      }
    }
  })
 }

 QaNameLoad(name:string,clientName:string){ 
  this.backEndService.getQaName(name)
  this.backEndService.getClientName(clientName)
 }

 ngOnDestroy(): void {
   this.subscription.unsubscribe();
 }


}
