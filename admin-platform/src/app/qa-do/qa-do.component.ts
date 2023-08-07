import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import '@google/model-viewer'
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BackendService } from '../services/backend.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ToastrService } from 'ngx-toastr';
import { CorrectionImageComponent } from '../correction-image/correction-image.component';
import { MatDialog } from '@angular/material/dialog';
import { overflow } from 'html2canvas/dist/types/css/property-descriptors/overflow';

@Component({
  selector: 'app-qa-do',
  templateUrl: './qa-do.component.html',
  styleUrls: ['./qa-do.component.css']
})
export class QaDoComponent implements OnInit, AfterViewInit{

  constructor(private backEndService:BackendService,private route : ActivatedRoute,private renderer:Renderer2,private sanitizer:DomSanitizer,private toastr: ToastrService,private openDilog:MatDialog,private router:Router,private el:ElementRef){

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
  historyHotspot:Array<any> = [];
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
  editImgFile!:File;
  editImg!:SafeUrl;
  editTxtInput:string = "";
  editFlag:Boolean = false;
  tabVersionTracker!:number
  correctionUpdatedTime!:Date
  editedCorrectionArr:Array<any> = [];
  emptyField:String = "";
  editMode:Boolean = false;
  trackEditedCorrection:Array<any> = [];
  label:Array<any> = []
  
  
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
        this.src = `${environment.staticUrl}/models/${clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`;
      }
    })
    this.correction()
  }

  ngAfterViewInit(){
    const element = this.el.nativeElement.querySelector('.mat-mdc-tab-body-content');
    this.renderer.setStyle(element,"overflow","hidden")
  }

  correction(){
    this.backEndService.getLatestCorrection(this.clientId,this.articleId).subscribe((res)=>{ 
      if(res.status){
        if(!res.update)
      {  
        console.log("old model");
        this.versionTracker = "Recent version"
        this.latestHotspotData = res.data; 
        this.latestHotspotUpdated = true;
        this.showLatestHotspotOverModel()
      }else{
        console.log("new model");
        console.log(res.data);
        
        this.versionTracker = "Updated model"
        this.latestHotspotData = res.data;
        
        this.isNewModelAvailable = !this.isNewModelAvailable;
      }
      this.hotSpotData = res.data;
     
      this.latestVersion = res.data[0].version;
     
      this.tabPanels = Array(this.latestVersion).fill(1).map((_, index) => `Version ${index+1}`);
      this.tabPanels.reverse()
      } else{
        console.log("starting");
        
      }
    })
  }

  setTabPanels(event:any){
    this.correctionUpdatedTime = new Date();
    this.latestHotspotData = event;
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
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.latestVersion}/${this.articleId}.glb`
    } 
    this.versionTracker = `Recent version`
    if(this.latestHotspotData.length != 0){
      this.latestHotspotData.forEach((hotspot:any,index:number)=>{
        hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${this.latestVersion}/${hotspot.hotspotName}.jpg`
        this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1);
      })
        this.hotSpotData = this.latestHotspotData
    }
    console.log("here it is");
    console.log(this.hotSpotData);
    
    
  }

  showHistoryHotspotOverModel(version:number){
    if(this.checkModelChange){
      this.checkModelChange = false;
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
    }
    this.historyHotspot.forEach((hotspot:any,index:number)=>{
      hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${version}/${hotspot.hotspotName}.jpg`
    })
    this.hotSpotData = this.historyHotspot
  }

  imageNotFound(version:number,index:number){
   if(version == this.latestVersion){
    this.latestHotspotData[index].corrImg = false;
   }else{
    this.hotSpotData[index].corrImg = false;
   }  
  }

  onTabChange(event:MatTabChangeEvent){
    this.hotspotDenied = event.index != 1 || this.latestHotspotUpdated && !this.editFlag ? true : false;
    if(event.index >= 2){
      this.hotspotDenied = true;
      this.hotSpotData = [];
      let versiontxt = event.tab.textLabel;
      let version = Number(versiontxt.split(" ")[1]);
      this.tabVersionTracker = version;
      if(version != this.latestVersion){
        this.removeAllHotspot()
        this.backEndService.getHotspotwithVersion(version,this.clientId,this.articleId).subscribe((res)=>{
          this.historyHotspot = res;
          this.showHistoryHotspotOverModel(version);
        })
      }else {
        if(!this.latestHotspotUpdated)this.checkModelChange = true;
        this.removeAllHotspot();
        this.showLatestHotspotOverModel();
      }
    }else if(this.isNewModelAvailable){
      console.log("yes");
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
        this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
      }  
    }else{
      this.removeAllHotspot();
      this.showLatestHotspotOverModel()
    }
  }

  @ViewChild('modelViewerContainer',{ static: true }) modelViewerContainer!: ElementRef;
  @ViewChild('modelTest',{ static: true }) modelTest!: ElementRef;

  removeHotspot(hotspotId:any){
    console.log("removed");
    if(this.tempHotspot.length != 0){
      this.tempHotspot = this.tempHotspot.filter(hotspot => hotspot.hotspotId != hotspotId);
      this.hotSpotData = [...this.tempHotspot]
    }else{
      this.hotSpotData = this.hotSpotData.filter(hotspot => hotspot.hotspotId != hotspotId);
    }
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
    if(!this.hotspotDenied){
    const modelViewerElement = this.modelViewerContainer.nativeElement.querySelector('model-viewer');
    const point = modelViewerElement.positionAndNormalFromPoint(event.clientX, event.clientY);
    let hotSpotId = (this.nextHotspotId + 1).toString();
    this.nextHotspotId ++;
    let hotspotSlotExist = this.hotSpotData.find(hotspot => hotspot.slot == `hotspot-${this.version}${hotSpotId}`);
    hotSpotId = hotspotSlotExist ? `${Number(hotSpotId) + 1 }` : hotSpotId
   
    const normal = point.normal.toString().replace(/m/g, "");
    const position = point.position.toString().replace(/m/g, "");
    console.log(this.version, hotSpotId);
    
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',`hotspot-${this.version}${hotSpotId}`);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    console.log(hotspot);
    let buttonText = hotspotSlotExist ? this.renderer.createText(`${Number(hotSpotId) - 1 }`) : this.renderer.createText(hotSpotId);
    
    this.renderer.setStyle(hotspot, 'width', '25px');
    this.renderer.setStyle(hotspot, 'height', '25px');
    this.renderer.setStyle(hotspot,'font-size', '10px');
    
    this.renderer.appendChild(hotspot, buttonText);

    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    this.modelTest.nativeElement.appendChild(hotspot);
    var obj = {
      hotspotName : `hotspot-${this.version}${hotSpotId}`,
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
    console.log("calledd for deletiuon");
    
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
    console.log(hotspot);
    
    this.modelTest.nativeElement.appendChild(hotspot);
  }

  getEditImage(event:Event){
    let inputElement = event.target as HTMLInputElement;
    if(inputElement.files && inputElement.files.length > 0){
      this.editImgFile = inputElement.files[0];
    }
  }

  editCorrection(index:number){
    if(this.editImgFile || this.editTxtInput){
      const hotSpot = this.hotSpotData[index];
      const {corrImg,correction} = hotSpot;
      console.log({hotSpot});

      const formData = new FormData();
      formData.append('image',this.editImgFile);
      formData.append('text',this.editTxtInput);
      formData.append('clientId',this.clientId);
      formData.append('articleId',this.articleId);
      let version = this.version.toString();
      formData.append('version',version);
      formData.append('hotspotId',hotSpot.hotspotId);
      formData.append('clientName',this.clientName);
  
      this.backEndService.editCorrection(formData).subscribe((res)=>{
        if(!res){
          this.hotSpotData[index].editFlag = false
          this.toastr.error('Error', 'edit disabled')
          hotSpot.corrImg = corrImg;
          hotSpot.correction = correction;
        }else{
          this.hotSpotData[index].editFlag = false
          hotSpot.correction = this.editTxtInput;
        if(this.editImgFile){
          hotSpot.corrImg = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.editImgFile));
          hotSpot.editFlag = false;
      }
        }
      })
    }else{

    }  
  }

  openCorrectionImg(imgLink:string){
    let url = imgLink
   this.openDilog.open(CorrectionImageComponent,{
      width:"60rem",
      data:url
    })
  }

  editCorrectionNew(){
    if(this.correctionUpdatedTime){
     this.timeValidation(this.correctionUpdatedTime)
    }else{
      let date = this.hotSpotData[0].date;
      this.timeValidation(date)
    }  
  }

  checkImgFile(event:Event,index:number){
    let inputElement = event.target as HTMLInputElement;
    if(inputElement.files && inputElement.files.length > 0){
      this.label[index] = "Selected"
    }else{
      this.label[index] =  "Image"
    }
  }

  timeValidation(date:Date){
    let targetTime:Date = new Date(date);
    let currTime:Date = new Date();
    let timeDifferenceInMinutes = Math.floor((currTime.getTime() - targetTime.getTime()) / 1000);
    timeDifferenceInMinutes = Math.floor(timeDifferenceInMinutes / 60);
    if(timeDifferenceInMinutes <= 5){
    this.editFlag = true;
    this.hotspotDenied = false;
    this.nextHotspotId = this.hotSpotData.length; 
    }else{
      this.toastr.error('Error', 'time exceeded');
    } 
  }

  edited(index:number){
    if(!this.trackEditedCorrection.includes(index+1)) this.trackEditedCorrection.push(index+1); 
    console.log(this.trackEditedCorrection);
      
  }

  @ViewChildren('editCorrection') correctionItems!: QueryList<ElementRef<HTMLLIElement>>;

  EditCorrectionNew()
{
  const formData = new FormData();
  this.correctionItems.forEach((itemRef:ElementRef<HTMLElement>,index:number)=>{
    const listItem = itemRef.nativeElement;  
    let inputTxt = listItem.querySelector('input[type ="text"]')  as HTMLInputElement;
    let inputImg = listItem.querySelector('input[type="file"]')  as HTMLInputElement;
    if(!inputTxt.value){
      this.emptyField = "error"
    }else{
      this.emptyField = ""
      let findItem = this.hotSpotData.find(obj => obj.hotspotId == `${index+1}`)
      console.log("trackkk");
      
      console.log(this.trackEditedCorrection);
      const cacheBuster = new Date().getTime();
      let obj = {
        correction : inputTxt.value,
        hotspotId : index+1,
        hotspotName : `hotspot-${this.version}${index+1}`,
        normalValue: findItem.normalValue,
        positionValue:findItem.positionValue,
        clientId:this.clientId,
        articleId:this.articleId,
        corrImg:`${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${this.version}/${findItem.hotspotName}.jpg?cache=${cacheBuster}`,
        clientName:this.clientName,
        version:this.version,
        edited:this.trackEditedCorrection.includes(index+1) 
      }
     this.editedCorrectionArr.push(obj);
     const jsonString = JSON.stringify(obj);
     formData.append(`item${index+1}`,jsonString);
     if(inputImg?.files?.[0]) formData.append(`image${index+1}`,inputImg?.files?.[0])
    }
  })

  this.backEndService.EditExistingCorrection(formData).subscribe((res)=>{
      if(res){
        this.editFlag = false;
        this.hotSpotData = [...this.editedCorrectionArr]
        this.latestHotspotData = [...this.editedCorrectionArr]
        this.editedCorrectionArr = []
        // this.latestHotspotData = [...this.editedCorrectionArr]
        this.hotspotDenied = true;
      }else{
        this.toastr.error('Error', 'time exceeded');
        this.editFlag = false;
        this.hotspotDenied = false;
        this.editedCorrectionArr = [];
      }
    }) 
}

deleteCorrection(hotspotName:string,hotSpotId:string){
  this.backEndService.deleteCorrection(hotspotName,this.clientName,this.articleId,this.version).subscribe((res)=>{
    if(res == 'Deleted'){
      console.log(this.latestHotspotData);
      console.log(hotSpotId);
      
      this.latestHotspotData = this.latestHotspotData.filter(obj=> obj.hotspotId != hotSpotId);
      console.log(this.latestHotspotData);
      
      this.hotSpotData = [...this.latestHotspotData]
      this.nextHotspotId = this.hotSpotData.length;
      const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
      removeItems.forEach((item: any) => {
      this.renderer.removeChild(item.parentNode, item);
    });
      this.hotSpotData.forEach((hotspot:any,index:number)=>{
      this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1)
    })
    }else{
      this.toastr.error('Error',"Time Exceeded")
    }
  })
}

  getEditTxt(index:number){
    this.hotSpotData[index].editFlag = true;
    this.editTxtInput = this.hotSpotData[index].correction
  }

  fullScreen(){
    this.router.navigate(['/3d-model/viewer',this.clientName,this.articleId,this.version])
  }

}
