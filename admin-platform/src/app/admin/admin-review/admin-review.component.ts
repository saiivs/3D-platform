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
  productName:string = "";
  proStatus:string = "";
  modelerName :string = "";
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string = "";
  polygonCount!:number;
  srcFile:string = ""
  subscription!:Subscription;
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
    if(modelData.info.totalTriangleCount > 150000){
       polygonWarng = `Polygon Count Exceeded`
    }
    modelData.info.resources.forEach((obj:any) =>{
      if(obj.image){
        let format = getFileExtension(obj.mimeType);
        if(format == 'png') extnsWrng =`Png files used`
        if(obj.image.height > 2048) imgHieghtWrng = `height exceeded`
      }
    })
    if(polygonWarng || extnsWrng || imgHieghtWrng){
      this.warningMsg = [polygonWarng, extnsWrng, imgHieghtWrng].filter(Boolean).join(', ');
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
        const regex = /[^a-zA-Z0-9]/g;
        this.clientName = this.modelDetails[0].clientDetails[0].clientName.replace(regex,"_");
        this.validateGlbFile(data);
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
    this.backEnd.adminCurrProName.subscribe((proName)=>{
      this.backEnd.adminCurrModeler.subscribe((modelerName)=>{
        this.modelerName = modelerName
      })
      this.productName = proName
      this.backEnd.currentData.subscribe((clientName)=>{
        this.clientName = clientName
      })
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
   
    this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
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
      this.backEnd.pushAdminComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
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
          this.backEnd.AdminApproveModal(this.clientId,articleId).subscribe((res)=>{
            console.log({res});
            
            this.QaCommentArr[0].modalStatus = status
            this.QaCommentArr[0].adminStatus = status
          })
        }else{
          this.backEnd.rejectModal(this.clientId,articleId).subscribe((res)=>{
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
    this.router.navigate(['admin/model-FullScreen',this.articleId,this.clientId]);
  }

  downloadFile(articleId:string|undefined){
    let link = document.createElement('a');
    link.download = `file.zip`
    link.href = `${environment.staticUrl}/models/${articleId}&&${this.clientId}.glb`;
    link.target = '_blank';
    link.click()
  }

  ngOnDestroy(){
    this.subscription.unsubscribe()
  }
}
