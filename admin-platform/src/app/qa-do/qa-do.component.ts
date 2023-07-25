import { Component, ElementRef, EventEmitter, OnInit, Renderer2, ViewChild } from '@angular/core';
import '@google/model-viewer'
import { environment } from '../../environments/environment';

import { BackendService } from '../services/backend.service';
import { ActivatedRoute } from '@angular/router';
import { TestComponent } from '../test/test.component';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-qa-do',
  templateUrl: './qa-do.component.html',
  styleUrls: ['./qa-do.component.css']
})
export class QaDoComponent implements OnInit{

  constructor(private backEndService:BackendService,private route : ActivatedRoute,private renderer:Renderer2){

  }

  articleId:string = "";
  clientId:string = "";
  clientName:string = "";
  src:string = "";
  noImgForGallery = "";
  version:number = 0;
  preImgHeight:number = 25;
  product:any = {};
  clientDetails:any = {};
  totalRecords!:number
  page:number = 1;
  onSelectedFiles!:File[]
  fullScreenIcon: Boolean = true;
  myFullresImage:string = "";
  myThumbnail:string = "";
  display:Boolean = false;
  mode:string = 'Full Screen'
  initialImg:string = "";
  versionTracker:string = "";
  isNewModelAvailable:Boolean = false;
  imgSrc:Array<any> = [];
  hotSpotData:Array<any> = [];
  hotspotDenied:Boolean = true;
  nextHotspotId:number = 0;
  latestHotspotUpdated:boolean = false;
  latestHotspotData:Array<any> = [];
  correctionFormFlag:Boolean = true;
  latestVersion:number = 0;
  tempHotspot:Array<any> = [];
  checkModelChange:Boolean = false;
  latestCorrection:Array<any> = [];
  newCorrection:Array<any> = [];
  tabPanels:Array<any> = [];
  
  
  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['articleId'];
    this.clientId = this.route.snapshot.params['clientId'];
    this.version = this.route.snapshot.params['version'];
    this.backEndService.updateModelUnderQa(this.clientId,this.articleId,true).subscribe(()=>{})
    this.backEndService.getClientDetailsForQADo(this.clientId).subscribe((res)=>{
      if(res){
        const regex = /[^a-zA-Z0-9]/g;
        let clientName = res.clientName.replace(regex,"_")
        this.clientName = clientName
        this.src = `${environment.apiUrl}/models/${clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`;
      }
    })
    this.backEndService.getLatestCorrection(this.clientId,this.articleId).subscribe((res)=>{ 
      if(!res.status){
        if(!res.update)
      {  
        console.log("old model");
        
        this.versionTracker = "Recent version"
        this.latestVersion = res.data[0].version;
        this.tabPanels = Array(this.latestVersion).fill(1).map((_, index) => `Version ${index+1}`);
        this.tabPanels.reverse()
        this.latestHotspotData = res.data;
        this.hotSpotData = res.data;
        this.nextHotspotId = this.hotSpotData.length
        this.showLatestHotspotOverModel()
      }else{
        console.log("new model");
        
        this.versionTracker = "Updated model"
        this.latestHotspotData = res.data;
        this.isNewModelAvailable = !this.isNewModelAvailable;
        this.latestVersion = res.data[0].version;
        this.tabPanels = Array(this.latestVersion).fill(1).map((_, index) => `Version ${index+1}`);
        this.tabPanels.reverse()
        // this.hotSpotData = res.data;
        // this.nextHotspotId = this.hotSpotData.length
      }
      } 
    })
  }

  setTabPanels(){
    this.latestHotspotUpdated = true;
    this.isNewModelAvailable = false
    console.log("updated hotspot");
    console.log(this.latestHotspotUpdated,this.latestVersion);
    
    let count = 1 + this.latestVersion
    this.latestVersion = count;
    this.tabPanels = Array(count).fill(1).map((_, index) => `Version ${index+1}`);
    this.tabPanels.reverse()
  }

  showLatestHotspotOverModel(){
    if(this.isNewModelAvailable){
      this.src = `${environment.apiUrl}/models/${this.clientName}/${this.articleId}/version-${this.latestVersion}/${this.articleId}.glb`
    } 
    this.versionTracker = `Recent version`
    if(!this.latestHotspotUpdated){
    console.log("unwanted");
    
     this.latestHotspotData.forEach((hotspot:any,index:number)=>{
      hotspot.corrImg = `${environment.apiUrl}/corrections/${this.clientName}/${this.articleId}/version-${this.latestVersion}/${hotspot._id}.jpg`
      this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1);
    })
        this.hotSpotData = this.latestHotspotData
        this.latestHotspotUpdated = false; 
    }else{
      console.log("third stage");
      this.backEndService.getHotspotwithVersion(this.latestVersion,this.clientId,this.articleId).subscribe((res)=>{
        console.log("this one");
        
        console.log({res});
        
        this.latestHotspotData = res;
        this.latestHotspotData.forEach((hotspot:any,index:number)=>{
          hotspot.corrImg = `${environment.apiUrl}/corrections/${this.clientName}/${this.articleId}/version-${this.latestVersion}/${hotspot._id}.jpg`
          this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1);
        }) 
        this.hotSpotData = this.latestHotspotData
        this.latestHotspotUpdated = false;
      })
    }
    
    console.log("here it is");
    console.log(this.hotSpotData);
    
    
  }

  showHistoryHotspotOverModel(version:number){
    if(this.checkModelChange){
      this.checkModelChange = false;
      this.src = `${environment.apiUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
    }
    this.hotSpotData.forEach((hotspot:any,index:number)=>{
      hotspot.corrImg = `${environment.apiUrl}/corrections/${this.clientName}/${this.articleId}/version-${version}/${hotspot._id}.jpg`
    })
    // this.latestHotspotData.forEach((hotspot:any,index:number)=>{
    //   this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1);
    // })
  }

  imageNotFound(version:number,index:number){
   if(version == this.latestVersion){
    this.latestHotspotData[index].corrImg = false;
   }else{
    this.hotSpotData[index].corrImg = false;
   }  
  }

  onTabChange(event:MatTabChangeEvent){
    console.log("check index");
    
    console.log(event.index);
    
    if(event.index >= 2){
      this.hotspotDenied = false
      this.hotSpotData = [];
      let versiontxt = event.tab.textLabel;
      let version = Number(versiontxt.split(" ")[1]);
      if(version != this.latestVersion){
        this.removeAllHotspot()
        this.backEndService.getHotspotwithVersion(version,this.clientId,this.articleId).subscribe((res)=>{
          this.hotSpotData = res;
          this.showHistoryHotspotOverModel(version);
        })
      }else {
        console.log("second stage");
        console.log(this.latestHotspotUpdated);
        if(!this.latestHotspotUpdated)this.checkModelChange = true;
        this.removeAllHotspot();
        this.showLatestHotspotOverModel();
      }
    }else if(this.isNewModelAvailable){
      console.log("yes");
      if(event.index != 1)this.hotspotDenied = true;
      else this.hotspotDenied = false;
      this.versionTracker = 'Updated model'
      this.removeAllHotspot();
      if(this.tempHotspot.length == 0 ){
        this.hotSpotData = [];
      }else{
        this.hotSpotData = [...this.tempHotspot]
        this.tempHotspot.forEach((hotspot:any,index:number)=>{
          this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.slot,index+1);
        })
      }
      if(this.checkModelChange){
        this.checkModelChange = false;
        this.src = `${environment.apiUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
      }  
    }else{
      if(event.index != 1)this.hotspotDenied = true;
      else this.hotspotDenied = false;
      
      this.removeAllHotspot();
      this.showLatestHotspotOverModel()
    }
  }

  @ViewChild('modelViewerContainer',{ static: true }) modelViewerContainer!: ElementRef;
  @ViewChild('modelTest',{ static: true }) modelTest!: ElementRef;

  removeHotspot(hotspotId:any){
    this.hotSpotData = this.hotSpotData.filter(hotspot => hotspot.hotspotId != hotspotId);
    this.tempHotspot = [...this.hotSpotData]
    this.nextHotspotId = this.hotSpotData.length;
    const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
    removeItems.forEach((item: any) => {
      this.renderer.removeChild(item.parentNode, item);
    });
    this.hotSpotData.forEach((hotspot:any,index:number)=>{
      this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.slot,index+1)
    })
  }

  removeAllHotspot(){
    console.log("called");
    
    const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
    removeItems.forEach((item: any) => {
      this.renderer.removeChild(item.parentNode, item);
    });
  }
 
  addHotspot(event:MouseEvent){
    console.log("check denied");
    
    console.log(this.hotspotDenied);
    
    if(!this.hotspotDenied){
      console.log("running");
      
    const modelViewerElement = this.modelViewerContainer.nativeElement.querySelector('model-viewer');
    const point = modelViewerElement.positionAndNormalFromPoint(event.clientX, event.clientY);
    let hotSpotId = (this.nextHotspotId + 1).toString();
    this.nextHotspotId ++;
    let hotspotSlotExist = this.hotSpotData.find(hotspot => hotspot.slot == `hotspot-${this.version}${hotSpotId}`);
    if(hotspotSlotExist){
      hotSpotId = `${Number(hotSpotId) + 1 }`
    }
   
    const normal = point.normal.toString().replace(/m/g, "");
    const position = point.position.toString().replace(/m/g, "");
    console.log(this.version, hotSpotId);
    
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',`hotspot-${this.version}${hotSpotId}`);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    console.log(hotspot);
    let buttonText
    if(hotspotSlotExist){
       buttonText = this.renderer.createText(`${Number(hotSpotId) - 1 }`)
    }else{
       buttonText = this.renderer.createText(hotSpotId)
    }
    
    this.renderer.appendChild(hotspot, buttonText);

    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    this.modelTest.nativeElement.appendChild(hotspot);
    var obj = {
      hotspotName :`hotspot-${hotSpotId}`,
      normalValue : normal,
      positionValue : position,
      clientId : this.clientId,
      articleId : this.articleId,
      hotspotId : `${hotSpotId}`,
      slot : `hotspot-${this.version}${hotSpotId}`
    }
    this.tempHotspot.push(obj)
    this.hotSpotData.push(obj)
    // this.backEndService.createHotSpot(`hotspot-${hotSpotId}`,normal,position,this.articleId,this.clientId,`${hotSpotId}`).subscribe(()=>{})
    }
    
  }

  addHotspotInitially(normal:string,position:string,name:string,hotSpotId:number){
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',name);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    const buttonText = this.renderer.createText(`${hotSpotId}`);
    this.renderer.appendChild(hotspot, buttonText);
    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    
    this.modelTest.nativeElement.appendChild(hotspot);
  }

}
