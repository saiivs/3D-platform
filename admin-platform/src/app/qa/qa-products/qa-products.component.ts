import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';


@Component({
  selector: 'app-qa-products',
  templateUrl: './qa-products.component.html',
  styleUrls: ['./qa-products.component.css']
})
export class QaProductsComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,private route:ActivatedRoute){
    
  }

  products:Array<any> = []
  Id:string = "";
  clientId:string = "";
  clientDetails:Array<any> = [];
  totalRecords!:number
  page:number = 1;
  clientName:string = "";
  clientRequirement!:string|boolean
  subscription!:Subscription;
  

  ngOnInit(){
    this.Id = this.route.snapshot.params['id'];
    this.subscription = this.backEnd.getQaPro(this.Id).subscribe((data)=>{
      this.clientRequirement = data.requirement.requirement;
      this.clientId = data.proList[0].clientId
      this.clientDetails = data.proList[0].clientData; 
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
      this.products = [...data.proList[0].assignedPro];
      let qaRollNo = localStorage.getItem("rollNo");
      this.products = this.products.filter(obj => obj.qaRollNo == qaRollNo)
      this.totalRecords = this.products.length;
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
