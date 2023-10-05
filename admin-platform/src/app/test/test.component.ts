import { Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class TestComponent implements OnChanges {

  constructor(private elementRef:ElementRef,private renderer:Renderer2){}

  myThumbnail:string=""
  myFullresImage:string="";
  src:string = "";
  thumbnailHeight:number = 400;
  thumbnailWidth:number = 400;
  @Input() intitialImgTest="";
  fullScreenThumb:string = "";
  tempThumbHolder:string = "";
  maxThumbnailSize:number = 400;
  horizontalThumbValue:number = 500;
  potraitThumbValue:number = 400;

  imgType(originalHeight:number,originalWidth:number,horizontal:number,potrait:number,maximum:number){
    let thumbnailWidth: number;
    let thumbnailHeight: number;
    console.log(originalHeight,originalWidth);
    
  if (originalWidth > originalHeight) {
   
    thumbnailWidth = horizontal == 600 ? 600 : 500;
    thumbnailHeight = Math.round((originalHeight / originalWidth) * horizontal);
  } else if (originalHeight > originalWidth) {
    // Portrait image
    thumbnailWidth = Math.round((originalWidth / originalHeight) * potrait);
    thumbnailHeight = potrait == 600 ? 600 : 400;
  } else {
    // Square image
    thumbnailWidth = thumbnailHeight = maximum;
  }

  return { width: thumbnailWidth, height: thumbnailHeight };

    }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.intitialImgTest != ""){
      const image = new Image();
    image.crossOrigin="anonymous";
  
      console.log(this.intitialImgTest);
      
    this.myFullresImage = this.intitialImgTest;
    image.src = this.intitialImgTest
    let canvas = document.createElement('canvas');
    image.onload = ()=> {
      // Set the canvas dimensions to match the thumbnail size
      let imgRes = this.imgType(image.height,image.width,this.horizontalThumbValue,this.potraitThumbValue,this.maxThumbnailSize);
      console.log({imgRes});
      

      canvas.width = imgRes.width;
      canvas.height = imgRes.height;
    
      // Get the 2D rendering context of the canvas
      let ctx = canvas.getContext('2d');
    
      if(ctx){
        console.log("drawn");
        
      ctx.drawImage(image, 0, 0, imgRes.width, imgRes.height);  
      let thumbnailDataURL = canvas.toDataURL('image/jpeg');
      this.myThumbnail = thumbnailDataURL;
     
      }
    }
    }
    
  }

  setThumbnail(potrait:number,horizontal:number,maximum:number){
    const image = new Image();
    image.crossOrigin="anonymous";
  
      console.log(this.intitialImgTest);
      
    this.myFullresImage = this.intitialImgTest;
    image.src = this.intitialImgTest
    let canvas = document.createElement('canvas');
    image.onload = ()=> {
      // Set the canvas dimensions to match the thumbnail size
      let imgRes = this.imgType(image.height,image.width,horizontal,potrait,maximum);
      console.log({imgRes});
      

      canvas.width = imgRes.width;
      canvas.height = imgRes.height;
    
      // Get the 2D rendering context of the canvas
      let ctx = canvas.getContext('2d');
    
      if(ctx){
        console.log("drawn");
        
      ctx.drawImage(image, 0, 0, imgRes.width, imgRes.height);  
      let thumbnailDataURL = canvas.toDataURL('image/jpeg');
      this.tempThumbHolder = this.myThumbnail;
       this.myThumbnail = thumbnailDataURL; 
      }
    }
    
  }

  adjustImg(){
    console.log("worked");
    let hostElement = this.elementRef.nativeElement as HTMLElement;
    let shadowRoot = hostElement.shadowRoot;
    let ngxEle = shadowRoot?.querySelector('.ngxImageZoomContainer');
    let thumbImg = ngxEle?.querySelector('.ngxImageZoomThumbnail');
    this.renderer.setStyle(ngxEle,'width','500px');
    this.renderer.setStyle(ngxEle,'height','500px');
    this.renderer.setStyle(thumbImg,'height','31rem')
  }

  resetThumbnail(){
    let hostElement = this.elementRef.nativeElement as HTMLElement;
    let shadowRoot = hostElement.shadowRoot;
    let ngxEle = shadowRoot?.querySelector('.ngxImageZoomContainer');
    let thumbImg = ngxEle?.querySelector('.ngxImageZoomThumbnail');
    this.renderer.setStyle(ngxEle,'width','400px');
    this.renderer.setStyle(ngxEle,'height','400px');
    this.renderer.setStyle(thumbImg,'height','25rem')
  }

  setFullScreenThumbnail(status:boolean){
    if(status){
      this.setThumbnail(600,600,600)
    }else{
      this.myThumbnail = this.tempThumbHolder;
    }
  }
  
}
