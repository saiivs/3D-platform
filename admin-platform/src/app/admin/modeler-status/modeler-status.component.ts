import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';
import { DatePipe } from '@angular/common';
import ApexCharts from 'apexcharts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modeler-status',
  templateUrl: './modeler-status.component.html',
  styleUrls: ['./modeler-status.component.css']
})
export class ModelerStatusComponent implements OnInit {

  modelerArr: Array<string> = [];
  modelCountArr: Array<any> = [];
  clientList: Array<any> = [];
  allModelers: Array<any> = [];
  totalRecords: number = 0;
  totalExpence: number = 0;
  serachForModel: string = "";
  page: number = 1;
  budget: number = 0;
  budgetExceeded: string = ""
  noMonthlyStatus: Boolean = false;
  emptyData:boolean = false;


  constructor(private backEnd: BackendService, private router: Router) {

  }

  ngOnInit(): void {
    this.backEnd.getClientandExpense().subscribe((res) => {
      if (res.status) {
        this.emptyData = false;
        this.clientList = [...res.clients];
        this.budget = res.budget;
        let expense = 0;
        for (let client of this.clientList) {
          for (let obj of res.exp) {
            if (obj._id == client._id) {
              client.exp = obj.expense
              expense += obj.expense;
            }
          }
        }
        this.totalExpence += expense;
        this.backEnd.getModelersStatus().subscribe((data) => {
          this.allModelers = [...data.allModelers];
          console.log(this.allModelers);
          
          if (this.allModelers.length != 0) {
            this.totalRecords = this.allModelers.length;
            this.allModelers = this.allModelers.map((obj) => {
              let approvedCnt = 0;
              let totalModel = obj.models.length;
              obj.models.forEach((model: any) => {
                approvedCnt += model.productStatus == 'Approved' ? 1 : 0;
              })
              let completionPercentage = (approvedCnt / totalModel) * 100;
              completionPercentage = Number(completionPercentage.toFixed(2))
              return { ...obj, percentage: completionPercentage }
            })
            console.log(this.allModelers);
            
          }
          if (data.models.length == 0) {
            this.noMonthlyStatus = true;
          }
          else {
            for (let item of data.models) {
              this.modelerArr.push(item.name);
              this.modelCountArr.push(item.count)
            }
            let optionsBarChart = {
              series: [
                {
                  name: "Models",
                  data: this.modelCountArr,
                },
              ],
              chart: {
                fontFamily: "Manrope, sans-serif",
                type: "bar",
                height: 150,
                toolbar: {
                  show: false,
                },
                zoom: {
                  enabled: false,
                },
              },
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  horizontal: true,
                },
              },
              labels: {
                style: {
                  fontSize: "14px",
                },
              },
              dataLabels: {
                enabled: false,
              },

              grid: {
                borderColor: "#DFE6E9",
                row: {
                  opacity: 0.5,
                },
              },
              fill: {
                opacity: 1,
                type: "solid",
              },
              stroke: {
                show: true,
                width: 4,
                curve: "straight",
                colors: ["transparent"],
              },
              xaxis: {
                axisTicks: {
                  show: false,
                },
                tickAmount: 5,
                labels: {
                  style: {
                    colors: ["636E72"],
                    fontSize: "14px",
                  },
                },
                categories: this.modelerArr,
              },
              legend: {
                horizontalAlign: "right",
                offsetX: 40,
                position: "top",
                markers: {
                  radius: 12,
                },
              },
              colors: ["#0063F7"],

              yaxis: {
                reversed: document.body.classList.contains('direction-end') ? true : false,
                labels: {
                  style: {
                    colors: ["#636e72"],
                    fontSize: "14px",
                  },
                },
              },
            };
            const chart = new ApexCharts(
              document.querySelector("#bar-chart"),
              optionsBarChart
            );

            chart.render();
          }
        })
      }else{
        this.emptyData = true;
      }

    })

  }

  dateInputValue(date: string) {
    this.backEnd.submitDate(date).subscribe((data) => {
      if (data.length == 0) {
        this.noMonthlyStatus = true;
      } else {
        this.noMonthlyStatus = false;
        for (let item of data) {
          this.modelerArr.push(item.name);
          this.modelCountArr.push(item.count)
        }

        let optionsBarChart = {
          series: [
            {
              name: "Models",
              data: this.modelCountArr,
            },
          ],
          chart: {
            fontFamily: "Manrope, sans-serif",
            type: "bar",
            height: 150,
            toolbar: {
              show: false,
            },
            zoom: {
              enabled: false,
            },
          },
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: true,
            },
          },
          labels: {
            style: {
              fontSize: "14px",
            },
          },
          dataLabels: {
            enabled: false,
          },

          grid: {
            borderColor: "#DFE6E9",
            row: {
              opacity: 0.5,
            },
          },
          fill: {
            opacity: 1,
            type: "solid",
          },
          stroke: {
            show: true,
            width: 4,
            curve: "straight",
            colors: ["transparent"],
          },
          xaxis: {
            axisTicks: {
              show: false,
            },
            tickAmount: 5,
            labels: {
              style: {
                colors: ["636E72"],
                fontSize: "14px",
              },
            },
            categories: this.modelerArr,
          },
          legend: {
            horizontalAlign: "right",
            offsetX: 40,
            position: "top",
            markers: {
              radius: 12,
            },
          },
          colors: ["#0063F7"],

          yaxis: {
            reversed: document.body.classList.contains('direction-end') ? true : false,
            labels: {
              style: {
                colors: ["#636e72"],
                fontSize: "14px",
              },
            },
          },
        };
        const chart = new ApexCharts(
          document.querySelector("#bar-chart"),
          optionsBarChart
        );

        chart.render();
      }


    })

  }

  clientModelerList(name: string) {
    this.router.navigate(['admin/client_modelers', name])
  }

  sendClientName() {

  }
}
