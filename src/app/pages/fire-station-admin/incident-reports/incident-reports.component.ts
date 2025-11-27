import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RealtimeDbService } from '../../../services/realtime-db';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ref, push } from '@angular/fire/database';
import * as L from 'leaflet';

  // ------------------------------------------
// FIX: Default Leaflet marker icons (no 404)
// ------------------------------------------
const DefaultIcon = L.icon({
  iconRetinaUrl: 'images/marker-icon.png',
  iconUrl: 'images/marker-icon.png',
  shadowUrl: 'images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

(L.Marker.prototype as any).options.icon = DefaultIcon;


@Component({
  selector: 'app-incident-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-reports.component.html',
  styleUrls: ['./incident-reports.component.css']
})
export class IncidentReportsComponent implements OnInit, OnDestroy {

  /* ---------------------------
       General Properties
  --------------------------- */
  reports: any[] = [];
  loading = true;
  todayDate = '';
  sendIcon = 'images/like.png';

  private unsubscribeFn: (() => void) | null = null;
  private statusInterval: any;

  /* ---------------------------
       Chat Modal Properties
  --------------------------- */
  showMessageModal = false;
  selectedReport: any = null;
  messages: any[] = [];
  newMessage = '';
  selectedPhoto: string | null = null;
  selectedVoice: string | null = null;

  showLocationModal: boolean = false;
  selectedReportLocation: { lat: number; lng: number } | null = null;
  geofenceCount = 0;

  routingMap!: L.Map;
  geoMap!: L.Map;

  allReports: any[] = [];  // Store all reports from all categories
  selectedReportType: string = 'All Reports';  // Default dropdown selection


  /* ---------------------------
       Report Details Modal
  --------------------------- */
  showReportModal = false;
  selectedReportDetails: any = null;

  /* ---------------------------
       User Feedback Modal
  --------------------------- */
  showFeedbackModal = false;
  selectedFeedback: any = null; // { rating: number, message: string }

  /* ---------------------------
       BFP Feedback Modal
  --------------------------- */
  bfpFeedback: {
    structuresAffected: string;
    causeOfFire: string;
    fireOutTime: string;
    responders: string[];
  } = {
    structuresAffected: 'Building A, Building B',
    causeOfFire: 'Electrical Short Circuit',
    fireOutTime: '14:30',
    responders: ['John Doe', 'Jane Smith', 'Mark Lee']
  };

  showBfpFeedbackModal = false; // for testing display


  constructor(
    private rtdb: RealtimeDbService,
    private cdr: ChangeDetectorRef
  ) {}

  /* ---------------------------
       Lifecycle Hooks
  --------------------------- */
ngOnInit() {
  const stationId = sessionStorage.getItem('stationDocId');
  if (!stationId) return;

  const categories = ['FireReport', 'OtherEmergencyReport', 'EmergencyMedicalServicesReport', 'SmsReport'];

  let firstReportAdded = false;

  categories.forEach(category => {
    this.rtdb.listenToReports(stationId, category, {
      added: (r) => {
        this.addReport(r, category);

        if (!firstReportAdded) {
          firstReportAdded = true;
          this.loading = false;  // hide spinner as soon as first report arrives
        }
      },
      changed: (r) => this.updateReport(r, category),
      removed: (id) => this.removeReport(id)
    });
  });
}





  ngOnDestroy() {
    if (this.unsubscribeFn) this.unsubscribeFn();
    if (this.statusInterval) clearInterval(this.statusInterval);
  }


  ngAfterViewInit() {
    // The map will be initialized dynamically
  }

  /* ---------------------------
       Utility Functions
  --------------------------- */
  getUserStatus(isActive: boolean, lastSeen: number): string {
    if (isActive) return 'Active now';
    if (!lastSeen) return '';

    const diffMs = Date.now() - lastSeen;
    const diffMinutesTotal = Math.floor(diffMs / 60000);

    if (diffMinutesTotal < 1) return 'Active just now';

    const hours = Math.floor(diffMinutesTotal / 60);
    const minutes = diffMinutesTotal % 60;

    let status = 'Active ';
    if (hours > 0) status += `${hours} hr${hours > 1 ? 's' : ''}`;
    if (minutes > 0) {
      if (hours > 0) status += ' ';
      status += `${minutes} min${minutes > 1 ? 's' : ''}`;
    }
    return status + ' ago';
  }

  getLocationDisplay(value: boolean): string {
    return value ? 'Yes' : 'No';
  }

  private formatReportDate(dateStr: string): string {
    // stored as "MM-dd-yyyy"
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
  }

  private scrollToBottom() {
    const container = document.querySelector('.messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  /* ---------------------------
       Chat Modal Functions
  --------------------------- */
  openMessageModal(report: any) {
    this.selectedReport = report;
    this.todayDate = this.formatReportDate(report.date);

    const messagesRef = ref(this.rtdb.db, `AllReport/FireReport/${report.id}/messages`);
    this.messages = [];
    this.rtdb.listenToMessages(messagesRef, (msg) => {
      if (!this.messages.find(m => m.timestamp === msg.timestamp)) {
        this.messages.push(msg);
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });

    this.showMessageModal = true;
    this.updateSendIcon();
  }

  closeMessageModal() {
    this.showMessageModal = false;
    this.newMessage = '';
    this.selectedReport = null;
    this.selectedPhoto = null;
    this.selectedVoice = null;
  }

  onMessageInputChange() {
    this.updateSendIcon();
  }

  private updateSendIcon() {
    this.sendIcon = (this.newMessage.trim() || this.selectedPhoto || this.selectedVoice)
      ? 'images/send.png'
      : 'images/like.png';
  }

  sendMessage() {
    if (!this.newMessage.trim() && !this.selectedPhoto && !this.selectedVoice) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const newMsg = {
      sender: 'Station',
      text: this.newMessage || null,
      photoBase64: this.selectedPhoto || null,
      voiceBase64: this.selectedVoice || null,
      time: `${hours}:${minutes}`,
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime()
    };

    const messagesRef = ref(this.rtdb.db, `AllReport/FireReport/${this.selectedReport.id}/messages`);
    push(messagesRef, newMsg)
      .then(() => {
        this.newMessage = '';
        this.selectedPhoto = null;
        this.selectedVoice = null;
        this.updateSendIcon();
      })
      .catch(err => console.error("Failed to send message", err));
  }

addReport(report: any, category: string) {
  const reportWithType = { ...report, typeCategory: category };

  // Prevent duplicates
  const exists = this.allReports.some(r => r.id === reportWithType.id);
  if (!exists) {
    this.allReports.unshift(reportWithType);
    this.filterReports();
  }
}

updateReport(updatedReport: any, category: string) {
  const index = this.allReports.findIndex(r => r.id === updatedReport.id);
  if (index !== -1) {
    this.allReports[index] = { ...updatedReport, typeCategory: category };
    this.filterReports();
  }
}



// Remove a report
removeReport(reportId: string) {
  this.allReports = this.allReports.filter(r => r.id !== reportId);
  this.filterReports();
}

// Filter reports based on dropdown selection
filterReports() {
  if (this.selectedReportType === 'All Reports') {
    this.reports = [...this.allReports];
  } else {
    const typeMap: any = {
      'Fire Report': 'FireReport',
      'Other Emergency Report': 'OtherEmergencyReport',
      'Emergency Medical Services Report': 'EmergencyMedicalServicesReport',
      'Sms Report': 'SmsReport'
    };
    const category = typeMap[this.selectedReportType];
    this.reports = this.allReports.filter(r => r.typeCategory === category);
  }
}


openLocationModal(report: any) {
  console.log('Opening location modal for report:', report);

  if (report.latitude == null || report.longitude == null) {
    console.error('Report has missing latitude or longitude!');
    return;
  }

  this.selectedReportLocation = {
    lat: report.latitude,
    lng: report.longitude
  };

  console.log('Selected report location:', this.selectedReportLocation);

  this.showLocationModal = true;

  // Wait for modal to appear in DOM
  setTimeout(() => this.initializeMapsSafely(), 50);
}


initializeMapsSafely(): void {
  const routingDiv = document.getElementById('routingMap');
  const geofenceDiv = document.getElementById('geofenceMap');

  if (!routingDiv || !geofenceDiv) {
    setTimeout(() => this.initializeMapsSafely(), 50);
    return;
  }

  this.initRoutingMap();
  this.initGeofenceMap();

  // Let DOM settle, then invalidate sizes
  setTimeout(() => {
    if (this.routingMap) this.routingMap.invalidateSize();
    if (this.geoMap) this.geoMap.invalidateSize();
    console.log('Routing map size:', routingDiv.offsetWidth, routingDiv.offsetHeight);
    console.log('Geofence map size:', geofenceDiv.offsetWidth, geofenceDiv.offsetHeight);
  }, 300);
}


initRoutingMap() {
  if (!this.selectedReportLocation) {
    console.error('No selected report location for routing map!');
    return;
  }

  const { lat, lng } = this.selectedReportLocation;
  console.log('Initializing routing map at:', lat, lng);

  if (this.routingMap) this.routingMap.remove();

  this.routingMap = L.map('routingMap', { zoomControl: true }).setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(this.routingMap);

  L.marker([lat, lng]).addTo(this.routingMap);
  console.log('Routing map marker added');
}

initGeofenceMap() {
  if (!this.selectedReportLocation) {
    console.error('No selected report location for geofence map!');
    return;
  }

  const { lat, lng } = this.selectedReportLocation;
  console.log('Initializing geofence map at:', lat, lng);

  if (this.geoMap) this.geoMap.remove();

  this.geoMap = L.map('geofenceMap').setView([lat, lng], 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(this.geoMap);

  L.marker([lat, lng]).addTo(this.geoMap);
  console.log('Geofence map marker added');

  this.geofenceCount = 0;
}


closeLocationModal() {
  this.showLocationModal = false;

  if (this.routingMap) {
    this.routingMap.remove();
    this.routingMap = null as any;
  }

  if (this.geoMap) {
    this.geoMap.remove();
    this.geoMap = null as any;
  }
}


  /* ---------------------------
       Report Details Modal Functions
  --------------------------- */
  openReportModal(report: any) {
    this.selectedReportDetails = report;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.selectedReportDetails = null;
  }

  /* ---------------------------
       User Feedback Modal Functions
  --------------------------- */
  openFeedbackModal(feedback: any) {
    this.selectedFeedback = feedback;
    this.showFeedbackModal = true;
  }

  closeFeedbackModal() {
    this.showFeedbackModal = false;
    this.selectedFeedback = null;
  }

  /* ---------------------------
       BFP Feedback Modal Functions
  --------------------------- */
  openBfpFeedbackModal(report?: any) {
    this.selectedReportDetails = report;
    this.showBfpFeedbackModal = true;
  }


  closeBfpFeedbackModal() {
    this.showBfpFeedbackModal = false;
    this.selectedReportDetails = null;
  }

}
