import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';  // <-- import DatePipe
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';

// Register all built-in Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [DatePipe]  // <-- important
})
export class DashboardComponent implements AfterViewInit {

  // ====== Stats (align with tiles) ======
  totalFireReports = 42;
  totalOtherReports = 31;
  totalMedicalReports = 57;
  totalOngoingReports = 5;
  totalPendingReports = 9;
  totalAllReports = this.totalFireReports + this.totalOtherReports + this.totalMedicalReports;

  lastUpdated = new Date();

  // ====== Chart references ======
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyChart') yearlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;

  monthlyChart?: Chart;
  yearlyChart?: Chart;
  categoryChart?: Chart;

  ngAfterViewInit(): void {
    this.buildMonthlyChart();
    this.buildYearlyChart();
    this.buildCategoryChart();
  }

  // ====== Chart Builders ======

  private buildMonthlyChart(): void {
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.monthlyChart = new Chart(ctx, {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Fire',
            data: [3, 4, 5, 4, 6, 5, 3, 4, 6, 7, 5, 6],
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Other',
            data: [2, 3, 2, 4, 3, 4, 5, 3, 4, 5, 3, 4],
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Medical',
            data: [4, 5, 6, 7, 6, 7, 8, 7, 6, 8, 7, 9],
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 14,
              usePointStyle: true
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.35)' }
          }
        }
      } as ChartConfiguration['options']
    });
  }

  private buildYearlyChart(): void {
    const ctx = this.yearlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = ['2021', '2022', '2023', '2024', '2025'];

    this.yearlyChart = new Chart(ctx, {
      type: 'bar' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Total Reports',
            data: [320, 365, 410, 445, 472],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.3)' }
          }
        }
      } as ChartConfiguration['options']
    });
  }

  private buildCategoryChart(): void {
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Fire', 'Other', 'Medical'],
        datasets: [
          {
            data: [
              this.totalFireReports,
              this.totalOtherReports,
              this.totalMedicalReports
            ]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true
            }
          }
        }
      } as ChartConfiguration['options']
    });
  }
}
