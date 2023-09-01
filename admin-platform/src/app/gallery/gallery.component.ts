import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import '@google/model-viewer'
import { BackendService } from '../services/backend.service';
import { environment } from '../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { TestComponent } from '../test/test.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit,OnDestroy {

  constructor(private backEndService: BackendService, private route: ActivatedRoute, private renderer: Renderer2, private changeDetectorRef: ChangeDetectorRef, private sanitizer: DomSanitizer) {

  }

  articleId: string = "";
  clientId: string = "";
  src: string = "";
  noImgForGallery = "";
  preImgHeight: number = 26;
  product: any = {};
  clientDetails: any = {};
  totalRecords!: number
  page: number = 1;
  onSelectedFiles!: File[]
  fullScreenIcon: Boolean = true;
  myFullresImage: string = "";
  myThumbnail: string = "";
  clientName: string = "";
  display: Boolean = false;
  mode: string = 'Full Screen'
  countConvertedfile: number = 0;
  initialImg: string = "";
  fileCount: Boolean = false;
  imgSrc: Array<any> = [];
  isLoading:Boolean = false;
  subscription1!:Subscription;
  subscription2!:Subscription;
 

  galleryFn(articleId: string, clientId: string) {
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails.clientName.replace(regex, "_");
      const cacheBuster = new Date().getTime();
      this.subscription1 = this.backEndService.getCountOfReferenceImages(clientId, articleId).subscribe((res) => {
        if (res != 0) {
          if(this.imgSrc.length != 0){
            for(let i= 0;i<this.onFileSelected.length;i++){
              let imgCount = this.imgSrc.length
              this.imgSrc.push(`${environment.staticUrl}/images/${this.clientName}/${this.articleId}/${imgCount + 1}.jpg?cache=${cacheBuster}`);
              this.totalRecords = this.imgSrc.length;
            }
          }else{
           for (let i = 0; i < res; i++) {
            let imgCount = this.imgSrc.length
            this.imgSrc.push(`${environment.staticUrl}/images/${this.clientName}/${this.articleId}/${imgCount + 1}.jpg?cache=${cacheBuster}`);
            this.totalRecords = this.imgSrc.length;
          }
          this.initialImg = this.imgSrc[0];
          this.noImgForGallery = "";
          this.changeDetectorRef.detectChanges();
          }  
        } else {
          this.noImgForGallery = 'Image not found. Please visit the site and upload the images manually.'
        }
      })
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['articleId'];
    this.clientId = this.route.snapshot.params['clientId'];
    this.backEndService.getClientDetailsById(this.clientId, this.articleId).subscribe((res)=>{
      this.clientDetails = res.client;
      this.product = res.clientPro
      this.backEndService.setProductLink(this.product.productLink);
      this.galleryFn(this.articleId, this.clientId);
    })
    
  }

  preview(imgUrl: string, index: number) {
    let i = (this.page - 1) * 6 + index;
    this.initialImg = imgUrl
  }

  @ViewChild('pre', { static: false }) preImg!: ElementRef;
  @ViewChild(TestComponent) testComponent!: TestComponent;
  

  fullScreen() {
    this.fullScreenIcon = !this.fullScreenIcon
    if (!this.display) {
      this.testComponent.setFullScreenThumbnail(true);
      this.renderer.setStyle(this.preImg.nativeElement, 'height', '39rem')
      this.mode = 'Exit Full Screen'
      this.display = true;
    }
    else {
      this.testComponent.setFullScreenThumbnail(false);
      this.renderer.setStyle(this.preImg.nativeElement, 'height', '26rem')
      this.mode = 'Full Screen'
      this.display = false;
    }
  }

  onFileSelected(event: any) {
    let files = event.target.files;
    this.onSelectedFiles = Array.from(files);
  }

  onSubmit() {  
    let formData = new FormData();
    if(this.onSelectedFiles){
    this.isLoading = true;
    this.onSelectedFiles.forEach((file, index) => {
      this.convertToJpg(file).then((convertedFile: any) => {
        let fileName = `${index + 1}.jpg`
        formData.append('images', convertedFile, fileName);
        this.countConvertedfile = this.countConvertedfile + 1;

        if (this.countConvertedfile === this.onSelectedFiles.length) {
          this.subscription2 = this.backEndService.uploadReferenceManually(formData, this.articleId, this.clientDetails.clientName).subscribe((res) => {

            if (res) {
              this.onSelectedFiles = [];
              this.isLoading = false;
              this.countConvertedfile = 0;
              console.log("called the fun gallery again");
              
              this.galleryFn(this.articleId, this.clientId)
            }
          });
        }
      })
        })
    } else{
      console.log("no images selected");
      
    }
  }

  convertToJpg(file: File) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;

          if (ctx) {
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob: any) => {
              let convertedFile = new File([blob], file.name + '.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              res(convertedFile)
            }, 'image/jpeg', 1)
          }
        }
        img.src = event.target?.result as string;
      }
      reader.readAsDataURL(file);
    })

  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
  }
  
}
