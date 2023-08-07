
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-client-modeler-list',
  templateUrl: './client-modeler-list.component.html',
  styleUrls: ['./client-modeler-list.component.css']
})
export class ClientModelerListComponent implements OnInit {

  constructor(private backEnd: BackendService, private route: ActivatedRoute) {
  }

  modelerList: Array<any> = [];
  clientId: any = "";
  page:number = 1;
  totalRecords!:number;
  deadLineOne!:Date
  deadLineTwo!:Date 

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId']
    this.backEnd.getModelersProgress(this.clientId).subscribe((res) => {
      
      console.log(res);
      
      this.modelerList = [...res]
      
      this.modelerList = this.modelerList.map((obj) => {
        let percnt = (obj.approvedCount / obj.totalProducts) * 100;
        percnt = Number((percnt).toFixed(2));
        let final = `${percnt}%`;
        return { ...obj, percentage: final }
      })
      this.totalRecords = this.modelerList.length;
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
