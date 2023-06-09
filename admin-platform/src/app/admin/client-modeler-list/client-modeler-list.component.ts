import { Type } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-client-modeler-list',
  templateUrl: './client-modeler-list.component.html',
  styleUrls: ['./client-modeler-list.component.css']
})
export class ClientModelerListComponent implements OnInit{

  constructor(private backEnd:BackendService,private route:ActivatedRoute){

  }

  modelerList:Array<any> = [];
  clientId:any = ""

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId']

    this.backEnd.getModelersProgress(this.clientId).subscribe((res)=>{
      this.modelerList = [...res]
      
      this.modelerList = this.modelerList.map((obj)=>{
        let percnt = (obj.approvedCount / obj.count) * 100;
        percnt = Number((percnt).toFixed(2));
        let final = `${percnt}%`;
        return {...obj,percentage:final}
      })   
    })  
  }

}
