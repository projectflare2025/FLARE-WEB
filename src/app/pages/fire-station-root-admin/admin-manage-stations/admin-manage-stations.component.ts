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
  where,
  doc,
  updateDoc,
  deleteDoc
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
  isEditMode = false;
  editStationId: string | null = null;

  // LISTS
  stationList: any[] = [];
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
    this.resetForm();
  }

  loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyC7cSxFiTGa54IBy8azRiVaZ2Jwj7L6EHE&callback=initMap';
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

  editStation(station: any) {
    this.isEditMode = true;
    this.editStationId = station.id;

    this.stationName = station.stationName;
    this.role = station.role;
    this.parentStationId = station.parentStationId || '';
    this.parentStationName = station.parentStationName || '';
    this.contact = station.contact;
    this.email = station.email;
    this.status = station.status;
    this.latitude = station.latitude;
    this.longitude = station.longitude;

    this.openModal();
  }

  async saveStation() {
    if (!this.stationName.trim() || !this.role || !this.contact.trim() || !this.email.trim() || !this.status) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!this.latitude || !this.longitude) {
      alert("Please select a location on the map.");
      return;
    }

    if (this.role === 'SubStation' && !this.parentStationId) {
      alert("Please select a parent Central Station.");
      return;
    }

    try {
      if (this.isEditMode && this.editStationId) {
        // ========================
        // UPDATE EXISTING STATION
        // ========================
        const stationRef = doc(this.firestore, `fireStations/${this.editStationId}`);
        const updateData: any = {
          stationName: this.stationName,
          role: this.role,
          parentStationId: this.role === 'SubStation' ? this.parentStationId : '',
          parentStationName: this.role === 'SubStation' ? this.parentStationName : '',
          contact: this.contact,
          status: this.status,
          latitude: this.latitude,
          longitude: this.longitude
        };

        // Optional password update only if provided
        if (this.password.trim()) {
          // Updating password in Auth requires admin privileges; skipping here
        }

        await updateDoc(stationRef, updateData);
        alert("Station updated successfully!");
      } else {
        // ========================
        // CREATE NEW STATION
        // ========================
        const userCred = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
        const user = userCred.user;
        await sendEmailVerification(user, { url: 'https://flare-84e13-default-rtdb.firebaseio.com', handleCodeInApp: false });

        const stationData: any = {
          stationName: this.stationName,
          role: this.role,
          parentStationId: this.role === 'SubStation' ? this.parentStationId : '',
          parentStationName: this.role === 'SubStation' ? this.parentStationName : '',
          contact: this.contact,
          email: this.email,
          status: this.status,
          latitude: this.latitude,
          longitude: this.longitude,
          authUid: user.uid,
          createdAt: new Date(),
          verificationStatus: "unverified"
        };

        const stationsRef = collection(this.firestore, 'fireStations');
        await addDoc(stationsRef, stationData);
        alert("Station created! Verification email sent.");
      }

      this.closeModal();

    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  }

  async deleteStation(station: any) {
    const confirmDelete = confirm(`Are you sure you want to delete "${station.stationName}"?`);
    if (!confirmDelete) return;

    try {
      const stationRef = doc(this.firestore, `fireStations/${station.id}`);
      await deleteDoc(stationRef);
      alert("Station deleted successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  }

  async toggleStatus(station: any) {
    const newStatus = station.status === 'Active' ? 'Inactive' : 'Active';
    const confirmToggle = confirm(`Are you sure you want to ${newStatus === 'Inactive' ? 'disable' : 'enable'} "${station.stationName}"?`);
    if (!confirmToggle) return;

    try {
      const stationRef = doc(this.firestore, `fireStations/${station.id}`);
      await updateDoc(stationRef, { status: newStatus });
      alert(`Station status updated to "${newStatus}"`);
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
    this.isEditMode = false;
    this.editStationId = null;
  }
}
