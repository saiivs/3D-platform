import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChange, SimpleChanges, ViewChildren } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-hotspot-correction',
  templateUrl: './hotspot-correction.component.html',
  styleUrls: ['./hotspot-correction.component.css']
})
export class HotspotCorrectionComponent implements OnInit,OnChanges{
formBuilder: any;

constructor(private backEndService:BackendService,private cdr: ChangeDetectorRef){}

correctionArr:Array<any> = []
@Input() hotspotDataCorrection!:Array<any>;
@Output() childEventToInvokeHotspot = new EventEmitter();
@Output() setTabPanelInvokeEvent = new EventEmitter();
@Input() articleId!:string;
@Input() clientId!:string;
@Input() version:number = 0;
productLink!:string
emptyField:string = "";
imgFile!:File;
reactiveForm!:FormGroup;
payload:Array<any> = [];
formData = new FormData();
latest:Array<any> = [];
noCorrectionForm:Boolean = true;
tabPanels = Array(3).fill(1).map((_, index) => `version ${index+1}`);
labels:Array<any> = [];

ngOnInit(): void {
  this.backEndService.checkForHotspots(this.clientId,this.articleId).subscribe((res)=>{ 
    this.productLink = this.backEndService.getProductLink();   
   if(res.status){
    this.noCorrectionForm = res.msg == "no updates" ? false : true;
   }       
  })
}

ngOnChanges (changes:SimpleChanges): void {
if(changes['hotspotDataCorrection']){
  this.correctionArr = this.hotspotDataCorrection;  
}  
}

emitChildEvent(hotspotId:number){
  this.latest = this.latest.filter(hotspot => hotspot.hotSpotId != hotspotId);
  this.childEventToInvokeHotspot.emit(`${hotspotId}`);
}

getCorrectionImg(event:Event,index:number){
  // const inputElement = event.target as HTMLInputElement;
  // if(inputElement.files && inputElement.files.length > 0){
  //   let imgObj={
  //     image : inputElement.files[0]
  //   }
  //   this.payload.push(imgObj)
  //   this.backEndService.updateHotspotCorrectionImg(formData).subscribe(()=>{
  //   })
  // }
}

getCorrection(event:Event,index:number){
  // const inputElement = event.target as HTMLInputElement;
  // this.payload[index].correction = inputElement.value;
  // this.payload[index].hotspotName = `hotspot-${index+1}`;
  
}

checkImgFile(event:Event,index:number){
  let inputElement = event.target as HTMLInputElement;
  if(inputElement.files && inputElement.files.length > 0){
    this.labels[index] = "Selected";
  }else{
    this.labels[index] = "Image"
  }
}

@ViewChildren('correctionItem') correctionItems!: QueryList<ElementRef<HTMLLIElement>>;

createCorrection()
{
  console.log(this.hotspotDataCorrection);
  
  const formData = new FormData();
  this.correctionItems.forEach((itemRef:ElementRef<HTMLElement>,index:number)=>{
    const listItem = itemRef.nativeElement;  
    let inputTxt = listItem.querySelector('input[type ="text"]')  as HTMLInputElement;
    let inputImg = listItem.querySelector('input[type="file"]')  as HTMLInputElement;
    if(!inputTxt.value){
      this.emptyField = "error"
    }else{
      this.emptyField = ""
      let findItem = this.hotspotDataCorrection[index]
      console.log(findItem);
      
     let obj = {
      correction : inputTxt.value,
      hotspotId : index+1,
      hotspotName : findItem.hotspotName,
      normalValue: findItem.normalValue,
      positionValue:findItem.positionValue,
      clientId:this.clientId,
      articleId:this.articleId,
      version:this.version
     }
     this.latest.push(obj)     
     const jsonString = JSON.stringify(obj);
     formData.append(`item${index+1}`,jsonString);
     if(inputImg?.files?.[0]) formData.append(`image${index+1}`,inputImg?.files?.[0])
    }
  })
  this.setTabPanelInvokeEvent.emit(this.latest)
  console.log("hotsPot submit");
  
  this.noCorrectionForm = !this.noCorrectionForm
  this.backEndService.updateHotspotCorrectionImg(formData).subscribe((res)=>{
    }) 
}
}
