import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import swal from "sweetalert2/dist/sweetalert2.js"
import "@google/model-viewer"
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-interactive-chat',
  templateUrl: './interactive-chat.component.html',
  styleUrls: ['./interactive-chat.component.css']
})
export class InteractiveChatComponent implements OnInit,OnDestroy {

  @ViewChild('comntRef') comntRef: any;
  @ViewChild('chatBody') chatBodyRef!: ElementRef;
  constructor(private backEnd: BackendService, private route: ActivatedRoute, private router: Router, private render: Renderer2, private elementRef: ElementRef,private notificationService:NotificationService) {

  }

  QaCommentArr: Array<any> = []
  QaComment: string = ""
  clientId: string = "";
  articleId: string = "";
  version: number = 0;
  newCmnt: any = {};
  newData: any = {}
  checkDate: string = new Date().toISOString().slice(0, 10);
  userEmail = localStorage.getItem('userEmail');
  productName: string = "";
  proStatus: string = "";
  modelerName: string = "";
  modRollNo: string = '';
  modelDetails: any = {};
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any = "";
  clientName: string = "";
  gltfData:any = {};
  polygonCount!: number;
  warningMsg: string = "";
  toggleChatBtn:Boolean = false;
  clientDetails: Array<any> = [];
  srcFile: string = "";
  QaTeamName: string = "";
  correctionValue: string = "";
  canCloseModal: boolean = false;
  flag: Boolean = true;
  correctionInvalid: string = "";
  subscription!: Subscription
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
 

  validateGlbFile(data: any) {
    let modelData = data.gltfData;
    function getFileExtension(fileName: string) {
      const extension = fileName.substring(fileName.lastIndexOf('/') + 1).toLowerCase();
      return extension;
    }
    let polygonWarng;
    let extnsWrng;
    let imgHieghtWrng;
    if (modelData.info.totalTriangleCount > 150000) {
      polygonWarng = `Polygon Count Exceeded`
    }
    modelData.info.resources.forEach((obj: any) => {
      if (obj.image) {
        let format = getFileExtension(obj.mimeType);
        if (format == 'png') extnsWrng = `PNG files used`
        if (obj.image.height > 2048) imgHieghtWrng = `High resolution is used`
      }
    })
    if (polygonWarng || extnsWrng || imgHieghtWrng) {
      this.warningMsg = [polygonWarng, extnsWrng, imgHieghtWrng].filter(Boolean).join(', ');
      localStorage.setItem("ModelWarning", this.warningMsg);
    } else {
      localStorage.removeItem("ModelWarning");
    }
  }

  ngOnInit() {
    if (this.correctionValue == "") {
      this.canCloseModal = false;
    } else {
      this.canCloseModal = true;
    }
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version']
    this.subscription = this.backEnd.getQaComments(this.clientId, this.articleId, this.version).subscribe((data) => {
      this.currentDate = new Date().toLocaleDateString('en-GB');
      if (data) {
        this.validateGlbFile(data);
        this.clientDetails = data.modelDetails[0].clientDetails;
        const regex = /[^a-zA-Z0-9]/g;
        this.clientName = this.clientDetails[0].clientName.replace(regex, "_");
        this.modelDetails = data.modelDetails[0].assignedPro.find((obj: any) => {
          if (obj.articleId == this.articleId) return obj
        });
        this.modRollNo = this.modelDetails.modRollno;
        this.gltfData = data.gltfData.info;
        this.polygonCount = data.gltfData.info.totalTriangleCount;
        this.QaCommentArr = [...data.Arr]
        if (this.QaCommentArr[0].comments.length == 0) {
          this.flag = false;
        }
        this.srcFile = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString('en-GB');
          if (!this.groupedMessages[date]) {
            this.groupedMessages[date] = [];
          }
          this.groupedMessages[date].push(message);
        });
        setTimeout(() => {
          this.scrollToBottom()
        }, 10)
      } else {
        this.router.navigate(['/error'])
      }
    })
   this.subscription1 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  scrollToBottom() {
    const chatBody = this.chatBodyRef.nativeElement;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  getComment(event: any) {
    this.QaComment = event.target.value
  }

  pushComnts() {
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, hourCycle: 'h12' })
    let pushObj = {
      date: this.currentDate,
      time: time,
      user: localStorage.getItem('userEmail'),
      cmnt: this.QaComment
    }
    if (this.QaCommentArr[0].comments.length != 0) {
      if (!this.groupedMessages[this.currentDate]) {
        this.groupedMessages[this.currentDate] = [];
      }
      this.groupedMessages[this.currentDate].push(pushObj);
      this.flag = true;
      this.comntRef.nativeElement.value = ""

      this.subscription2 = this.backEnd.pushComment(this.QaComment, this.clientId, this.articleId, localStorage.getItem('userEmail')).subscribe((res) => {

      })

    } else {
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
      this.subscription3 = this.backEnd.pushComment(this.QaComment, this.clientId, this.articleId, localStorage.getItem('userEmail')).subscribe((res) => {
      })
    }
  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
  }

  updateModalStatus(articleId: string, status: string) {
    if (status != 'Correction') {
      swal.fire({
        position: 'center',
        title: 'Confirm',
        text: `Are your sure to ${status} this model?`,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'cancel'
      }).then((result) => {
        if (result.value) {
          this.subscription4 = this.backEnd.approveModal(this.clientId, articleId, status, localStorage.getItem('rollNo'), this.modelDetails.assigned, this.correctionValue, this.modelDetails.productName, this.modRollNo,this.modelDetails.list).subscribe((res) => {
            this.QaCommentArr[0].modalStatus = status
          })
        } else {
          if (result.dismiss === swal.DismissReason.cancel) {

          }
        }
      })
    }
  }

  

  checkInPut(event: any) {
    if (event.target.value == "") this.canCloseModal = false;
    else this.canCloseModal = true;
  }

  @ViewChild('correctionInput') correction!: ElementRef;
  getCorrection(status: string, modal: any) {
    this.correctionValue = this.correction.nativeElement.value;
    if (this.correctionValue != "") {
      this.subscription5 = this.backEnd.approveModal(this.clientId, this.articleId, status, localStorage.getItem('rollNo'), this.modelDetails.assigned, this.correctionValue, this.modelDetails.productName, this.modRollNo,this.modelDetails.list).subscribe((res) => { })
    } else {

      this.correctionInvalid = "Invalid correction field";
    }
  }

  downloadFile(articleId: string) {
    let link = document.createElement('a');
    link.download = `file.glb`
    link.href = `${environment.staticUrl}/models/${articleId}&&${this.clientId}.glb`;
    link.target = '_blank';
    link.click()
  }

  fullScreenMode() {
    try {
      this.router.navigate(['QA/model-FullScreen', this.articleId, this.clientId]);
    } catch (error) {
      console.log(error);
    }
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe() 
  }
}
