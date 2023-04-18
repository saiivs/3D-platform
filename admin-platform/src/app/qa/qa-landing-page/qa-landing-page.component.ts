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
  subscription!:Subscription;

  ngOnInit() {
   this.subscription =  this.backEnd.getClientsForQa().subscribe((data)=>{
      console.log({data});
      if(data){
        this.clientsArr = [...data];
        for(let item of this.clientsArr){
          item.assignedPro.filter((obj:any)=>{
            if(obj.adminStatus == 'Rejected' || obj.adminStatus == 'Not Approved'){
              item.approvedClient = false;
            }
          })
        }
        this.totalRecords = this.clientsArr.length;
      }
      
    })
  }

  modalerName(name:string,clientName:string){
    this.backEnd.getModelerName(name);
    this.backEnd.getClientName(clientName);

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

}
