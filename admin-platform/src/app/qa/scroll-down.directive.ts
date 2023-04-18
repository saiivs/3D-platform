import { AfterViewChecked, Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appScrollDown]'
})
export class ScrollDownDirective implements OnInit,AfterViewChecked{

  constructor(private elRef:ElementRef) { }

  ngOnInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.elRef.nativeElement.scrollTop = this.elRef.nativeElement.scrollHeight;
  }

}
