import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CorrectionImageComponent } from '../../correction-image/correction-image.component'
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modeler-correction-view',
  templateUrl: './modeler-correction-view.component.html',
  styleUrls: ['./modeler-correction-view.component.css'],
})

export class ModelerCorrectionViewComponent implements OnInit,OnDestroy{
  
  constructor(private route:ActivatedRoute,private backEndService:BackendService,private renderer:Renderer2,private openDilog:MatDialog,private notificatinService:NotificationService){}

  articleId:string = "";
  clientId:string = "";
  version:number = 0;
  src:string = "";
  versionTracker:string = "";
  result:Array<any>=[]
  correctionsWithVersions:Array<any> = [];
  tabPanels:Array<any> = [];
  clientDetails:any = {};
  clientName:string = "";
  noCorrections:boolean = false;
  hotspots:Array<any> = [];
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  

  @ViewChild('modelTest',{ static: false }) modelTest!: ElementRef;
  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version'];
    this.subscription1 = this.backEndService.getClientDetailsForQADo(this.clientId).subscribe((res)=>{
      this.clientDetails = res
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails.clientName.replace(regex,"_")
      console.log("asdfasdfasdfasdf");
      
      this.subscription2 = this.backEndService.getLatestCorrectionForModeler(this.clientId,this.articleId).subscribe((res)=>{
        if(res){
          this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${res[0].version}/${this.articleId}.glb`;
          this.tabPanels = Array(res[0].version).fill(1).map((_, index) => `Version ${index+1}`);
          let modelerViewStatus = res[0].modelerView;
          if(!modelerViewStatus)this.subscription3 = this.backEndService.updateNotificationViewForModeler(this.clientId,this.articleId,this.version,localStorage.getItem("rollNo"),true).subscribe((res)=>{})
          this.tabPanels = Array(res[0].version).fill(1).map((_, index) => `version ${index+1}`);
          this.versionTracker = `version-${res[0].version}`
          this.tabPanels.reverse()
          this.hotspots = res;
          this.correctionsWithVersions = this.hotspots.reduce((result,hotspot)=>{
            const {version} = hotspot;
            if(!result[version]) result[version] = [];
            result[version].push(hotspot)
            return result
          },{})
          this.result = Object.keys(this.correctionsWithVersions).map((key:any)=>{
            return {[key]:this.correctionsWithVersions[key]}
           })
                      
          this.hotspots.forEach((hotspot,index)=>{
            hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${hotspot.version}/${hotspot.hotspotName}.jpg`
            this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1)
          })
          console.log(this.hotspots);
          
        }else{
          console.log(res);
          
          console.log("asdfasdfasdf");
          this.noCorrections = true;
        }
          
      })
    })
    this.subscription4 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
    this.notificatinService.setNotificationDAta(data);
  })
  }

  onTabChange(event:MatTabChangeEvent){
    let versionTxt= event.tab.textLabel;
    let version = Number(versionTxt.split(" ")[1]);
    // if(version == this.version){
    //   this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${version}/${this.articleId}.glb`;
    // }else if(version == this.version - 1){
    //   this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version - 1}/${this.articleId}.glb`;
    // } 
    
    this.subscription5 = this.backEndService.getHotspotwithVersion(version,this.clientId,this.articleId).subscribe((res)=>{
      if(res){
        this.hotspots = res;
        this.hotspots.forEach((hotspot,index) =>{
          hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${hotspot.version}/${hotspot.hotspotName}.jpg`
        })
      }   
    })
  }

  imageNotFound(index:number){
    this.hotspots[index].corrImg = false;
  }

  openCorrectionImg(imgLink:string,correction:string){
    let obj = {
      url:imgLink,
      correction:correction
    }
   this.openDilog.open(CorrectionImageComponent,{
      width:"60rem",
      data:obj
    })
  }

  
  addHotspotInitially(normal:string,position:string,name:string,hotSpotId:number){
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',name);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    const buttonText = this.renderer.createText(`${hotSpotId}`);
    this.renderer.setStyle(hotspot, 'width', '25px');
    this.renderer.setStyle(hotspot, 'height', '25px');
    this.renderer.setStyle(hotspot,'font-size', '10px');
    this.renderer.appendChild(hotspot, buttonText);
    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    this.modelTest.nativeElement.appendChild(hotspot);
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe() 
  }
}
