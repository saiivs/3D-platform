import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import "@google/model-viewer"
import { BackendService } from 'src/app/services/backend.service';
import { environment } from '../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ModelWarningComponent } from '../model-warning/model-warning.component';
import { warning } from '../models/interface';

@Component({
  selector: 'app-model-fullscreen',
  templateUrl: './model-fullscreen.component.html',
  styleUrls: ['./model-fullscreen.component.css']
})
export class ModelFullscreenComponent implements OnInit{

  constructor(private route:ActivatedRoute,private router:Router,private backEnd:BackendService,private dialog : MatDialog){}

  modelSrc:string = ""
  clientId:string = "";
  articleId:string = "";
  version:number = 0;
  polygonCount:number = 0;
  materialCount:number = 0;
  modelName :string|null = localStorage.getItem('ProductName');
  clientName:string|null = localStorage.getItem('clientName');
  modelDetail:any = {};
  warning:string|null = localStorage.getItem("ModelWarning")||null

  ngOnInit(){
    this.articleId = this.route.snapshot.params['articleId'];
    this.clientId = this.route.snapshot.params['clientId'];
    this.version = this.route.snapshot.params['version']
    const regex = /[^a-zA-Z0-9]/g;
    let clientName = this.clientName?.replace(regex,"_")
    this.modelSrc = `${environment.apiUrl}/models/${clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
    this.backEnd.getGlbFileDetails(this.articleId,this.clientId,this.version).subscribe((res)=>{
      this.modelDetail = res;
      this.polygonCount = res.info.totalTriangleCount;
      this.materialCount = res.info.materialCount; 
    })  
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ModelWarningComponent,{
      width:"35rem",
      data:this.modelDetail.info
    });
  }


  exitFullScreenMode(){
    let subUrl = ""
    if(localStorage.getItem("userRole") == "3D"){
      subUrl = "modaler"
    }else if(localStorage.getItem("userRole") == "QA"){
      subUrl = "QA"
    }else{
      subUrl = 'admin'
    }
    this.router.navigate([`${subUrl}/reviews`,this.articleId,this.clientId,this.version]);
  }

}
