import { Component, ElementRef, Input, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { ToastrService } from 'ngx-toastr';
import swal from "sweetalert2/dist/sweetalert2.js"
import { Types } from 'mongoose';
import { productList, team } from 'src/app/models/interface';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {

  constructor(private titleService: Title, private route: ActivatedRoute, private backEndService: BackendService, private toaster: ToastrService, private searchService: NotificationService, private router: Router) {
  }

  productId: string = "";
  products: productList[] = [];
  reactiveForm !: FormGroup;
  masterCheckBox: Boolean = false;
  isChecked: Boolean = false;
  selectionText: string = "Select All";
  modelersArr: Array<any> = [];
  QATeamArr: Array<any> = [];
  checkedItems: productList[] = [];
  modelerRollNo: string = ""
  QARollNo: string = "";
  ModelerName: string = "3D Modelers";
  QAName: string = "QA Team"
  clientName: string = "";
  clientId!: Types.ObjectId;
  totalRecords!: number;
  totalCompletedModels: number = 0;
  totalCorrectionModels: number = 0;
  page: number = 1;
  pageAllSelectTracker:Array<any> = [];
  budget: number = 0;
  tempPrice: number = 0;
  checkUrl: string = "";
  updatedBudget: number = 0;
  reallocation: boolean = false;
  totalUploadedModels: number = 0;
  totalNotUploaded: number = 0;
  tagName: string = "";
  tagList: Array<any> = [];
  addBtn: boolean = true;
  tagDropDown: boolean = false;
  tagNameDrpdown: string[] = [];
  totalPrice: number = 0;
  search: string = "";
  totalExpense:number = 0;
  remainingBudget:number = 0;
  budgetExceeded: string = "";
  priceUpdated: boolean = true;
  subscription1!: Subscription;
  subscription2!: Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;
  subscription5!:Subscription;
  subscription6!:Subscription;
  subscription7!:Subscription;
  subscription8!:Subscription;
  subscription9!:Subscription;
  subscription10!:Subscription;
  subscription11!:Subscription;
  subscription12!:Subscription;
  subscription13!:Subscription;
  subscription14!:Subscription;
  subscription15!:Subscription;
  subscription16!:Subscription;
  subscription17!:Subscription;
  subscription18!:Subscription;
  subscription19!:Subscription;
  recieved: string = "";
  exactBudget:number = 0;
  countForMasterCheckBox: number = 50;
  canClose: Boolean = false;
  requirementData: string = "";
  addRequirement: Boolean = false;
  requirementSelectFlag:Boolean = true;
  clientOverallRequirement:string = "";
  isLoading:Boolean = false;
  requirementIndex!:number;
  requirementTxt:any = "";
  globalRequirement:any = "";
  globalReqFlag:Boolean = false;
  globalBeforeEditedTxt:any = "";
  editRequirementMode:Boolean = false;
  missingInfoTitle:string = "";
  missingInfoUpdateValue = "";
  uniquefieldValue:any = "";
  missingFieldIndex:number = 0;
  clientNameForTemp:string = "";
  
  ngOnInit() {
    this.titleService.setTitle("Products");
    this.checkUrl = this.router.url;
    if (this.checkUrl.includes('/admin/products/')) {
      this.searchService.checkUrlForSearchBtn(true);
    }
    this.subscription14 = this.backEndService.currentData.subscribe((name) => {
      this.clientName = name
    })
    this.subscription15 = this.searchService.searchValue.subscribe((data) => {
      this.recieved = data;
    })

    this.productId = this.route.snapshot.params['id'];
    this.subscription1 = this.backEndService.getProlist(this.productId).subscribe((res) => {
      this.clientName = res.Arr[2].clientName;
      this.clientNameForTemp = res.Arr[2].clientName;
      this.globalRequirement = res.Arr[1].requirement ? res.Arr[1].requirement.additionalInfo : "";
      this.globalReqFlag = this.globalRequirement ? true : false;
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientName.replace(regex, '_')
      this.remainingBudget = res.Arr[1].budgetValue;
      this.budget = res.Arr[1].budgetValue;
      this.updatedBudget = res.Arr[1].budgetValue;
      this.exactBudget = res.Arr[1].exactBudget;
      this.totalExpense = res.Arr[1].totalExpense
      if(this.remainingBudget == 0){
        this.budgetExceeded = "Monthly budget has been exceeded"
        this.updatedBudget = res.Arr[1].totalExpense
      } 

      // if (res.requirement.length != 1) { 
      //   this.clientOverallRequirement = ""
      // } else {
      //   this.clientOverallRequirement = res.requirement[0].requirement
      // }
      // this.requirementData = res.requirement[0]
      this.clientId = res.Arr[0].clientId
      this.products = [...res.Arr[0].productList];
     
      // if(res.requirement.length > 1){
      //   for(let pro of this.products){
      //   for (let info of res.requirement){
      //     if(this.clientId == info.clientId&&pro.articleId==info.articleId){
      //       pro.extraInfo = info.additionalInfo
      //     }
      //   }
      // }
      // }
      
      this.subscription3 = this.backEndService.getTagCollections().subscribe((res) => {
        if (res) {
          this.tagList = [...res]
          this.tagNameDrpdown = Array(this.products.length).fill('Tags');
          this.products.forEach((obj, index) => {
            if (obj.tag) {
              this.tagNameDrpdown[index] = obj.tag;
            } else {
              obj.tag = ""
            }
          })
        }
      })
      this.totalRecords = this.products.length;
      for (let pro of this.products) {
        pro.priceAdded = false
        if (pro.price) this.totalPrice += parseInt(pro.price);
        else pro.price = ""
        
        if (pro.productStatus == 'Approved') this.totalCompletedModels++;
        else if (pro.productStatus == 'Correction') this.totalCorrectionModels++;
        else if (pro.productStatus == 'Uploaded') this.totalUploadedModels++;
        else if (pro.productStatus == 'Not Uploaded') this.totalNotUploaded++;
        pro.isSelected = false;
      }
      this.subscription2 = this.backEndService.getModalers().subscribe((modelers: team) => {
        this.QATeamArr = [...modelers.QAarr]
        this.modelersArr = [...modelers.modelersAr]
        for (let modeler of this.modelersArr) {
          modeler.isSelected = false;
        }
        for (let person of this.QATeamArr) {
          person.isSelected = false;
        }
      })
    })

    this.reactiveForm = new FormGroup({
      modelerName: new FormControl(null)
    })
    this.subscription4 = this.searchService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.searchService.setNotificationForAdmin(data);
    })
  }

  checkBoxChange() {
    this.pageAllSelectTracker[this.page] = this.masterCheckBox
    let limit = this.page * 50 - 1;
    this.products.forEach((pro, i) => {
      let count = (this.page - 1) * 50 + i
      if (count <= limit) {
        if (!this.products[count]?.assigned) {
          this.products[count].isSelected = !this.products[count].reallocate ? this.masterCheckBox : this.products[count].isSelected;
        }else if(this.products[count]?.reallocate){
          this.products[count].isSelected = this.masterCheckBox;
        }else if(this.products[count]?.additionalInfo){
          this.products[count].isSelected = this.masterCheckBox;
        }
        if (this.masterCheckBox) {
          this.selectionText = " Unselect All"
        } else {
          this.selectionText = " Select All"
        }
      }
    })
  }

  onPageChange(event: number) {
    this.page = event;
    this.masterCheckBox = this.pageAllSelectTracker[event];
  }

  MultiSelectionModeler(index: any, rollNo: string) {
    let ArrIndex = index;
    this.modelerRollNo = rollNo
    this.ModelerName = `${this.modelersArr[ArrIndex].name}(3D)`
    for (let index in this.modelersArr) {
      if (index != ArrIndex) {
        this.modelersArr[index].isSelected = false;
      } else {
        this.modelersArr[index].isSelected = true;
      }
    }
  }

  MultiSelectionQA(index: any, rollNo: string) {
    let ArrIndex = index;
    this.QARollNo = rollNo
    this.QAName = `${this.QATeamArr[ArrIndex].name}(QA)`
    
    for (let index in this.QATeamArr) {
      if (index != ArrIndex) {
        this.QATeamArr[index].isSelected = false;
      } else {
        this.QATeamArr[index].isSelected = true;
      }
    }
  }

  selectModeForRequirements(){
    let startIndex = (this.page - 1) * 50;
    let endIndex = startIndex + 50;
    this.addRequirement = true;
    this.requirementSelectFlag = false;
    for(let i = startIndex;i <= endIndex; i++){
      if(this.products[i].assigned){
        this.products[i].additionalInfo = true;
        this.products[i].isSelected = true;
      }
    }
  }

  aditionalInfoDilog(info:string){
    swal.fire({
      title: '',
      icon: 'info',
      html:`${info}`,
      showCloseButton: false,
      showCancelButton: false,
      focusConfirm: false,
    })
  }

  modalReview(articleId:string,clientId:any,version:any){
    this.router.navigate(['admin/reviews',articleId,clientId,version])
  }

  aasignProduct() {
    this.isChecked = false;
    let retainBudget = 0
    
    this.checkedItems = this.products.filter(pro => pro.isSelected == true);  
    
      
    if(this.reallocation){
      this.checkedItems = this.checkedItems.filter((pro)=>{
        if (pro.isSelected && !pro.assigned) {
          pro.isSelected = false;
        }
        return pro.isSelected && pro.assigned
      })

      this.checkedItems.forEach((pro)=>{
        retainBudget += Number(pro.price);
      })
      this.remainingBudget += retainBudget;
      this.totalExpense -= retainBudget;
    }
    if (this.checkedItems.length != 0 && this.modelerRollNo != "" && this.QARollNo != "") {
      this.isLoading = true;
      let modeler = this.modelersArr.find(obj => obj.rollNo == this.modelerRollNo);
      let Qa = this.QATeamArr.find(obj => obj.rollNo == this.QARollNo);
      swal.fire({
        position: 'center',
        title: 'Are you sure?',
        text: `Assign ${this.checkedItems.length} products to ${modeler.name} & ${Qa.name} for QA`,
        showCancelButton: true,
        confirmButtonText: 'Yes, go ahead.',
        cancelButtonText: 'cancel'
      }).then((result) => {
        if (result.value) {
         this.subscription5 = this.backEndService.assignedPro(this.checkedItems, this.modelerRollNo, this.clientId, this.QARollNo, this.reallocation).subscribe((res) => {
            if (res.status) {
              if(res.bonusEligibility){
                   swal.fire({
                      position: 'center',
                      title: `Is ${res.modeler.modelerName} eligible for bonus`,
                      text: `Please confirm.`,
                      showCancelButton: true,
                      confirmButtonText: 'Yes',
                      cancelButtonText: 'No'
                    }).then((result) => {
                      if (result.value) {
                        
                      } else if (result.dismiss === swal.DismissReason.cancel) {
                        this.subscription6 = this.backEndService.rejectBonusEligibility(res.list,res.modeler.modelerRollNo,res.modeler.clientId).subscribe((res)=>{
                          if(res) this.toaster.success('success', 'Bonus removed successfully');
                          else this.toaster.error('Error', 'Something went wrong. Please try again later');
                        })
                      }
                    })
              }
            
              this.products = this.products.filter((item) => {
                if (item.isSelected == true) {
                  item.assigned = modeler.name
                  item.QaTeam = Qa.name
                  item.modRollno = modeler.rollNo;
                  item.isSelected = false;
                  item.list = res.list
                }
                if(item.reallocate){
                  item.isSelected = false;
                  item.reallocate = false;
                  this.reallocation = false;
                  item.list = res.list
                }
                return [...this.products]
              })
              this.isLoading = false;
              for (let person of this.QATeamArr) {
                person.isSelected = false;
              }
              for (let modeler of this.modelersArr) {
                modeler.isSelected = false;
              }
              this.ModelerName = "3D Modelers";
              this.QAName = "QA Team"
              this.toaster.success('success', 'Products successfully assigned')
              this.modelerRollNo = "";
              this.QARollNo = "";
            } else {
              this.isLoading = false;
              this.toaster.error('Error', 'Something went wrong. Please try again later')
            }
          })
        } else if (result.dismiss === swal.DismissReason.cancel) {
          this.isLoading = false;
        }
      })
    } else {
      this.isLoading = false;
      this.toaster.error('Error', 'Please check the selected details');
    }
  }

  reallocateModel() {
    swal.fire({
      position: 'center',
      title: 'Are you sure to?',
      text: `Reallocate the models`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result) => {
      if (result.value) {
        let startIndex = (this.page - 1) * 50;
        let endIndex = startIndex + 50;
        this.reallocation = true;
        for(let i = startIndex;i <= endIndex; i++){
          if(this.products[i].assigned){
            this.products[i].reallocate = true;
            this.products[i].isSelected = true;
          }
        }
      } else if (result.dismiss === swal.DismissReason.cancel) {

      }
    })
  }

  modelerDeadLine(){
    this.router.navigate(['admin/client_modelers',this.clientId]);
  }

  // downloadFile(articleId:string){
  //   let link = document.createElement('a');
  //   link.download = `${this.clientName}.zip`
  //   link.href = `${environment.apiUrl}/modals/${this.clientName}/${articleId}/version-{}/.zip`;
  //   link.target = '_blank';
  //   link.click()
  // }


  nameLoad(modeler: string, pro: string) {
    this.backEndService.getAdminModeler(modeler);
    this.backEndService.getAdminPro(pro)
  }

  addBtnFn(index: number) {
    let i = (this.page - 1) * 50 + index;
    this.products[i].priceAdded = true;
  }

  EditPrice(index: number) {
    let i = (this.page - 1) * 50 + index;
    this.tempPrice = parseInt(this.products[i].price);
    this.totalExpense -= this.tempPrice;
    if(this.totalExpense < this.exactBudget) {
      this.remainingBudget = this.exactBudget - this.totalExpense;
      this.budgetExceeded = ""; 
    }else{
      this.budgetExceeded = "Monthly budget has been exceeded";
    }
    this.updatedBudget = this.totalExpense
    this.products[i].price = "";
    this.products[i].priceAdded = true;
  }

  getPrice(price: string, articleId: string, modelerRollno: string, index: number) {
    if(price){
    let i = (this.page - 1) * 50 + index;
    let priceValue = Number(price);
    let list:any = this.products[i].list;
    if(this.exactBudget != null)this.totalExpense += priceValue;
     if (this.exactBudget < this.totalExpense && this.exactBudget != null) {
      swal.fire({
        title: 'Are you sure?',
        text: "Monthly budget has been exeeded.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
      }).then((result) => {
        if (result.isConfirmed) {
          this.remainingBudget = 0;
          this.budgetExceeded = 'Monthly budget has been exceeded';
          this.subscription7 = this.backEndService.updatePrice(priceValue, this.clientId, articleId, modelerRollno,this.totalExpense,this.remainingBudget, this.budgetExceeded,list,this.exactBudget).subscribe((res) => {
            if (res) {
              this.products[i].priceAdded = false;
              this.products[i].price = price;
              this.subscription8 = this.backEndService.updateBudgetExceed().subscribe((res) => {
                
              })
            }
          })
        }else{
          this.totalExpense -= priceValue
        }
      })
    } else {
     if(this.exactBudget != null ){
      this.remainingBudget -= priceValue;
     this.subscription9 = this.backEndService.updatePrice(priceValue, this.clientId, articleId, modelerRollno,this.totalExpense,this.remainingBudget,this.budgetExceeded,list,this.exactBudget).subscribe((res) => {
        if (res) {
          this.tempPrice = 0;
          this.products[i].priceAdded = false;
          this.products[i].price = price
        }
      })
     }else{
      swal.fire('Please add the budget before adding the model price.')
     }
     
    }
    }else{
      console.log("invalid price value");
      let i = (this.page - 1) * 50 + index;
    this.products[i].priceAdded = false;
      this.toaster.error('Error', 'Please use a valid price value.');
    }
  }

  getRefference(index: number, articleId: string, ProductName: string) {
    let i = (this.page - 1) * 50 + index;
    swal.fire({
      title: 'Enter The Reference Url',
      input: 'url',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      showLoaderOnConfirm: true,
      preConfirm: (url) => {
        this.subscription10 = this.backEndService.updateRefference(url, articleId, this.clientId, ProductName).subscribe((res) => {
          if (res) {
            this.products[i].Reff = url;
            this.toaster.success('success', 'Url is updated');
          }
        })
      },
      allowOutsideClick: () => !swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
      
      }
    })
  }

  getTagName() {
    if (this.tagName) {
      this.tagList.push({ tagName: this.tagName });
      this.subscription11 = this.backEndService.createTags(this.tagName).subscribe((res) => {
        if (res) this.tagName = "";
      })
    } else {
      this.toaster.error('Error', 'Please add a tag');
    }
  }

  addTag(index: number, tagName: string, articleId: string) {
    let i = (this.page - 1) * 50 + index;
    this.tagNameDrpdown[i] = tagName;
    this.products[i].tag = tagName
    this.subscription12 = this.backEndService.assignTag(tagName, articleId, this.clientId).subscribe((res) => {
    })
  }

  @ViewChild('requirement', { static: false }) requirement!: ElementRef;
  getRequirement() {
    let prodcuts = [];
    prodcuts = this.products.filter(pro => pro.additionalInfo && pro.isSelected);
    if(prodcuts.length != 0){
    this.requirementData = this.requirement.nativeElement.value;
    if(this.requirementData != ""){
      this.subscription13 = this.backEndService.saveRequirement(this.requirementData, this.clientId,prodcuts).subscribe((res) => {
      if(res){
        this.toaster.success("success","Additional info added successfully")
        this.addRequirement = false;
        this.requirementSelectFlag = true;
        let startIndex = (this.page - 1) * 50;
        let endIndex = startIndex + 50;
        for(let i = startIndex;i <= endIndex; i++){
          if(this.products[i].additionalInfo && this.products[i].isSelected){
            this.products[i].extraInfo = this.requirementData;
          }
          if(this.products[i].additionalInfo){
            this.products[i].additionalInfo = false;
            this.products[i].isSelected = false;
          }
        }
      }else{
        this.toaster.error("Error","Something went wrong!!")
      }
    })
    }else{
      this.toaster.error("Error","Please add your requirements")
    }
    }else{
      this.toaster.error("Error","Please select the models")
    }
  }

  toggleAdditionalInfo(event:any,index:number){
    // const i = (this.page - 1) * 50 + index;
    // const isChecked = event.target.checked;
    // console.log("chec");
    // console.log(isChecked);
    
    // if(this.addRequirement){
    //   this.products[i].additionalInfo = isChecked;
    // }
  }

  addAdditionalInfo(index:number,articleId:string){
    this.requirementTxt = ""
    this.requirementIndex = (this.page - 1) * 50 + index;
  }

  viewRequirement(index:number){
    let i = (this.page - 1) * 50 + index;
    this.requirementIndex = i;
    this.requirementTxt = this.products[i].extraInfo;
  }

  submitAdditionalInfo(){
    if(this.requirementTxt){
      this.products[this.requirementIndex].extraInfo = this.requirementTxt;
      let articleId = this.products[this.requirementIndex].articleId;
      this.subscription16 = this.backEndService.addRequirement(this.requirementTxt,articleId,this.clientId).subscribe((res)=>{
    }) 
    }  
  }

  AddGlobalRequirement(){
    if(this.globalRequirement){
      this.subscription17 = this.backEndService.addGlobalRequirementForList(this.globalRequirement,this.clientId).subscribe((res)=>{
        if(res){
          this.globalReqFlag = true;
        }
      })
    }
  }

  enableEditmode(){
    this.editRequirementMode = true;
    this.globalBeforeEditedTxt = this.globalRequirement;
  }

  disableEdit(){
    this.globalRequirement = this.globalBeforeEditedTxt;
    this.editRequirementMode = false;
  }

  editRequirement(){
    this.editRequirementMode = false;
    if(this.globalRequirement){
      this.subscription18 = this.backEndService.editGlobalRequirement(this.globalRequirement,this.clientId).subscribe((res)=>{
        if(res){
          
        }
      })
    }else{
      this.globalRequirement = this.globalBeforeEditedTxt
    }
  }

  addMissingInfo(title:string,matchString:any,index:number){
    let i = (this.page - 1) * 50 + index;
    this.missingFieldIndex = i;
    this.missingInfoTitle = title;
    this.uniquefieldValue = matchString;
  }

  updateMissingInfo(){
    if(this.missingInfoUpdateValue){
      if(this.missingInfoTitle == 'ArticleId'){
       this.products[this.missingFieldIndex].articleId = this.missingInfoUpdateValue; 
      }else{
        this.products[this.missingFieldIndex].productLink = this.missingInfoUpdateValue; 
      }
      this.subscription19 = this.backEndService.updateListInfo(this.missingInfoUpdateValue,this.clientId,this.missingInfoTitle,this.uniquefieldValue).subscribe((res)=>{
      })
    }
  }

  checkValue(event: any) {
    if (event.target.value == "") {
      this.canClose = false;
    } else {
      this.canClose = true;
    }
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe() 
    if(this.subscription5)this.subscription5.unsubscribe()
    if(this.subscription6)this.subscription6.unsubscribe()
    if(this.subscription7)this.subscription7.unsubscribe()
    if(this.subscription8)this.subscription8.unsubscribe()
    if(this.subscription9)this.subscription9.unsubscribe()
    if(this.subscription10)this.subscription10.unsubscribe()
    if(this.subscription11)this.subscription11.unsubscribe()
    if(this.subscription12)this.subscription12.unsubscribe()
    if(this.subscription13)this.subscription13.unsubscribe()
    if(this.subscription14)this.subscription14.unsubscribe()
    if(this.subscription15)this.subscription15.unsubscribe()
    if(this.subscription16)this.subscription16.unsubscribe()
    if(this.subscription17)this.subscription17.unsubscribe()
    if(this.subscription18)this.subscription18.unsubscribe()
    if(this.subscription19)this.subscription19.unsubscribe()
  }
}
