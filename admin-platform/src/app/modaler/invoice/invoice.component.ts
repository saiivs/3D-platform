import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';

import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,private toaster:ToastrService,private notificatinService:NotificationService){

  }

  approvedModels:Array<any> = [];
  templateData:Array<any> = [];
  bankDetails:Array<any> = [];
  invoiceNumber:any = localStorage.getItem('invoiceId')|| false;
  modelerRollNo:any = localStorage.getItem('userRoll')
  modelerName:string = '';
  modelerObjectId:string = ''
  totalPrice:number = 0;
  Bonus:number = 0;
  Error:string = '';
  listTracker:Array<any> = [];
  clients:Array<any> = [];
  curDate:Date = new Date();
  subTotal:number = 0;
  bonus:number = 0;
  invoiceAllreadyCreated:Boolean = false;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  

  ngOnInit() {
    if(!this.invoiceNumber){
      console.log("startingggggg");
      
    this.invoiceNumber = `#${this.curDate.getTime()}-${Math.random().toString(36).substring(2, 7)}-${localStorage.getItem('rollNo')}` 
    }else{
      this.invoiceNumber = localStorage.getItem('invoiceId') || null
    }
    this.subscription1 = this.backEnd.generateInvoice(localStorage.getItem('rollNo')).subscribe((res)=>{
      console.log("crating invoice");
      console.log(res);
      
      
      this.modelerObjectId = res[0]._id;
      this.modelerName = res[0].modelerName;
      // this.clients = res[0].clientDetails;
      this.approvedModels = res[0].models;
      this.bankDetails = res[0].bankDetails;
      // if(localStorage.getItem('invoiceId')){
      //   this.approvedModels;
      // }
      this.approvedModels.forEach((client)=>{
        let totalPrice = 0;
        client.models = client.models.filter((model:any)=>{
          totalPrice += model.productStatus == 'Approved' && model.invoice == false ? model.price : 0; 
          return model.productStatus == 'Approved'
        })
        // sdfasf
        if(client.complete && client.eligibleForBonus && client.invoicedList == false){
          let obj = {
            clientId:client.clientId,
            list:client.list,
            modRollNo:res[0].rollNo
          }
          this.listTracker.push(obj)
          let totalPriceForBonus = 0
          if(client.models.length > 0){
            let completeDate = new Date(client.completeDate);
            let deadLineOne = new Date(client.deadLineOne);
            let deadLineTwo = new Date(client.deadLineTwo);
            if(deadLineOne && completeDate.getDate()<=deadLineOne.getDate() && completeDate.getMonth()<=deadLineOne.getMonth() && completeDate.getFullYear()<=deadLineOne.getFullYear()){
              client.bonus = 50;
            }else if(completeDate.getDate()<=deadLineTwo.getDate( )&& completeDate.getMonth()<=deadLineTwo.getMonth() && completeDate.getFullYear()<=deadLineTwo.getFullYear()){
              client.bonus = 30;
            }else{
              client.bonus = 0;
            }
          }else{
            client.bonus = 0;
          }
          if(client.bonus != 0){
            client.models.forEach((model:any)=>{
              totalPriceForBonus += model.price; 
            })
            let percentageAmount = totalPriceForBonus * (client.bonus/100);
            this.bonus += percentageAmount;
           
            this.totalPrice += totalPrice;
          }else{
            this.totalPrice += totalPrice;
          }
          }else{
            this.totalPrice += totalPrice;
          }
          client.models = client.models.filter((model:any)=>{
            return model.productStatus == 'Approved' && model.invoice == false;
          })
      })
      if(this.totalPrice == 0){
        this.invoiceAllreadyCreated = true;
      }
    })
    this.subscription2 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
      this.notificatinService.setNotificationDAta(data);
    })
  }

  getSubTotalWithBonus(){
    return this.totalPrice + this.bonus;
  }

  downLoadSavedInvoice(){
    let link = document.createElement('a');
    link.download = ""
    link.href = `${environment.staticUrl}/invoices/${encodeURIComponent(this.invoiceNumber)}.pdf`;
    link.target = '_blank';
    link.click()
  }

  @ViewChild('invoiceContent') content!:ElementRef;

  createPdf(){
    let invoice = this.content.nativeElement;
    html2canvas(invoice,{}).then(canvas =>{
      let imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("p","mm","a4"); 
      const pageWidth = 210;
      const pageheight = 297;
      pdf.addImage(imgData,'PNG',0,0,pageWidth,pageheight);
      pdf.save('invoice.pdf');

      const blob = pdf.output('blob');
     
      const file = new File([blob], 'invoice.pdf', { type: 'application/pdf' });

      const formData = new FormData();
      formData.append("pdfFile", file,"invoice.pdf");
      formData.append("invoiceId",this.invoiceNumber);
      formData.append("modelerId",this.modelerObjectId);
      formData.append("modelerRollNo",this.modelerRollNo);
      const bonus = this.bonus.toString();
      formData.append("bonus",bonus)
      this.subscription3 = this.backEnd.saveModelerInvoice(formData).subscribe((res)=>{
        if(res){
          localStorage.setItem('invoiceId',this.invoiceNumber)
        }  
        this.subscription4 = this.backEnd.updateInvoicedList(this.listTracker).subscribe((res)=>{

        })
      })
    }) 
  }

ngOnDestroy(): void {
  localStorage.removeItem('invoiceId');
  if(this.subscription1)this.subscription1.unsubscribe()
  if(this.subscription2)this.subscription2.unsubscribe()
  if(this.subscription3)this.subscription3.unsubscribe()
  if(this.subscription4)this.subscription4.unsubscribe()
}
  }

  


