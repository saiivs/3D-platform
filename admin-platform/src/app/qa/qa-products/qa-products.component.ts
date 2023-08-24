import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import swal from "sweetalert2/dist/sweetalert2.js"
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';


@Component({
  selector: 'app-qa-products',
  templateUrl: './qa-products.component.html',
  styleUrls: ['./qa-products.component.css']
})
export class QaProductsComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,private route:ActivatedRoute,private notficationService:NotificationService,private router:Router){
    
  }

  products:Array<any> = []
  Id:string = "";
  clientId:string = "";
  clientDetails:Array<any> = [];
  totalRecords!:number
  page:number = 1;
  proList:Boolean = true;
  clientName:string = "";
  serachForModel:string = "";
  clientRequirement!:string|boolean
  subscription!:Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
  
  ngOnInit(){
    this.Id = this.route.snapshot.params['id'];
    let qaRollNo = localStorage.getItem("rollNo");
    this.subscription = this.backEnd.getQaPro(this.Id,qaRollNo).subscribe((data)=>{
     if(data.proList.length > 0){
      this.clientId = data.proList[0].clientId
      this.clientDetails = data.proList[0].clientData; 
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
      this.products = [...data.proList[0].assignedPro];
      this.totalRecords = this.products.length;    
      if(data.requirement.length > 1){
        for(let pro of this.products){
        for (let info of data.requirement){
          if(this.clientId == info.clientId&&pro.articleId==info.articleId){
            pro.extraInfo = info.additionalInfo
          }
        }
      }
      }
      
     }else{
      this.proList = false;
     }
    })
    this.subscription1 = this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
    })
  }

  scrapeImages(url:string,name:string,articleId:string){
    this.subscription2 = this.backEnd.scrapeImages(url,name,articleId,this.clientDetails[0].clientName).subscribe((res)=>{
      console.log(res);  
    })
  }

  qaViewModel(articleId:string,clientId:string,version:number){
    this.router.navigate(['QA/reviews',articleId,clientId,version])
  }

  aditionalInfoDilog(info:string){
    swal.fire({
      title: '',
      icon: 'info',
      html:`${info}`,
      showCloseButton: false,
      showCancelButton: false,
      focusConfirm: false,
    })
  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe()
  }

}
