import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { client } from 'src/app/models/interface';
import { csvData , clientData} from '../../csvRecord';
import { BackendService } from '../../services/backend.service';


@Component({
  selector: 'app-admin-landing-page',
  templateUrl: './admin-landing-page.component.html',
  styleUrls: ['./admin-landing-page.component.css']
})
export class AdminLandingPageComponent implements OnInit,OnDestroy {

  constructor(private titleService : Title,private toastr: ToastrService,private backEndService:BackendService){

  }

  title:string = "Admin-Clients"
  csvFile!:File[]
  records:any[] = []
  csvArr:any[] = []
  csvData:any={}
  csvFileName:string = ""
  clientTableData:client[] = []
  newClientTableData:any = []
  totalRecords!:number
  page:number = 1
  nonPagination:Boolean = true;
  subscription!:Subscription;
  


  ngOnInit(){
    this.titleService.setTitle(this.title)
    this.subscription = this.backEndService.getClient().subscribe((data)=>{
        this.clientTableData = [...data]
        this.totalRecords = this.clientTableData.length; 
    })
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr:any){
    let headerRow = (<string>csvRecordsArr[0]).split(",");
    return headerRow
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArr:any[],headerArrLen:number):any{
    let flag = true;

    for (let i=1;i<csvRecordsArr.length;i++){
      let currRecord = (<string>csvRecordsArr[i]).split(',')

      if(currRecord.length == headerArrLen){
        let csvFileData:csvData = new csvData()
        csvFileData.slNo = currRecord[0]
        csvFileData.articleID = currRecord[1]
        csvFileData.productName = currRecord[2]
        csvFileData.productLink = currRecord[3]
       this.csvArr.push(csvFileData)
      }else{
        flag = false;
        break;
      }
    }
    if(!flag) return false;
    else return true;

  }

  @ViewChild("inputCsvFile") resetFile:any

  csvFileReader(event:any){

    this.csvFile = event.srcElement.files;


    if(this.isValidCSVFile(this.csvFile[0])){

      this.csvFileName = this.csvFile[0].name.replace(".csv","");
      let input = event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = ()=>{
        let csvData = reader.result;
        let csvRecordsArr = (<string>csvData).split(/\r\n|\n/);
        let headerArr = this.getHeaderArray(csvRecordsArr);

        this.getDataRecordsArrayFromCSVFile(csvRecordsArr,headerArr.length);

      }
    }else{
      this.resetFile.nativeElement.value= ""
      this.toastr.error('Error', 'Please select a csv file')
    }
  }

  uploadCsv(){
    if(this.csvFileName !=""){

    this.toastr.success('success','File successfully uploaded')

    let clientInfo:clientData = new clientData();
        clientInfo.ClientName = this.csvFileName;
        clientInfo.productCount = this.csvArr.length;
        clientInfo.status = "Not Approved"
        this.newClientTableData.push(clientInfo);
        this.backEndService.createProduct(this.csvArr,this.newClientTableData).subscribe((response)=>{
          this.clientTableData.push(response)
          window.location.reload()
          this.resetFile.nativeElement.value= ""
          this.csvArr = []
          this.newClientTableData = []
          this.csvFileName = ""
        if(this.clientTableData.length > 6){
                  this.nonPagination = false;
                }
        })

    }else{
      this.toastr.error('Error', 'Please select a file');
    }

  }

  sendClientName(name:string){
    this.backEndService.getClientName(name)
  }

  ngOnDestroy(){
    this.subscription.unsubscribe()
  }

}
