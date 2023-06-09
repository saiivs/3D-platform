import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import "@google/model-viewer"
import { model } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-all-models',
  templateUrl: './all-models.component.html',
  styleUrls: ['./all-models.component.css']
})
export class AllModelsComponent implements OnInit{

  constructor(private backEndService:BackendService,private route:ActivatedRoute,private searchService:NotificationService){

  }

  srcFile:string = '';
  modelerId:string = '';
  modeler:Array<any> = [];
  models:Array<any> = [];
  recieved:string = "";

  ngOnInit(){
    this.modelerId = this.route.snapshot.params[('modelerId')];
    this.searchService.checkUrlForSearchBtn(true);
    this.backEndService.getAllModelsOfModeler(this.modelerId).subscribe((res)=>{      
      this.modeler = [...res];
      this.models = [...res[0].models]; 
    }) 
    this.searchService.searchValue.subscribe((data)=>{
      this.recieved = data;
    })
  }

  nameLoad(modeler:string){
    localStorage.setItem('interactive-modeler',modeler)
    }
}
