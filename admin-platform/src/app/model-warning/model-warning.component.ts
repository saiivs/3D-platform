import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { warning } from 'src/app/models/interface'

@Component({
  selector: 'app-model-warning',
  templateUrl: './model-warning.component.html',
  styleUrls: ['./model-warning.component.css']
})
export class ModelWarningComponent implements OnInit{

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){

  }

  ngOnInit(): void {
   
  }}
