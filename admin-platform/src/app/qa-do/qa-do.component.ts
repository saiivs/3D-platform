import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import '@google/model-viewer'
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BackendService } from '../services/backend.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ToastrService } from 'ngx-toastr';
import { CorrectionImageComponent } from '../correction-image/correction-image.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-qa-do',
  templateUrl: './qa-do.component.html',
  styleUrls: ['./qa-do.component.css']
})
export class QaDoComponent implements OnInit, AfterViewInit, OnDestroy{

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
  hotspotDenied:Boolean = false;
  nextHotspotId:number = 0;
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
  fullScreenToggle:Boolean = true;
  label:Array<any> = [];
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  subscription6!:Subscription;
  subscription7!:Subscription;

  // new properties
  $currentCorrection:Array<any> = [];
  $latestCorrection:Array<any> = [];
  $oldCorrections:Array<any> = [];
  $tempCorrections:Array<any> = [];
  $newHotsotUpdated:Boolean = false;

  ngAfterViewInit(): void {
    const element = this.el.nativeElement.querySelector('.mat-mdc-tab-body-content');
    this.renderer.setStyle(element,"overflow","hidden")
  }
  
  ngOnInit(): void {
    this.subscription1 = this.route.params.subscribe((params)=>{
      this.articleId = params['articleId'];
      this.clientId = params['clientId'];
      this.version = params['version'];
    })
    this.subscription2 = this.backEndService.updateModelUnderQa(this.clientId,this.articleId,true).subscribe(()=>{})
    this.subscription3 = this.backEndService.getClientDetailsForQADo(this.clientId).subscribe((res)=>{
      if(res){
        const regex = /[^a-zA-Z0-9]/g;
        let clientName = res.clientName.replace(regex,"_")
        this.clientName = clientName
        this.src = `${environment.staticUrl}/models/${clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`;
      }
    })
    this.correction()
  }

  //setting the tab panel when a new correction is submitted
  setTabPanels(event:any){
    this.correctionUpdatedTime = new Date();
    this.$newHotsotUpdated = true;
    this.$tempCorrections = [];
    this.isNewModelAvailable = false;
    this.hotspotDenied = true;
    this.$latestCorrection = [...event];
    this.latestVersion += 1;
    this.tabPanels = Array(this.latestVersion).fill(1).map((_, index) => `Version ${index+1}`);
    this.tabPanels.reverse();
  }

  //fetch the latest correction
  correction(){
    this.subscription4 = this.backEndService.getLatestCorrection(this.clientId,this.articleId).subscribe((res)=>{
      if(res.status){
        if(!res.update){
          console.log("old model or recent version");
          this.versionTracker = "Recent version"
          this.$newHotsotUpdated = true
          this.$latestCorrection = [...res.data];
          console.log(this.$latestCorrection);
          
        }else{
          console.log("new model or updated model");
          this.versionTracker = "Updated model"
          this.$latestCorrection = [...res.data];
          this.isNewModelAvailable = true;
        }
        this.latestVersion =  res.data[0].version;
        this.tabPanels = Array(this.latestVersion).fill(1).map((_, index) => `Version ${index+1}`);
        this.tabPanels.reverse();
      }
      console.log(this.$latestCorrection);
      
    })
  }

//adding the history hotspots and correction images
  showHotspotOverModel(version:number){
    if(this.isNewModelAvailable && this.latestVersion == version){
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${version}/${this.articleId}.glb`
    }else{
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
    }
    this.versionTracker = this.isNewModelAvailable && this.latestVersion != version ? 'Updated model' : 'Recent version'
    if(this.$oldCorrections.length != 0){
      this.$oldCorrections.forEach((hotspot,index)=>{
        hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${version}/${hotspot.hotspotName}.jpg`;
        if(this.latestVersion == version){
          this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1); 
        } 
      })
     
      
      this.hotSpotData = [...this.$oldCorrections];
      console.log(this.hotSpotData);
    }
  }

  //adding the hotspot over the model
  @ViewChild('modelViewerContainer',{ static: true }) modelViewerContainer!: ElementRef;
  @ViewChild('modelTest',{ static: true }) modelTest!: ElementRef;

  addHotspotInitially(normal:string,position:string,name:string,hotspotId:number){  
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',name);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    const buttonText = this.renderer.createText(`${hotspotId}`);
    this.renderer.setStyle(hotspot, 'width', '25px');
    this.renderer.setStyle(hotspot, 'height', '25px');
    this.renderer.setStyle(hotspot,'font-size', '10px');
    this.renderer.appendChild(hotspot, buttonText);
    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    
    this.modelTest.nativeElement.appendChild(hotspot);
  }

  onTabChange(event:MatTabChangeEvent){
    this.hotspotDenied = this.$newHotsotUpdated || event.index != 1 ? true : false;
    if(event.index >=2){
      let versiontxt = event.tab.textLabel;
      let version = Number(versiontxt.split(" ")[1]);
      this.tabVersionTracker = version;
      this.removeAllHotspot();
      this.subscription5 = this.backEndService.getHotspotwithVersion(version,this.clientId,this.articleId).subscribe((res)=>{
        if(this.latestVersion == version){
          console.log("ggg");
          
            this.$oldCorrections = [...this.$latestCorrection]
        }else{
          console.log("hhh");
          
            this.$oldCorrections = [...res]; 
        }
      this.showHotspotOverModel(version)
      })
    }else{
      if(this.isNewModelAvailable){
        this.hotSpotData = [];
        this.removeAllHotspot();
        this.versionTracker = "Updated model"
        this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`;

        //if the user switches tabs while creating correction or hotspot.
        if(this.$tempCorrections.length != 0){
          this.hotSpotData = [...this.$tempCorrections];
          this.addTempCorrection()
        } 
      }
    }
  }

  //handling temporary correction created by the user.
  addTempCorrection(){
    this.hotSpotData.forEach((hotspot,index)=>{
      this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1);
    })
  }

  //retaining the correction info if the user switches the tab while correction.
  retainValue(event:any){
    this.$tempCorrections[event.index].correction = event.value;
  }
  retainCorrectionImg(event:any){
    this.$tempCorrections[event.index].retainImg = event.imgFile;
  }

  //creating the hotspots 
  addHotspot(event:MouseEvent){
    if(!this.hotspotDenied){
      const modelViewerElement = this.modelViewerContainer.nativeElement.querySelector('model-viewer');
      const point = modelViewerElement.positionAndNormalFromPoint(event.clientX, event.clientY);
      const txt = this.hotSpotData.length + 1;
      let hotSpotId = (this.nextHotspotId + 1).toString();
      this.nextHotspotId ++;
      let hotspotSlotExist = this.hotSpotData.find(hotspot => hotspot.hotspotName == `hotspot-${this.version}${hotSpotId}`);
      let hotspotIdExist = this.hotSpotData.find(hotspot => hotspot.hotspotId == hotSpotId)

      while (hotspotSlotExist || hotspotIdExist) {
        hotSpotId = (Number(hotSpotId) + 1).toString();
        hotspotSlotExist = this.hotSpotData.find(hotspot => hotspot.hotspotName == `hotspot-${this.version}${hotSpotId}`);
        hotspotIdExist = this.hotSpotData.find(hotspot => hotspot.hotspotId == hotSpotId);
      }
     
      const normal = point.normal.toString().replace(/m/g, "");
      const position = point.position.toString().replace(/m/g, "");
      
      const hotspot = this.renderer.createElement('button');
      this.renderer.addClass(hotspot,'hotspot');
      this.renderer.setAttribute(hotspot,'slot',`hotspot-${this.version}${hotSpotId}`);
      this.renderer.setAttribute(hotspot,'data-position',position);
      this.renderer.setAttribute(hotspot, 'data-normal',normal);
      let buttonText = this.renderer.createText(`${txt}`)
      
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
        correction: "",
        retainImg:null,
        slot : `hotspot-${this.version}${hotSpotId}`
      }

      this.$tempCorrections.push(obj);
      this.hotSpotData.push(obj);
      console.log("hotspot data adding");
      console.log(this.hotSpotData);
      console.log(hotspot);
      
      
      } 
    }

  //to remove all the hotspot over the model
  removeAllHotspot(){
    const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
    removeItems.forEach((item: any) => {
      this.renderer.removeChild(item.parentNode, item);
    });
  }

  //removing a single hotspot
  removeHotspot(hotspotId:any){
    this.$tempCorrections = this.$tempCorrections.filter(hotspot => hotspot.hotspotId != hotspotId);
    this.hotSpotData = [...this.$tempCorrections];
    this.nextHotspotId = this.hotSpotData.length;
    const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
    removeItems.forEach((item: any) => {
      this.renderer.removeChild(item.parentNode, item);
    });
    this.hotSpotData.forEach((hotspot:any,index:number)=>{
      this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.slot,index+1)
    })
  }

  fullScreenMode(){
    this.fullScreenToggle = false;
    const divElement = document.getElementById('model-viewer-div'); 
    divElement?.classList.remove('col-lg-6');
    divElement?.classList.add('col-lg-12');
  }

  exitFullScreenMode(){
    this.fullScreenToggle = true;
    const divElement = document.getElementById('model-viewer-div');
    divElement?.classList.remove('col-lg-12');
    divElement?.classList.add('col-lg-6');
  }

  //viewing the correction image and correction text in meta-dialog
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

  //Handling the image not found error in the correction tab.
  imageNotFound(version:number,index:number){
    if(this.latestVersion == version) this.$latestCorrection[index].corrImg = false;
    this.hotSpotData[index].corrImg = false;
  }

  //<------------------------editing the correction after the correction is submitted--------------------->

  editCorrectionNew(){
    console.log("edit mode is enabled");
    this.label = [];
    if(this.correctionUpdatedTime){
      this.timeValidation(this.correctionUpdatedTime)
    }else{
      let date = this.hotSpotData[0].date;
      this.timeValidation(date)
    }
  }

  //method for determining whether the image is selected or not in the correction tab.
  checkImgFile(event:Event,index:number){
    let inputElement = event.target as HTMLInputElement;
    if(inputElement.files && inputElement.files.length > 0){
      this.label[index] = "Selected"
    }else{
      this.label[index] =  "Image"
    }
  }

  //validating the time to check whether the edit is posibile or not
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
      this.toastr.error('Error', 'Time Exceeded');
    }
  }

  //keeping the track of edited corrections.
  edited(index:number){
    if(!this.trackEditedCorrection.includes(index+1)) this.trackEditedCorrection.push(index+1); 
  }

  //submiting the edited correction and updating the database.
  @ViewChildren('editCorrection') correctionItems!: QueryList<ElementRef<HTMLLIElement>>;

  SubmitEditedCorrection(){
    const formData = new FormData();
    let count = 1;
    let index = 0;
    let emptyDetectionArr = [];
    this.correctionItems.forEach((itemRef:ElementRef<HTMLElement>)=>{
      if(this.hotSpotData){
        const listItem = itemRef.nativeElement;  
        let inputTxt = listItem.querySelector('input[type ="text"]')  as HTMLInputElement;
        let inputImg = listItem.querySelector('input[type="file"]')  as HTMLInputElement;
        if(!inputTxt.value){
          this.emptyField = "Can not have empty fields."
          emptyDetectionArr.push('empty')
        }else{
          this.emptyField = ""
          let findItem = this.hotSpotData[index] ;
          console.log("each item");
          console.log(findItem);
          if(findItem){
              const cacheBuster = new Date().getTime();
              let obj = {
                correction : inputTxt.value,
                hotspotId : count,
                hotspotName : findItem.hotspotName,
                normalValue: findItem.normalValue,
                positionValue:findItem.positionValue,
                date:findItem.date,
                clientId:this.clientId,
                articleId:this.articleId,
                corrImg:`${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${this.version}/${findItem.hotspotName}.jpg?cache=${cacheBuster}`,
                clientName:this.clientName,
                version:this.version,
                edited:this.trackEditedCorrection.includes(count) 
              }
            this.editedCorrectionArr.push(obj);
         const jsonString = JSON.stringify(obj);
         formData.append(`item${count}`,jsonString);
         if(inputImg?.files?.[0]) formData.append(`image${count}`,inputImg?.files?.[0])
         if(this.hotSpotData.length >= count){
          count = count + 1;
          index = index + 1;
         }  
      }   
    }
  }
    })
    this.backEndService.EditExistingCorrection(formData).subscribe((res)=>{
      if(res){
        this.editFlag = false;
        this.hotSpotData = [...this.editedCorrectionArr];
        this.$latestCorrection = [...this.editedCorrectionArr];
      }else{
        this.toastr.error('Error', 'Time Exceeded');
        this.editFlag = false;
      }
      this.editedCorrectionArr = [];
      this.hotspotDenied = true;
    })
  }

  //deleting the correction in edit mode
  deleteCorrection(hotspotName:string,hotspotId:string){
    this.subscription6 = this.backEndService.deleteCorrection(hotspotName,this.clientName,this.articleId,this.version,this.clientId).subscribe((res)=>{
      if(res == 'Deleted'){
        this.hotSpotData = this.hotSpotData.filter(hotspot => hotspot.hotspotId != hotspotId && hotspot.hotspotName != hotspotName);
        this.$latestCorrection = [...this.hotSpotData];
        this.nextHotspotId = this.hotSpotData.length;
        const removeItems = this.modelTest.nativeElement.querySelectorAll('.hotspot');
        removeItems.forEach((item: any) => {
          this.renderer.removeChild(item.parentNode, item);
        });
        this.hotSpotData.forEach((hotspot:any,index:number)=>{
          this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1)
        })
        console.log("after deletion ");
        console.log(this.hotSpotData);
      }else{
        this.toastr.error('Error',"Time Exceeded");
        this.editFlag = false;
        this.hotspotDenied = true;
      }
    })
  }

  //unsubscribe all the observables on destroying the components.
  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe()
    if(this.subscription6)this.subscription6.unsubscribe()
  }
}
