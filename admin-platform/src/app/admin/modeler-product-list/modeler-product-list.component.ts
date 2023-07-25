import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-modeler-product-list',
  templateUrl: './modeler-product-list.component.html',
  styleUrls: ['./modeler-product-list.component.css']
})
export class ModelerProductListComponent implements OnInit,OnDestroy{

  constructor(private route:ActivatedRoute,private backEndService:BackendService){};

  modelerId:string = "";
  modelList:Array<any> = [];
  totalRecords!:number
  page:number = 1;
  subscriptionModelList!:Subscription;
  

  ngOnInit(): void {
    this.modelerId = this.route.snapshot.params['modelerId'];
    this.subscriptionModelList = this.backEndService.getAllModelListForModeler(this.modelerId).subscribe((res)=>{
      console.log(res);
      this.modelList = res;
      this.totalRecords = this.modelList.length;
    })
  }

  ngOnDestroy(): void {
    this.subscriptionModelList.unsubscribe();
  }
}