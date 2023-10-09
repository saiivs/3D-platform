import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import "@google/model-viewer"
import { Subscription } from 'rxjs';
import { model } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-all-models',
  templateUrl: './all-models.component.html',
  styleUrls: ['./all-models.component.css']
})
export class AllModelsComponent implements OnInit, OnDestroy{

  constructor(private backEndService:BackendService,private route:ActivatedRoute,private searchService:NotificationService){

  }

  srcFile:string = '';
  modelerId:string = '';
  modeler:Array<any> = [];
  models:Array<any> = [];
  recieved:string = "";
  staticUrl:string = environment.staticUrl;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;

  ngOnInit(){
    this.modelerId = this.route.snapshot.params[('modelerId')];
    this.searchService.checkUrlForSearchBtn(true);
    this.subscription1 = this.backEndService.getAllModelsOfModeler(this.modelerId).subscribe((res)=>{      
      this.modeler = [...res];
      
      this.modeler[0].models.forEach((client:any)=>{
        this.models = [...client.models]
      }) 
      this.models = this.models.filter(model => model.productStatus != 'Not Uploaded')
      
    }) 
    this.subscription3 = this.searchService.searchValue.subscribe((data)=>{
      this.recieved = data;
    })
    this.subscription2 = this.searchService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.searchService.setNotificationForAdmin(data);
    })
  }

  nameLoad(modeler:string){
    localStorage.setItem('interactive-modeler',modeler)
    }

    ngOnDestroy(): void {
      if(this.subscription1)this.subscription1.unsubscribe()
      if(this.subscription2)this.subscription2.unsubscribe()
      if(this.subscription3)this.subscription3.unsubscribe()
    }
}
