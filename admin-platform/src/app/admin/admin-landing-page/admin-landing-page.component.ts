import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import swal from "sweetalert2/dist/sweetalert2.js"
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { client } from 'src/app/models/interface';
import { csvData, clientData } from '../../csvRecord';
import { BackendService } from '../../services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';
import * as Papa from 'papaparse';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-landing-page',
  templateUrl: './admin-landing-page.component.html',
  styleUrls: ['./admin-landing-page.component.css']
})
export class AdminLandingPageComponent implements OnInit, OnDestroy {

  constructor(private titleService: Title, private toastr: ToastrService, private backEndService: BackendService, private searchService: NotificationService,private router:Router) {

  }

  title: string = "Admin-Clients"
  csvFile!: File[]
  records: any[] = []
  csvArr: any[] = []
  csvData: any = {}
  csvFileName: string = ""
  clientTableData: client[] = []
  newClientTableData: any = []
  totalRecords!: number
  page: number = 1
  nonPagination: Boolean = true;
  AddBtn: Boolean = true;
  Acc_Manager: string = ""
  budget: number = 0;
  isLoading:Boolean = false;
  bonus:number = 0;
  subscription!: Subscription;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  subscription6!:Subscription;
  subscription7!:Subscription;

  ngOnInit() {
    this.titleService.setTitle(this.title)
    this.searchService.checkUrlForSearchBtn(false);
    this.subscription = this.backEndService.getClient().subscribe((data) => {
      this.clientTableData = data.data      
      this.clientTableData = this.clientTableData.filter(client => client.status != 'Approved')
      data.productDetails.forEach(() => {
        for (let model of data.productDetails) {
          let clientId = model._id;
          let modelDetailIndex = data.data.findIndex(obj => obj._id == clientId);
          let modelDetail = this.clientTableData[modelDetailIndex];

          if (modelDetail) {
            let proCount = parseInt(modelDetail.productCount);
            let approvedcount = model.count;
            if (approvedcount == 0) {
              this.clientTableData[modelDetailIndex].per = 0;
            } else {
              let percentage = ((approvedcount / proCount) * 100).toFixed(2);
              this.clientTableData[modelDetailIndex].per = Number(percentage);
            }
          }
        }
      })
      this.budget += data.budgetData
      this.totalRecords = this.clientTableData.length;
    })
    this.subscription1 = this.searchService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.searchService.setNotificationForAdmin(data);
    })
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr: any) {
    let headerRow = (<string>csvRecordsArr[0]).split(",");
    return headerRow
  }

  toCamelCase(str: string) {
    let words = str.trim().split(/\s+/);
    let camelWords = words.map(function (word, index) {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    let camelCaseString = camelWords.join('');
    return camelCaseString;
  }

  @ViewChild("inputCsvFile") resetFile: any

  csvFileReader(event: any) {
    this.csvFile = event.srcElement.files;
    if (this.isValidCSVFile(this.csvFile[0])) {
      this.csvFileName = this.csvFile[0].name.replace(".csv", "");
      Papa.parse(event.target.files[0], {
        header: true,
        complete: (results) => {
          let headers = results.meta.fields || []
          let headerLength = 0;
          if (headers) {
            headerLength = headers.length;
            if (headerLength == 4) {
              const data = results.data;  
              data.forEach((row: any,index:number) => {
               for(let key in row){
                if(row.hasOwnProperty(key) && row[key] === ""){
                  row[key] = `No data-${index + 1}`
                }
               }
                let isEmptyRow = Object.values(row).every((value) => {
                  return value === undefined || value === '';
                });
               
                if (!isEmptyRow) {
                  let csvFileData: csvData = new csvData();
                  headers.forEach((header) => {
                    let camelCaseHeader = this.toCamelCase(header);
                    csvFileData[camelCaseHeader] = row[header];
                  });
                  this.csvArr.push(csvFileData);
                }
              });
            } else {
              this.resetFile.nativeElement.value = ""
              this.toastr.error('Error', 'Please check the number of rows')
            }
          }
        },
        error: (error) => {
          console.error(error);
        },
      })
    } else {
      this.resetFile.nativeElement.value = ""
      this.toastr.error('Error', 'Please select a csv file')
    }
  }

  uploadCsv() {
    this.isLoading = true;
    if (this.csvFileName != "") {
      this.toastr.success('success', 'File successfully uploaded')
      let clientInfo: clientData = new clientData();
      clientInfo.clientName = this.csvFileName;
      clientInfo.productCount = this.csvArr.length;
      clientInfo.status = "Not Approved"
      this.newClientTableData.push(clientInfo);
      this.subscription2 = this.backEndService.createProduct(this.csvArr, this.newClientTableData).subscribe((response) => {
        this.isLoading = false;
        if(response.exist){
          let existingClient = this.clientTableData.find(client => client.clientName == response.client.clientName)
         if(existingClient) existingClient.productCount += this.csvArr.length;
        }else{
          this.clientTableData.push(response.client)
        }
        this.resetFile.nativeElement.value = ""
        this.csvArr = []
        this.newClientTableData = []
        this.csvFileName = ""
        if (this.clientTableData.length > 6) {
          this.nonPagination = false;
        }
      })

    } else {
      this.isLoading = false;
      this.toastr.error('Error', 'Please select a file');
    }
  }

  AddManager(name: string, clientId: any, index: number) {
    let i = (this.page - 1) * 6 + index;
    this.subscription3 = this.backEndService.addClientManager(name, clientId).subscribe((res) => {
      if (res) {
        this.AddBtn = false;
        this.clientTableData[i].account_Manager = name;
      }
    })
  }

  setInternalDeadline(event: any, clientId: any) {
    let date = event.target.value;
    this.subscription4 = this.backEndService.setDeadLine(date, clientId, 'Internal').subscribe((res) => {

    })
  }

  setProjectDeadline(event: any, clientId: any) {
    let date = event.target.value;
    this.subscription5 = this.backEndService.setDeadLine(date, clientId, 'Project').subscribe((res) => {

    })
  }

  viewProList(clientId:any){
    this.router.navigate(['admin/products',clientId])
  }

  @ViewChild('budgetPrice') budgetPrice!: ElementRef;
  addBudget() {
    if(this.budgetPrice.nativeElement.value){
      this.budget = this.budgetPrice.nativeElement.value;
      this.subscription6 = this.backEndService.createBudget(this.budget).subscribe((res) => {
        this.budgetPrice.nativeElement.value = ''
    }) 
    }
  }

  deleteClientList(clientId:any){
    swal.fire({
      position: 'center',
      title: 'Are you sure?',
      text: `delete this client`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result) => {
      if (result.value) {
        this.subscription7 = this.backEndService.deleteClient(clientId).subscribe((res)=>{
      if(res){
        this.clientTableData = this.clientTableData.filter(client => client._id != clientId);
        this.toastr.success('success', 'client list deleted')
      }
    })
      } else if (result.dismiss === swal.DismissReason.cancel) {

      }
    })
   
  }

  ngOnDestroy() {
    if(this.subscription)this.subscription.unsubscribe() 
    if(this.subscription1)this.subscription1.unsubscribe() 
    if(this.subscription2)this.subscription2.unsubscribe() 
    if(this.subscription3)this.subscription3.unsubscribe() 
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe() 
    if(this.subscription6)this.subscription6.unsubscribe() 
    if(this.subscription7)this.subscription7.unsubscribe() 
  }

}
