import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from '@angular/fire/auth';

import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where
} from '@angular/fire/firestore';

declare var google: any;

@Component({
  selector: 'app-admin-manage-stations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-stations.component.html',
  styleUrls: ['./admin-manage-stations.component.css'],
})
export class AdminManageStationsComponent implements AfterViewInit {

  constructor(private firestore: Firestore, private auth: Auth) {
    this.loadStations();
    this.loadCentralStations();
  }

  // MODAL
  showModal = false;

  // MAIN LIST
  stationList: any[] = [];

  // CENTRAL STATION DROPDOWN LIST
  centralStations: any[] = [];

  // FORM FIELDS
  stationName = '';
  role = '';
  parentStationId = '';
  parentStationName = '';
  contact = '';
  email = '';
  password = '';
  status = 'Active';

  // MAP
  latitude: number = 7.4470491296265005;
  longitude: number = 125.80912716469686;
  map: any;
  marker: any;

  ngAfterViewInit() {
    if (!(window as any).googleMapsLoaded) {
      this.loadGoogleMapsScript();
      (window as any).googleMapsLoaded = true;
    }
  }

  openModal() {
    this.showModal = true;
    setTimeout(() => this.initMap(), 200);
  }

  closeModal() {
    this.showModal = false;
  }

  // GOOGLE MAPS
  loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyBfiCPwDDMv2qMzTf9J3opEaRCKQJdrFGE&callback=initMap';
    script.async = true;
    (window as any).initMap = () => {};
    document.body.appendChild(script);
  }

  initMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    this.map = new google.maps.Map(mapDiv, {
      center: { lat: this.latitude, lng: this.longitude },
      zoom: 13,
    });

    this.marker = new google.maps.Marker({
      position: { lat: this.latitude, lng: this.longitude },
      map: this.map,
      draggable: false,
    });

    this.map.addListener('click', (e: any) => {
      this.latitude = Number(e.latLng.lat());
      this.longitude = Number(e.latLng.lng());
      this.marker.setPosition({ lat: this.latitude, lng: this.longitude });
    });
  }

  // LOAD ALL FIRE STATIONS
  loadStations() {
    const stationsRef = collection(this.firestore, 'fireStations');
    const q = query(stationsRef, orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
      this.stationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  // LOAD ONLY CENTRAL STATIONS (FOR SUBSTATION DROPDOWN)
  loadCentralStations() {
    const stationsRef = collection(this.firestore, 'fireStations');
    const q = query(stationsRef, where('role', '==', 'Central'));

    onSnapshot(q, (snapshot) => {
      this.centralStations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  setParentStationName() {
  const station = this.centralStations.find(c => c.id === this.parentStationId);
  this.parentStationName = station ? station.stationName : '';
}

async saveStation() {

  // =============================
  // REQUIRED FIELD VALIDATION
  // =============================

  if (!this.stationName.trim()) {
    alert("Station Name is required.");
    return;
  }

  if (!this.role) {
    alert("Please select a Role.");
    return;
  }

  if (this.role === 'SubStation' && !this.parentStationId) {
    alert("Please select a Parent Central Station.");
    return;
  }

  if (!this.contact.trim()) {
    alert("Contact Number is required.");
    return;
  }

  if (!this.email.trim()) {
    alert("Email is required.");
    return;
  }

  if (!this.password.trim()) {
    alert("Password is required.");
    return;
  }

  if (!this.status) {
    alert("Please select a Status.");
    return;
  }

  if (!this.latitude || !this.longitude) {
    alert("Please select a location on the map.");
    return;
  }

  // =============================
  // CONFIRMATION
  // =============================

  const confirmSave = confirm("Are you sure you want to save this fire station?");
  if (!confirmSave) return;

  try {
    // Create Auth Account
    const userCred = await createUserWithEmailAndPassword(
      this.auth,
      this.email,
      this.password
    );
    const user = userCred.user;

    // Email Verification
    await sendEmailVerification(user, {
      url: 'https://flare-tagum-web-app-51c7a.firebaseapp.com',
      handleCodeInApp: false,
    });

    // Firestore Data
    const stationData: any = {
      stationName: this.stationName,
      role: this.role,
      contact: this.contact,
      email: this.email,
      status: this.status,
      latitude: this.latitude,
      longitude: this.longitude,
      verificationStatus: "unverified",
      authUid: user.uid,
      createdAt: new Date(),
    };

    if (this.role === 'SubStation') {
      stationData.parentStationId = this.parentStationId;
      stationData.parentStationName = this.parentStationName;
    }

    // Save to Firestore
    const stationsRef = collection(this.firestore, 'fireStations');
    await addDoc(stationsRef, stationData);

    alert("Fire Station Created! Verification email sent.");
    this.closeModal();
    this.resetForm();

  } catch (error: any) {
    console.error(error);
    alert(error.message);
  }
}


  resetForm() {
    this.stationName = '';
    this.role = '';
    this.parentStationId = '';
    this.parentStationName = '';
    this.contact = '';
    this.email = '';
    this.password = '';
    this.status = 'Active';
    this.latitude = 7.4470491296265005;
    this.longitude = 125.80912716469686;
  }
}

