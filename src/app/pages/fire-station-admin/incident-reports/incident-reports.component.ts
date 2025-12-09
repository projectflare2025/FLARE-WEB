import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { RealtimeDbService } from '../../../services/realtime-db';
import { FirestoreService, FireStationData, DriverData } from '../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ref, push } from '@angular/fire/database';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
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

interface UiReport {
  id: string;
  typeCategory: string;
  date: string;
  name: string;
  read: boolean;
  userFeedback?: {
    rating: number;
    message: string;
  };
}


@Component({
  selector: 'app-incident-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-reports.component.html',
  styleUrls: ['./incident-reports.component.css']
})
export class IncidentReportsComponent implements OnInit, OnDestroy {


  @ViewChild('routingMapDiv', { static: false }) routingMapDiv!: ElementRef;
  @ViewChild('geofenceMapDiv', { static: false }) geofenceMapDiv!: ElementRef;

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
  stationName: string | null = null;
  isRead: boolean = false;
  isNotifRead: boolean = false;
  messageType: string = "text"

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
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private firestoreService: FirestoreService   // <-- add this
  ) {}

  /* ---------------------------
       Lifecycle Hooks
  --------------------------- */
ngOnInit() {
    const stationId = sessionStorage.getItem('stationDocId');
  this.stationName = sessionStorage.getItem('stationName'); // <-- add this
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

            // --- Normalize Android keys ---
        msg.photoBase64 = msg.photoBase64 || msg.imageBase64 || null;
        msg.voiceBase64 = msg.voiceBase64 || msg.audioBase64 || null;

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
      timestamp: now.getTime(),
      stationName: this.stationName || null,
      isRead: this.isRead || false,
      isNotifRead: this.isNotifRead || false,
      messageType: this.messageType || null
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
  const currentUserDocId = sessionStorage.getItem('userDocId');
  console.log('Current User Doc ID:', currentUserDocId);
  console.log('Raw report.UserFeedback:', report.UserFeedback);

  let userFeedback = { rating: 0, message: 'No message provided' };

  if (report.UserFeedback) {
    if (currentUserDocId && report.UserFeedback[currentUserDocId]) {
      userFeedback = {
        rating: report.UserFeedback[currentUserDocId].rating || 0,
        message: report.UserFeedback[currentUserDocId].message || 'No message provided'
      };
    } else {
      // pick the first feedback available
      const firstKey = Object.keys(report.UserFeedback)[0];
      const firstFeedback = report.UserFeedback[firstKey];
      userFeedback = {
        rating: firstFeedback.rating || 0,
        message: firstFeedback.message || 'No message provided'
      };
    }
  }

  console.log('Processed userFeedback:', userFeedback);

  const reportWithType: UiReport = {
    ...report,
    typeCategory: category,
    userFeedback
  };

  const exists = this.allReports.some(r => r.id === reportWithType.id);
  if (!exists) {
    this.allReports.unshift(reportWithType);
    this.filterReports();
  }
}

getStarColor(rating: number): string {
  if (rating >= 4) return 'green';       // Good rating
  if (rating >= 2) return 'yellow';      // Medium rating
  return 'red';                           // Low rating
}



updateReport(updatedReport: any, category: string) {
  const currentUserDocId = sessionStorage.getItem('userDocId');

  const userFeedback = currentUserDocId && updatedReport.UserFeedback && updatedReport.UserFeedback[currentUserDocId]
    ? {
        rating: updatedReport.UserFeedback[currentUserDocId].rating || 0,
        message: updatedReport.UserFeedback[currentUserDocId].message || 'No message provided'
      }
    : { rating: 0, message: 'No message provided' };

  const index = this.allReports.findIndex(r => r.id === updatedReport.id);
  if (index !== -1) {
    this.allReports[index] = {
      ...updatedReport,
      typeCategory: category,
      userFeedback
    };
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

  console.log('Checking map divs...');
  if (!routingDiv) console.warn('Routing map div NOT found!');
  if (!geofenceDiv) console.warn('Geofence map div NOT found!');
  if (!routingDiv || !geofenceDiv) {
    console.log('Retrying initializeMapsSafely in 50ms...');
    setTimeout(() => this.initializeMapsSafely(), 50);
    return;
  }

  console.log('Both map divs found. Initializing maps...');
  this.initRoutingMap();
  this.initGeofenceMap();

  setTimeout(() => {
    console.log('Invalidating map sizes...');
    if (this.routingMap) {
      console.log('Routing map div size:', routingDiv.offsetWidth, routingDiv.offsetHeight);
      this.routingMap.invalidateSize();
    }
    if (this.geoMap) {
      console.log('Geofence map div size:', geofenceDiv.offsetWidth, geofenceDiv.offsetHeight);
      this.geoMap.invalidateSize();
    }
  }, 300);
}

initRoutingMap() {
  if (!this.selectedReportLocation) {
    console.error('No selected report location for routing map!');
    return;
  }

  const { lat, lng } = this.selectedReportLocation;
  console.log('Initializing routing map at:', lat, lng);

  if (this.routingMap) {
    console.log('Removing previous routing map instance');
    this.routingMap.remove();
  }

  const mapDiv = document.getElementById('routingMap');
  console.log('Routing map div size before map init:', mapDiv?.offsetWidth, mapDiv?.offsetHeight);

  // Initialize the routing map
  this.routingMap = L.map('routingMap', {
    center: [lat, lng],
    zoom: 15,
    dragging: false,          // disable dragging
    touchZoom: false,         // disable pinch zoom on mobile
    scrollWheelZoom: false,   // disable scroll wheel zoom
    doubleClickZoom: false,   // disable double click zoom
    boxZoom: false,
    keyboard: false,
    zoomControl: false         // optionally hide the zoom buttons
  });

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(this.routingMap);

  // Add marker
  L.marker([lat, lng]).addTo(this.routingMap);

  console.log('Routing map initialized and marker added');
}

initGeofenceMap() {
  if (!this.selectedReportLocation) {
    console.error('No selected report location for geofence map!');
    return;
  }

  const { lat, lng } = this.selectedReportLocation;
  console.log('Initializing geofence map at:', lat, lng);

  if (this.geoMap) {
    console.log('Removing previous geofence map instance');
    this.geoMap.remove();
  }

  const mapDiv = document.getElementById('geofenceMap');
  console.log('Geofence map div size before map init:', mapDiv?.offsetWidth, mapDiv?.offsetHeight);

  this.geoMap = L.map('geofenceMap', { zoomControl: true }).setView([lat, lng], 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(this.geoMap);

  L.marker([lat, lng]).addTo(this.geoMap);
  console.log('Geofence map initialized and marker added');

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
openFeedbackModal(report: any) {
  console.log('Opening feedback modal for report:', report);
  console.log('report.userFeedback:', report.userFeedback);
  this.selectedFeedback = report.userFeedback || { rating: 0, message: 'No message provided' };
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

  /* ---------------------------
       Accept Modal Properties
--------------------------- */
showAcceptModal = false;
allStations: FireStationData[] = [];  // includes main station + sub stations
currentStation: FireStationData | null = null;

/* ---------------------------
       Accept Modal Functions
--------------------------- */
async openAcceptModal() {
  this.allStations = []; // clear previous data
  await this.loadStations();  // populate main + sub stations
  this.showAcceptModal = true; // now show the modal
}


closeAcceptModal() {
  this.showAcceptModal = false;
}

async loadStations() {
  const stationDocId = sessionStorage.getItem('stationDocId');
  if (!stationDocId) return;

  // Get main station
  const mainStation = await this.firestoreService.getFireStationByEmail(sessionStorage.getItem('email') || '');
  if (mainStation) {
    this.currentStation = mainStation;
    this.allStations.push(mainStation);

    console.log('🔥 Main Station:', {
      name: mainStation['stationName'] ?? 'N/A',
      id: mainStation['id'] ?? 'N/A'
    });
  }

  // Get sub stations
  const subStations = await this.firestoreService.getSubStationsByParent(stationDocId);
  this.allStations.push(...subStations);

  console.log('🔥 Substations:', subStations.map(s => ({
    name: s['stationName'] ?? 'N/A',
    id: s['id'] ?? 'N/A'
  })));
}


// IncidentReportsComponent.ts
selectedStation: FireStationData | null = null;
stationDrivers: DriverData[] = [];


async selectStation(station: FireStationData) {
  this.selectedStation = station;
  if (!station?.id) return;

  // Fetch drivers for this station
  this.stationDrivers = await this.firestoreService.getDriversByStation(station.id);

  console.log('Drivers for', station.stationName, ':', this.stationDrivers);
}


}
