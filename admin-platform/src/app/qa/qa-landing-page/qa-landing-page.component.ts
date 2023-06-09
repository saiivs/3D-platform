import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { QaLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-qa-landing-page',
  templateUrl: './qa-landing-page.component.html',
  styleUrls: ['./qa-landing-page.component.css']
})
export class QaLandingPageComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService){

  }

  clientsArr:QaLanding[] = [];
  totalRecords!:number
  page:number = 1;
  assProListComplete:string = "Incomplete";
  totalModels:number = 0;
  totalQaModels:number = 0;
  totalApprovedModels:number = 0;
  totalCorruptionModels:number = 0;
  totalApprovedClients:number = 0;
  subscription!:Subscription;


  ngOnInit() {
   this.subscription =  this.backEnd.getClientsForQa().subscribe((data)=>{
      if(data){
        this.clientsArr = [...data];
        for(let item of this.clientsArr){
          this.totalModels = this.totalModels + item.assignedPro.length;
          item.assignedPro.filter((obj:any)=>{
            if(obj.productStatus == 'Not Uploaded' || obj.productStatus == 'Uploaded' || obj.productStatus == 'Correction'){
              item.approvedClient = false;
              if(obj.productStatus == 'Correction') this.totalCorruptionModels = this.totalCorruptionModels + 1;
              if(obj.productStatus == 'Uploaded') this.totalQaModels ++
              
            }else{
              this.totalApprovedModels = this.totalApprovedModels + 1;
            }
          })
          if(item.approvedClient) this.totalApprovedClients ++;
        }
        this.totalRecords = this.clientsArr.length;
      } 
    })
  }

  modalerName(clientName:string){
    this.backEnd.getClientName(clientName);

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

}
