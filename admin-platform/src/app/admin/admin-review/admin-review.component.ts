import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import swal from "sweetalert2/dist/sweetalert2.js"
import "@google/model-viewer"
import { messageInfo } from 'src/app/models/interface';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import {cmntData} from '../../models/interface'

@Component({
  selector: 'app-admin-review',
  templateUrl: './admin-review.component.html',
  styleUrls: ['./admin-review.component.css']
})
export class AdminReviewComponent implements OnInit,OnDestroy{


  @ViewChild('comntRef') comntRef:any;
  @ViewChild('chatBody') chatBodyRef!: ElementRef;
  constructor(private backEnd : BackendService,private route:ActivatedRoute,private router:Router){

  }

  QaCommentArr:cmntData[]= []
  QaComment:string = ""
  clientId:string = "";
  articleId:string = "";
  version:number = 0;
  newCmnt : any= {};
  modelDetails:Array<any> = [];
  newData :any = {}
  checkDate : string = new Date().toISOString().slice(0,10);
  userEmail = localStorage.getItem('userEmail');
  product:any = {};
  proStatus:string = "";
  modelerName :string = "";
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string = "";
  gltfData:any = {};
  polygonCount!:number;
  srcFile:string = ""
  subscription!:Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  warningMsg:string = "";

  validateGlbFile(data:any){
    let modelData = data.gltfData;
    function getFileExtension(fileName:string) {
      const extension = fileName.substring(fileName.lastIndexOf('/') + 1).toLowerCase();
      return extension;
    }
    let polygonWarng;
    let extnsWrng;
    let imgHieghtWrng;
    let invalidModel;
    if(modelData.info.totalTriangleCount > 150000){
       polygonWarng = `Polygon count exceeded`
    }else{
      invalidModel = `Invalid model detected`
    }
    modelData.info.resources.forEach((obj:any) =>{
      if(obj.image){
        let format = getFileExtension(obj.mimeType);
        if(format == 'png') extnsWrng =`PNG files used`
        if(obj.image.height > 2048) imgHieghtWrng = `High resolution is used`
      }
    })
    if(polygonWarng || extnsWrng || imgHieghtWrng || invalidModel){
      this.warningMsg = [polygonWarng, extnsWrng, imgHieghtWrng, invalidModel].filter(Boolean).join(', ');
      localStorage.setItem("ModelWarning",this.warningMsg);
    }else{
      localStorage.removeItem("ModelWarning");
    }
  }


  ngOnInit() {
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version'];
    this.subscription = this.backEnd.getAdminComment(this.clientId,this.articleId).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString('en-GB');
      if(data){
        this.modelDetails = [...data.modelDetails];
        console.log(this.modelDetails);
        this.product = data.modelDetails[0].assignedPro.find((obj:any)=>{
          if(obj.articleId == this.articleId) return obj
        })
        const regex = /[^a-zA-Z0-9]/g;
        this.clientName = this.modelDetails[0].clientDetails[0].clientName.replace(regex,"_");
        this.validateGlbFile(data);
        this.gltfData = data.gltfData.info;
        this.polygonCount = data.gltfData.info.totalTriangleCount;
        this.QaCommentArr = [...data.Arr];
        console.log(this.QaCommentArr);
        
        this.srcFile = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString('en-GB');
          if (!this.groupedMessages[date]) {
            this.groupedMessages[date] = [];
          }
          this.groupedMessages[date].push(message);
        }); 
        setTimeout(()=>{
          this.scrollToBottom()
        },10)
      }
    })
  }

  scrollToBottom() {
    const chatBody = this.chatBodyRef.nativeElement;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  getComment(event:any){
    this.QaComment = event.target.value
  }

  pushComnts(){
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true, hourCycle: 'h12' })
    let pushObj = {
      date:this.currentDate,
      time:time,
      user:localStorage.getItem('userEmail'),
      cmnt:this.QaComment
    }
    if(this.QaCommentArr[0].comments.length != 0){
    if (!this.groupedMessages[this.currentDate]) {
      this.groupedMessages[this.currentDate] = [];
    }
    this.groupedMessages[this.currentDate].push(pushObj);
    console.log(this.groupedMessages);    
    this.comntRef.nativeElement.value = ""
   
    this.subscription1 = this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);
    })

    }else{
      this.QaCommentArr[0].comments.push(pushObj);
      this.QaCommentArr[0]?.comments.forEach((message: any) => {
        const conDate = new Date(message.date)
        const date = new Date(conDate).toLocaleDateString('en-GB');
        if (!this.groupedMessages[this.currentDate]) {
          this.groupedMessages[this.currentDate] = [];
        }
        this.groupedMessages[this.currentDate].push(message);
      });
      this.comntRef.nativeElement.value = ""
      this.subscription2 = this.backEnd.pushAdminComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);
    })
    }

  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
  }

  
  updateModalStatus(articleId:string|undefined,status:string){
    swal.fire({
      position: 'center',
      title: 'Confirm',
      text:  `Are your sure to ${status} this modal?`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result)=>{
      if(result.value){
        if(status == "Approved"){
         this.subscription3 = this.backEnd.AdminApproveModal(this.clientId,articleId).subscribe((res)=>{
            this.QaCommentArr[0].modalStatus = status
            this.QaCommentArr[0].adminStatus = status
          })
        }else{
          this.subscription4 = this.backEnd.rejectModal(this.clientId,articleId).subscribe((res)=>{
            this.QaCommentArr[0].modalStatus = "Correction"
            this.QaCommentArr[0].adminStatus = status
          })
        }    
      }else{
        if(result.dismiss === swal.DismissReason.cancel){

        }
      }
    })
  }

  fullScreenMode(){
    this.router.navigate(['admin/model-FullScreen',this.articleId,this.clientId,this.version]);
  }

  downloadFile(articleId:string|undefined){
    let link = document.createElement('a');
    link.download = `file.zip`
    link.href = `${environment.staticUrl}/models/${this.clientName}/${articleId}/version-${this.version}/${articleId}.glb`;
    link.target = '_blank';
    link.click()
  }

  ngOnDestroy(){
    if(this.subscription)this.subscription.unsubscribe()
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
  }
}
