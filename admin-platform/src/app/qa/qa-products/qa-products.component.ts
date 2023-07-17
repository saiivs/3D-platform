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
  subscription!:Subscription;
  

  ngOnInit(){
    this.Id = this.route.snapshot.params['id'];
    this.subscription = this.backEnd.getQaPro(this.Id).subscribe((data)=>{
      this.clientId = data[0].clientId
      this.clientDetails = data[0].ClientData; 
      this.products = [...data[0].assignedPro];
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
