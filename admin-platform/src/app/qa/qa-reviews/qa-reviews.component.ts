import { Component, ElementRef, Renderer2, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { combineLatest } from 'rxjs';
import { environment } from '../../../environments/environment';
import swal from "sweetalert2/dist/sweetalert2.js"

import '@google/model-viewer'
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-qa-reviews',
  templateUrl: './qa-reviews.component.html',
  styleUrls: ['./qa-reviews.component.css']
})
export class QaReviewsComponent implements OnInit,OnDestroy{

  @ViewChild('comntRef') comntRef:any;
  @ViewChild('chatBody') chatBodyRef!: ElementRef;
  clientDetails: Array<any> = [];
  modelerDetails: any = {};
  constructor(private backEnd : BackendService,private route:ActivatedRoute,private router:Router,private notficationService:NotificationService){

  }

  QaCommentArr:Array<any> = []
  QaComment:string = ""
  clientId:string = "";
  articleId:string = "";
  version:number = 0;
  newCmnt : any= {};
  newData :any = {};
  flag:Boolean = true;
  checkDate : string = new Date().toISOString().slice(0,10);
  userEmail = localStorage.getItem('userEmail');
  productName:string = "";
  proStatus:string = "";
  modelerName :string = "";
  modRollNo:string = '';
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string = "";
  toggleChatBtn:Boolean = false;
  polygonCount!:number ;
  materialCount!:number;
  gltfData:any = {};
  fullScreenToggle:Boolean = true;
  warningMsg:string = "";
  srcFile:string = "";
  QaTeamName:string = "";
  correctionValue:string = "";
  canCloseModal:boolean = false;
  warningShow:Boolean = true;
  correctionInvalid:string = "";
  subscription!:Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  subscription6!:Subscription
  
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
    if(modelData?.info?.totalTriangleCount > 150000){
       polygonWarng = `Polygon count exceeded`
    }
    if(!modelData.info.totalTriangleCount) invalidModel = `Invalid model detected`
    modelData.info.resources.forEach((obj:any) =>{
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
  }


  ngOnInit() {
    // this.chatService.connectToSocketServer();
    if(this.correctionValue == ""){
      this.canCloseModal = false;
    }else{
      this.canCloseModal = true;
    }
    this.subscription6 = this.route.params.subscribe(params => {
      this.clientId = params['clientId'];
      this.articleId = params['articleId'];
      this.version = params['version'];
      this.subscription = this.backEnd.getQaComments(this.clientId,this.articleId,this.version).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString('en-GB');
      
      if(data){
        this.validateGlbFile(data);
        this.clientDetails = data.modelDetails[0].clientDetails;
        this.modelerDetails = data.modelDetails[0].assignedPro.find((obj:any)=>{
            if(obj.articleId == this.articleId) return obj
          })
        this.modRollNo = this.modelerDetails.modRollno
        this.gltfData = data.gltfData.info;
        this.polygonCount = data.gltfData.info.totalTriangleCount;
        this.QaCommentArr = [...data.Arr]
        if(this.QaCommentArr[0].comments.length == 0){
          this.flag = false;
        }
        const regex = /[^a-zA-Z0-9]/g;
        this.clientName = this.clientDetails[0].clientName.replace(regex,"_")
        
        
        this.srcFile = `${environment.staticUrl}/models/${this.clientName}/${this.QaCommentArr[0]?.articleId}/version-${this.version}/${this.QaCommentArr[0]?.articleId}.glb`
        
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const utcDate = new Date(message.time); 
        const userLocalDate = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(utcDate);
        message.time = userLocalDate
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
      
      }else{ 
        this.router.navigate(['/error'])
      }
    })
    this.subscription1 = this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
    })
      // You can now use these values to update your component's state or perform actions
    });
    
  }

  scrollToBottom() {
    const chatBody = this.chatBodyRef.nativeElement;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  startQA(articleId:string,clientId:string,version:number){
    this.router.navigate(['/QA_panel',articleId,clientId,version])
  }

  viewAdminchat(articleId:string,clientId:any,version:number){
    this.toggleChatBtn = true;
    this.groupedMessages = {}
    this.subscription = this.backEnd.getAdminComment(this.clientId,this.articleId).subscribe((data)=>{
      if(data){
        this.QaCommentArr = [...data.Arr];
        if(this.QaCommentArr[0].comments.length == 0){
          this.flag = false;
        }
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString();
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

  viewModelerchat(articleId:string,clientId:any,version:number){
    this.flag = true;
    this.toggleChatBtn = false;
    this.groupedMessages = {};
    this.subscription = this.backEnd.getQaComments(this.clientId,this.articleId,this.version).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString('en-GB');
      if(data){
        this.QaCommentArr = [...data.Arr]
        if(this.QaCommentArr[0].comments.length == 0){
          this.flag = false;
        } 
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
      
      }else{ 
        this.router.navigate(['/error'])
      }
    })
  }

  getComment(event:any){
    this.QaComment = event.target.value
  }

  pushComntsModeler(){
    if(this.QaComment != ""){
      let time = new Date().toISOString();
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
    this.comntRef.nativeElement.value = ""
    this.flag = true;
   
    this.subscription2 = this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        
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
        this.flag = true;
      });
      this.comntRef.nativeElement.value = ""
      this.subscription3 = this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{

    })
    }
    }
    
    
  }

  pushComntsAdmin(){
    if(this.QaComment != ""){
      let time = new Date().toISOString();
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
   
    this.subscription1 = this.backEnd.pushAdminComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
    })
    }  
  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
  }

  updateModalStatus(articleId:string,status:string){
    if(status){
      let txt = status == 'Correction'? 'Are you certain about correcting this model?' : 'Are you sure to approve this model?'
       swal.fire({
      position: 'center',
      title: 'Confirm',
      text:  txt,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result)=>{
      if(result.value){
          this.subscription4 = this.backEnd.approveModal(this.clientId,articleId,status,localStorage.getItem('rollNo'),this.modelerDetails.assigned,this.correctionValue,this.modelerDetails.productName,this.modRollNo,this.modelerDetails.list).subscribe((res)=>{
            this.QaCommentArr[0].modalStatus = status
          })
      }else{
        if(result.dismiss === swal.DismissReason.cancel){

        }
      }
    })
    } 
  }

  checkInPut(event:any){
    if(event.target.value == "") this.canCloseModal = false;
    else this.canCloseModal =true;
    
  }
  @ViewChild('correctionInput') correction!:ElementRef;
  getCorrection(status:string,modal:any){
    this.correctionValue = this.correction.nativeElement.value;
    if(this.correctionValue != ""){
      this.subscription5 = this.backEnd.approveModal(this.clientId,this.articleId,status,localStorage.getItem('rollNo'),this.modelerDetails.assigned,this.correctionValue,this.modelerDetails.productName,this.modRollNo,this.modelerDetails.list).subscribe((res)=>{
        if(res){
          this.QaCommentArr[0].modalStatus = status
        }
      })
    }else{
      this.correctionInvalid = "Invalid correction field";
    }  
  }

  downloadFile(articleId:string){
    let link = document.createElement('a');
    
    link.href = `${environment.staticUrl}/models/${this.clientName}/${articleId}/version-${this.version}/${articleId}.glb`;
    link.target = '_blank';
    link.click()
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

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe()
    if(this.subscription6)this.subscription6.unsubscribe()
  }
}
