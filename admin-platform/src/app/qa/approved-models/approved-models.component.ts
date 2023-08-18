import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-approved-models',
  templateUrl: './approved-models.component.html',
  styleUrls: ['./approved-models.component.css']
})
export class ApprovedModelsComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,private route:ActivatedRoute){
    
  }

  products:Array<any> = []
  Id:string = "";
  clientId:string = "";
  clientDetails:Array<any> = [];
  totalRecords!:number
  clients:Array<any> = [];
  page:number = 1;
  clientName:string = "";
  serachForModel:string = "";
  clientRequirement!:string|boolean
  subscription!:Subscription;
  

  ngOnInit(){
    let QaRollNo = localStorage.getItem('rollNo');
    this.subscription = this.backEnd.getApprovedModelsForQa(QaRollNo).subscribe((data)=>{
      this.clients = data.clients;  
      let count = 0;
      this.clients.forEach((client)=>{
        count += client.length
      })
      this.totalRecords = count;
    })
  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe()
  }
}
