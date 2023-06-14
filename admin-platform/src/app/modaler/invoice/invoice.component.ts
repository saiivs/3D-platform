import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';

import { BackendService } from 'src/app/services/backend.service';


@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit{

  constructor(private backEnd:BackendService,private toaster:ToastrService){

  }

  approvedModels:Array<any> = [];
  templateData:Array<any> = [];
  bankDetails:Array<any> = [];
  invoiceNumber:any = '';
  modelerRollNo:any = localStorage.getItem('userRoll')
  modelerName:string = '';
  modelerObjectId:string = ''
  totalPrice:number = 0;
  Bonus:number = 0;
  Error:string = '';
  clients:Array<any> = [];
  curDate:Date = new Date();
  subTotal:number = 0;
  bonus:number = 0;

  ngOnInit() {
    this.invoiceNumber = `#${this.curDate.getTime()}-${Math.random().toString(36).substring(2, 7)}-${localStorage.getItem('rollNo')}`
    this.backEnd.generateInvoice(localStorage.getItem('rollNo')).subscribe((res)=>{
      this.modelerObjectId = res[0]._id
      this.modelerName = res[0].modelerName;
      this.clients = res[0].clientDetails;
      this.approvedModels = res[0].models;
      this.bankDetails = res[0].bankDetails;

      
      this.approvedModels = this.approvedModels.filter(obj =>{
        this.totalPrice += obj.productStatus == 'Approved' ? obj.price : this.totalPrice;
        return obj.productStatus == 'Approved'||obj.invoice == false;
      });
      this.clients.forEach((client)=>{
        let name = ""
       for(let model of this.approvedModels){
        this.subTotal += model.price;
        if(model.clientId == client._id){
          if(name != client.clientName){
            model.clientName = client.clientName;
            name = client.clientName;
          }else{
            model.clientName = ""
          } 
        } 
       }
      })
    })
  }

  getSubTotalWithBonus(){
    return this.subTotal + this.bonus;
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
      this.backEnd.saveModelerInvoice(formData).subscribe((res)=>{  
      })
    }) 
  }
  }

  


