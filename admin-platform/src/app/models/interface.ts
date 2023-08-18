import { Types } from 'mongoose'

export interface user{
  email:string,
  password:string
}

export interface userRes {
  token:string,
  userRole:string,
  userEmail:string,
  password?:Boolean,
  userExist?:Boolean,
  rollNo:string,
  userName:string
}

export interface csvRecord{
  slNo?:string,
  articleId? :string,
  productName? : string,
  productLink? : string
}

export interface client{
  _id :Types.ObjectId,
  clientName:string,
  productCount: string,
  status:string,
  account_Manager:string,
  project_deadline:string,
  internal_deadline:string,
  per?:number
}

export interface clientandBudget{
  data:client[],
  budgetData:number,
  productDetails:any[]
}

export interface products{
  _id:Types.ObjectId,
  clientId:Types.ObjectId,
  productList:productList[],
  budgetValue:number,
  requirement:any[]
}

export interface productList{
  QaTeam:string,
  adminStatus:string,
  approved:Boolean,
  articleId:string,
  assigned:string,
  isSelected:Boolean,
  productLink:string,
  productName:string,
  productStatus:string,
  slno:string,
  price:string,
  priceAdded?:Boolean,
  Reff?:string,
  tag:string,
  modRollno:string,
  version?:number,
  reallocate?:Boolean,
  additionalInfo?:Boolean,
  extraInfo?:string,
  list?:number|null
}

export interface team{
  QAarr:[],
  modelersAr:[]
}

export interface message{
  Arr:[],
  polygonCount:number
}

export interface messageInfo{
  adminStatus:String,
  articleId:String,
  clientId:string,
  comments:any[],
  modalStatus:string,
  _id:Types.ObjectId
}

export interface modelerLanding{
  clientData:Array<any>,
  modelerData:Array<any>,
  QATeamName:string,
  approvedClient:Boolean,
  assignedPro:[],
  clientId:string,
  modelerName:string,
  modelerRollNo:string,
  _id:string,
  modalFile?:any,
  listCompleted?:string
}

export interface QaLanding{
  clientData:Array<string>,
  approvedClient:Boolean,
  assignedPro:[],
  clientId:string,
  _id:string
  
}

export interface correctionData {
  correction:string, 
}

export interface warning {
  warningData: {}
}

export interface cmntData {
  adminStatus:string,
  articleId:string,
  clientId:Types.ObjectId,
  comments:any[],
  modalStatus:string,
  _id:Types.ObjectId
}

export interface model {
  QaTeam:string,
  adminStatus:string,
  approved:false,
  articleId:string|Boolean,
  clientId:Types.ObjectId,
  date:string,
  invoice: Boolean,
  isSelected:Boolean,
  modRolllno:string,
  price:number,
  priceAdded:boolean,
  productLink:string
  productName:String,
  productStatus:string,
  slNo:string,
}

export interface userInfo{
  email:string,
  name:string,
  password:string,
  role:string,
  phone:string,
  address:string,
  about?:string,
  aboutStatus?:boolean
}




