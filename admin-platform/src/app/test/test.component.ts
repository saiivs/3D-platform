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
  maxThumbnailSize:number = 400;

  imgType(originalHeight:number,originalWidth:number,maxThumbnailSize:number){
    let thumbnailWidth: number;
    let thumbnailHeight: number;

  if (originalWidth > originalHeight) {
   
    thumbnailWidth = 500;
    thumbnailHeight = Math.round((originalHeight / originalWidth) * 500);
  } else if (originalHeight > originalWidth) {
    // Portrait image
    thumbnailWidth = Math.round((originalWidth / originalHeight) * 400);
    thumbnailHeight = 400;
  } else {
    // Square image
    thumbnailWidth = thumbnailHeight = maxThumbnailSize;
  }

  return { width: thumbnailWidth, height: thumbnailHeight };

    }

  ngOnChanges(changes: SimpleChanges): void {
    
    const image = new Image();
    image.crossOrigin="anonymous";
    if(this.intitialImgTest != ""){
      console.log(this.intitialImgTest);
      
    this.myFullresImage = this.intitialImgTest;
    image.src = this.intitialImgTest
    let canvas = document.createElement('canvas');
    image.onload = ()=> {
      // Set the canvas dimensions to match the thumbnail size
      let imgRes = this.imgType(image.height,image.width,this.maxThumbnailSize);
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
    };
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
  
}
