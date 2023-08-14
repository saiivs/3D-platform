import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  constructor(private backEnd:BackendService,private route:ActivatedRoute,private notficationService:NotificationService){
    
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
  

  ngOnInit(){
    this.Id = this.route.snapshot.params['id'];
    this.subscription = this.backEnd.getQaPro(this.Id).subscribe((data)=>{
      console.log(data);
      
     if(data.proList.length > 0){
      this.clientId = data.proList[0].clientId
      this.clientDetails = data.proList[0].clientData; 
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
      this.products = [...data.proList[0].assignedPro];
      if(data.requirement.length > 1){
        for(let pro of this.products){
        for (let info of data.requirement){
          if(this.clientId == info.clientId&&pro.articleId==info.articleId){
            pro.extraInfo = info.additionalInfo
          }
        }
      }
      }
      let qaRollNo = localStorage.getItem("rollNo");
      this.products = this.products.filter(obj => obj.qaRollNo == qaRollNo)
      this.totalRecords = this.products.length;
     }else{
      this.proList = false;
     }
    })
    this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
    })
  }

  scrapeImages(url:string,name:string,articleId:string){
    this.backEnd.scrapeImages(url,name,articleId,this.clientDetails[0].clientName).subscribe((res)=>{
      console.log(res);
      
    })
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
    this.subscription.unsubscribe()
  }

}
