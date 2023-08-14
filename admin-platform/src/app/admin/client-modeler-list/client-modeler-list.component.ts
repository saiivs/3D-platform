
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-client-modeler-list',
  templateUrl: './client-modeler-list.component.html',
  styleUrls: ['./client-modeler-list.component.css']
})
export class ClientModelerListComponent implements OnInit {

  constructor(private backEnd: BackendService, private route: ActivatedRoute,private notificationService:NotificationService) {
  }

  modelerList: Array<any> = [];
  clientId: any = "";
  page:number = 1;
  totalRecords!:number;
  models:Array<any> = [];
  deadLineOne!:Date
  deadLineTwo!:Date 

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId']
    this.backEnd.getModelersProgress(this.clientId).subscribe((res) => {
      
      console.log(res);
      
      this.modelerList = [...res]
      this.models = res[0].models;
      let count = 0;
      this.models.forEach((model)=>{
        if(model.productStatus == 'Approved'){
          count += 1;
        }
      }) 
      this.modelerList = this.modelerList.map((obj) => {
        let percnt = (count / obj.totalProducts) * 100;
        percnt = Number((percnt).toFixed(2));
        let final = `${percnt}%`;
        return { ...obj, percentage: final }
      })
      this.totalRecords = this.modelerList.length;
    })
    this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  getDeadLineOne(event:Event,modRoll:string){
    let date = (event.target as HTMLInputElement).value
    let dateObj = new Date(date);
    this.backEnd.createModelerDeadLine(dateObj,"deadLineOne",modRoll,this.clientId).subscribe(()=>{});
  }

  getDeadLineTwo(event:Event,modRoll:string){
    let date = (event.target as HTMLInputElement).value
    let dateObj = new Date(date);
    this.backEnd.createModelerDeadLine(dateObj,"deadLineTwo",modRoll,this.clientId).subscribe(()=>{})
  }

  addBonus(event:Event,modelerId:string):void{
    let element = event.target as HTMLInputElement;
    if(element.checked){
      this.backEnd.updateBonus(true,modelerId,this.clientId).subscribe(()=>{})
    }else{
      this.backEnd.updateBonus(false,modelerId,this.clientId).subscribe(()=>{})
    }
  }
}
