import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from '../../../environments/environment';
import '@google/model-viewer'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BehaviorSubject, Observable, Subscription ,combineLatest , find, of} from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit,OnDestroy{

  loader = new GLTFLoader();

  @ViewChild('comntRef') comntRef:any;
  @ViewChild('chatBody') chatBodyRef!: ElementRef;
  constructor(private backEnd : BackendService,private route:ActivatedRoute,private router:Router,private toaster:ToastrService,private cdRef: ChangeDetectorRef,private notificatinService:NotificationService){
    console.log("loaded");
    
  }

  articleId:string = "";
  QaCommentArr:Array<any> = []
  QaComment:string = ""
  clientId:string = "";
  newCmnt : any= {};
  flag:Boolean = true;
  newData :any = {}
  modelerDetails:any = {};
  clientDetails:Array<any> = [];
  checkDate : string = new Date().toISOString().slice(0,10);
  userEmail:string|null= localStorage.getItem('userEmail');
  productName:string = "";
  proStatus:string = "";
  pngExist:Boolean = false;
  QaName :string = "";
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string="";
  gltfData:any = {};
  polygonCount!:number;
  warningMsg:string = "";
  warningShow:Boolean = true;
  version:number = 0;
  uploadedFile!:File
  isLoading:Boolean = false;
  uploadToggle:Boolean = true;
  srcFile:string = "";
  subscription!:Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  
  // functions
  validateGlbFile(data:any){
    try {
      let modelData = data.gltfData;
    function getFileExtension(fileName:string) {
      const extension = fileName.substring(fileName.lastIndexOf('/') + 1).toLowerCase();
      return extension;
    }
    let polygonWarng;
    let extnsWrng;
    let imgHieghtWrng;
    let invalidModel;
    console.log(modelData?.info?.totalTriangleCount);
    
    if(modelData?.info?.totalTriangleCount > 150000){
       polygonWarng = `Polygon count exceeded`
    }
    if(!modelData?.info?.totalTriangleCount) invalidModel =`Invalid model detected`
    modelData?.info?.resources.forEach((obj:any) =>{
      if(obj.image){
        let format = getFileExtension(obj.mimeType);
        if(format == 'png') extnsWrng =`PNG files used`
        if(obj.image.height > 2048) imgHieghtWrng = `Higher resolution used`
      }
    })
    if(polygonWarng || extnsWrng || imgHieghtWrng || invalidModel){ 
      this.warningMsg = [polygonWarng, extnsWrng, imgHieghtWrng, invalidModel].filter(Boolean).join(', ');
      localStorage.setItem("ModelWarning",this.warningMsg);
    }else{
      localStorage.removeItem("ModelWarning");
    }
    } catch (error) {
      console.log(error);

      
    }
    
  }

  ngOnInit() {
    this.subscription5 = this.route.params.subscribe(params => {
      this.clientId = params['clientId'];
      this.articleId = params['articleId'];
      this.version = params['version'];
      // You can now use these values to update your component's state or perform actions
      this.loadglbModel();
    });
      
      this.subscription1 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
        this.notificatinService.setNotificationDAta(data);
      })
  }

  loadglbModel(){
    this.subscription = this.backEnd.getQaComments(this.clientId,this.articleId,this.version).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString('en-GB');
      if(data){
        if(data.pngExist){
          this.pngExist = true;
        } 
        this.validateGlbFile(data);
        this.clientDetails = data.modelDetails[0].clientDetails;
        this.modelerDetails = data.modelDetails[0].assignedPro.find((obj:any)=>{
          if(obj.articleId == this.articleId) return obj
        })
        console.log("asdfasdfasdfasdfasdfa");
        
        console.log(this.modelerDetails);
        
        this.gltfData = data.gltfData.info;
        this.polygonCount = data.gltfData?.info?.totalTriangleCount;
        this.QaCommentArr = [...data.Arr]
        
        if(this.QaCommentArr[0]?.comments.length == 0){
          this.flag = false;
        }
        const regex = /[^a-zA-Z0-9]/g;
         this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
        const cacheBuster = new Date().getTime();
        this.srcFile = `${environment.staticUrl}/models/${this.clientName}/${this.QaCommentArr[0]?.articleId}/version-${this.version}/${this.QaCommentArr[0]?.articleId}.glb?cache=${cacheBuster}`
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString('en-GB');
          if (!this.groupedMessages[date]) {
            this.groupedMessages[date] = [];
          }
          this.groupedMessages[date].push(message);
        });
        setTimeout(()=>{
          this.scrollToBottom();
        },10)
      }
    }) 
  }

  scrollToBottom() {
    const chatBody = this.chatBodyRef.nativeElement;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  @ViewChild('modelElement', { static: true }) modelViewerRef!: ElementRef;
  onModelLoad(){
    if(!this.pngExist){
      const model = this.modelViewerRef.nativeElement;
      try {
        let pngfile = model.toDataURL('image/png');
        this.sendScreenShot(pngfile); 
      } catch (error) {
        console.log(error);  
      }    
      } 
  }

  sendScreenShot(dataUrl:string){
    let blob = this.dataURLtoBlob(dataUrl);
    let formData = new FormData();
    formData.append('screenshot',blob,'image.png');
    formData.append('articleId',this.QaCommentArr[0]?.articleId);
    formData.append('clientId',this.QaCommentArr[0]?.clientId);
    this.subscription2 = this.backEnd.sendpngOfModel(formData).subscribe((res)=>{});
  }

  dataURLtoBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const byteString = atob(parts[1]);
    let arrayBuffer = new ArrayBuffer(byteString.length);
    let uintArray = new Uint8Array(arrayBuffer);
  
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
  
    return new Blob([arrayBuffer], { type: contentType });
  }

  getComment(event:any){
    this.QaComment = event.target.value
  }

  getGroupedMessageKeys(){
    return Object.keys(this.groupedMessages);
  }

  pushComnts(){
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true, hourCycle: 'h12' })
    let pushObj = {
        date:this.currentDate,
        time:time,
        user:localStorage.getItem('userEmail'),
        cmnt:this.QaComment
      }
    if (!this.groupedMessages[this.currentDate]) {
      this.groupedMessages[this.currentDate] = [];
    }
    this.groupedMessages[this.currentDate].push(pushObj); 
    this.flag = true;
    this.comntRef.nativeElement.value = ""
   this.subscription3 = this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);
    })  
  }

  fullScreenMode(){
    try {
      this.router.navigate(['modeler/model-FullScreen',this.articleId,this.clientId,this.version]);
    } catch (error) {
      console.log(error);  
    } 
  }

  helpCall(){
    this.subscription4 = this.backEnd.helpLine(localStorage.getItem('rollNo'),this.articleId,this.clientId).subscribe((res)=>{
      if(res.status){
        if(res.data == 'New') this.toaster.success('success','Lead 3D artist will contact you soon!');
        else this.toaster.success('success','Lead 3D artist will contact you soon!');  
      }   
    })
  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe()
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe() 
  }

  isValidZipFile(file: any):boolean{
    if(file.name.endsWith(".zip")||file.name.endsWith(".glb")){
      return true
    }else{
      return false
    }
  }

  getModelFile(event:any){
    if(this.isValidZipFile(event.target.files[0])){
      this.uploadToggle = false;
      this.uploadedFile = event.target.files[0]
   }else{
     this.toaster.error('Error', 'Please select a .glb file')
   }
  }

  reset(){
    this.uploadToggle = true
    }

uploadModel(){
  this.isLoading = true;
  const formData = new FormData();
  let list = this.modelerDetails.list;
  formData.append('file',this.uploadedFile,this.uploadedFile.name);
  formData.append('id',this.articleId);
  formData.append('clientId',this.clientId)
  formData.append('modRollNo',localStorage.getItem('rollNo')||"");
  formData.append('list',list)
  this.subscription2 = this.backEnd.uploadModal(formData).subscribe((res)=>{
    if(res.status){
      this.isLoading = false;
      this.uploadToggle = true;
      this.version = res.version;
      this.loadglbModel();
      this.toaster.success('success','model successfully uploaded');
      
    }else{
      this.isLoading = false;
      this.toaster.error('Error','Sorry model is under QA.');
    }
  })
    }
}
