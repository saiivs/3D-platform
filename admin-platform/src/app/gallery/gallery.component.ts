import { Component, ElementRef, EventEmitter, OnInit, Renderer2, ViewChild } from '@angular/core';
import '@google/model-viewer'

import { BackendService } from '../services/backend.service';
import { environment } from '../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { TestComponent } from '../test/test.component';
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit{

  constructor(private backEndService:BackendService,private route : ActivatedRoute,private renderer:Renderer2){

  }

  articleId:string = "";
  clientId:string = "";
  src:string = "";
  noImgForGallery = "";
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
  imgSrc:Array<any> = [];

  galleryFn(articleId:string,clientId:string){
    this.backEndService.getClientDetailsById(clientId,articleId).subscribe((res)=>{
      this.clientDetails = res.client;
      this.product = res.clientPro
      console.log(this.product);
      
      if(res.fileCount != 0){
        for(let i = 0; i < res.fileCount; i++){
        this.imgSrc.push(`${environment.apiUrl}/images/${this.clientDetails.clientName}/${this.articleId}/${i+1}.jpg`);
        this.totalRecords = this.imgSrc.length;
      }
      this.initialImg = this.imgSrc[0];
      // this.initialImg = `http://localhost:3001/test/test.png`
      
      console.log(this.initialImg);
      
      }else{
        this.noImgForGallery = 'Image not found. Please visit the site and upload the images manually.'
      }  
    })
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['articleId'];
    this.clientId = this.route.snapshot.params['clientId'];
    this.galleryFn(this.articleId,this.clientId);
  }

  preview(imgUrl:string,index:number){
    let i = (this.page - 1) * 6 + index;
    this.initialImg = imgUrl
  }

  @ViewChild('pre',{ static: false }) preImg!:ElementRef;
  @ViewChild(TestComponent) testComponent!:TestComponent;
  fullScreen(){
    this.fullScreenIcon = !this.fullScreenIcon
    if(!this.display)
    { 
      this.renderer.setStyle(this.preImg.nativeElement,'height','39rem')
      this.mode = 'Exit Full Screen'
      this.display = true;
    }
    else{
      this.renderer.setStyle(this.preImg.nativeElement,'height','25rem')
      this.mode = 'Full Screen'
      this.display = false;
    } 
  }

  onFileSelected(event:any){
    let files = event.target.files;
    this.onSelectedFiles = Array.from(files);
  }

  onSubmit(){
    let formData = new FormData();
    let convertedFilescount = 0;
    this.onSelectedFiles.forEach((file,index)=>{
      this.convertToJpg(file,(convertedFile)=>{
        let fileName = `${index + 1}.jpg`
        formData.append('images',convertedFile,fileName);
        convertedFilescount ++;

        if (convertedFilescount === this.onSelectedFiles.length) {
          // All files have been converted and added to formData 
          this.backEndService.uploadReferenceManually(formData,this.articleId,this.clientDetails.clientName).subscribe((res) => {
            if(res){
              this.galleryFn(this.articleId,this.clientId);
            }
          });
        }
      })
    });  
  }

  convertToJpg(file:File,callback:(convertedFile:File)=>void){ 
      const reader = new FileReader();
      reader.onload = (event:ProgressEvent<FileReader>)=>{
        
        const img = new Image();
        img.onload = ()=>{
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;
          
          if(ctx){
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob:any)=>{
              let convertedFile = new File([blob],file.name + '.jpg',{
                type:'image/jpeg',
                lastModified: Date.now()
              })
              
              
              callback(convertedFile);
            },'image/jpeg',1)  
          }
          
        }
        img.src = event.target?.result as string;
      }
      reader.readAsDataURL(file);
  }

  

}
