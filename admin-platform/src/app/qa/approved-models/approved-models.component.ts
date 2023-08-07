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
    this.Id = this.route.snapshot.params['id'];
    let QaRollNo = localStorage.getItem('rollNo');
    this.backEnd.getApprovedModelsForQa(QaRollNo).subscribe((data)=>{
      this.clients = data;
      
      
    })
    
    // this.subscription = this.backEnd.getApprovedModelsForQa(QaRollNo).subscribe((data)=>{
    //   this.clientRequirement = data.requirement.requirement;
    //   this.clientId = data.proList[0].clientId
    //   this.clientDetails = data.proList[0].clientData; 
    //   const regex = /[^a-zA-Z0-9]/g;
    //   this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
    //   this.products = [...data.proList[0].assignedPro];
    //   let qaRollNo = localStorage.getItem("rollNo");
    //   this.products = this.products.filter(obj => obj.qaRollNo == qaRollNo)
    //   this.totalRecords = this.products.length;
    // })
  }

  scrapeImages(url:string,name:string,articleId:string){
    this.backEnd.scrapeImages(url,name,articleId,this.clientDetails[0].clientName).subscribe((res)=>{
      console.log(res);
      
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }


}
