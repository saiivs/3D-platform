import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-approved-products',
  templateUrl: './approved-products.component.html',
  styleUrls: ['./approved-products.component.css']
})
export class ApprovedProductsComponent {


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
    
    let modRollNo = localStorage.getItem('rollNo');
    console.log(modRollNo);
    this.subscription = this.backEnd.getApprovedModelsForModeler(modRollNo).subscribe((data)=>{
      this.clients = data.clients;  
      let count = 0;
      this.clients.forEach((client)=>{
        count += client.length
      })
      this.totalRecords = count;
    })
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