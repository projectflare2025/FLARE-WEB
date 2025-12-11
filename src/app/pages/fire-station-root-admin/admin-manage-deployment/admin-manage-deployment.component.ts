import {
  Component,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RealtimeDbService } from '../../../services/realtime-db';
import {
  FirestoreService,
  FireStationData,
  UnitData,
} from '../../../services/firestore.service';

import { ref, push, onValue, update } from '@angular/fire/database';

declare var google: any;

interface DeploymentRow {
  id: string;        // deploymentId (RTDB key)
  location: string;
  purpose: string;
  specificOrder: string;
  date: string;      // yyyy-MM-dd
  time: string;      // HH:mm (24hr)
  latitude: number;
  longitude: number;
  createdAt?: number;
}

interface DeploymentUnit {
  id: string;                   // RTDB key for this deployment-unit assignment
  stationId: string | null;
  stationName?: string;
  unitId: string;               // Firestore doc id in "units"
  unitName?: string;
  latitude: number | null;
  longitude: number | null;
  createdAt?: number;
}


interface ChatMessage {
  text: string;
  from: 'me' | 'unit';
  time: string;  // simple string for now (e.g. "6:10 pm")
}


@Component({
  selector: 'app-admin-manage-deployment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-deployment.component.html',
  styleUrls: ['./admin-manage-deployment.component.css'],
})
export class AdminManageDeploymentComponent implements AfterViewInit, OnInit {

  constructor(
    private rtdb: RealtimeDbService,
    private firestoreService: FirestoreService
  ) {}

  /* ===============================
     PAGE / TABLE
  =============================== */
  deploymentList: DeploymentRow[] = [];

  /* ===============================
     CREATE DEPLOYMENT MODAL
  =============================== */
  showCreateModal = false;

  // form fields
  location = '';
  purpose = '';
  specificOrder = '';
  date = '';
  time = '';

  // map for creating deployment
  latitude: number = 7.4470491296265005;
  longitude: number = 125.80912716469686;
  map: any;
  marker: any;
  googleMapsLoaded = false;

  // deployment data waiting to be saved (for new deployments)
  pendingDeployment: {
    location: string;
    purpose: string;
    specificOrder: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
    createdAt: number;
  } | null = null;

  /* ===============================
   DETAILS MODAL (EDIT)
=============================== */
  showDetailsModal = false;
  editingDeploymentId: string | null = null;

  editLocation = '';
  editPurpose = '';
  editSpecificOrder = '';
  editDate = '';
  editTime = '';

  // details modal map
  detailsMap: any;
  detailsMarker: any;
  editLatitude = 0;
  editLongitude = 0;


  /* ===============================
     ASSIGN UNITS MODAL
  =============================== */
  showAssignModal = false;
  currentDeploymentId: string | null = null;   // non-null when editing existing deployment
  currentDeploymentLat = 0;
  currentDeploymentLng = 0;

  allStations: FireStationData[] = [];
  selectedStation: FireStationData | null = null;
  stationUnits: UnitData[] = [];
  selectedUnits: UnitData[] = [];
  unitStationMap: { [unitId: string]: { stationId: string; stationName: string } } = {};

  /* ===============================
     LOCATION TRACKING MODAL
  =============================== */
  showLocationModal = false;
  selectedDeploymentForLocation: DeploymentRow | null = null;
  deploymentUnits: DeploymentUnit[] = [];
  locationMap: any;
  locationMarkers: any[] = [];
  locationUnsubscribe: (() => void) | null = null;

  showMessageModal = false;
  activeChatUnit: DeploymentUnit | null = null;

  chatDateLabel = 'Today';  // you can format real date if you want

  newMessageText = '';

  // simple local-only message list
  chatMessages: ChatMessage[] = [];

  /* ===============================
     LIFECYCLE
  =============================== */
  ngOnInit(): void {
    this.listenToDeployments();
  }

  ngAfterViewInit(): void {
    if (!(window as any).googleMapsLoaded) {
      this.loadGoogleMapsScript();
      (window as any).googleMapsLoaded = true;
    } else {
      this.googleMapsLoaded = true;
    }
  }

  /* ===============================
     LOAD DEPLOYMENTS FROM RTDB
  =============================== */
  private listenToDeployments(): void {
    const rootRef = ref(this.rtdb.db, 'DeploymentRoot');

    onValue(rootRef, (snapshot) => {
      const list: DeploymentRow[] = [];

      snapshot.forEach((child: any) => {
        const val = child.val();
        if (!val) return;

        const row: DeploymentRow = {
          id: child.key as string,
          location: val.location || '',
          purpose: val.purpose || '',
          specificOrder: val.specificOrder || '',
          date: val.date || '',
          time: val.time || '',
          latitude: val.latitude ?? 0,
          longitude: val.longitude ?? 0,
          createdAt: val.createdAt,
        };

        list.push(row);
      });

      // newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      this.deploymentList = list;
    });
  }

  /* ===============================
     GOOGLE MAPS (CREATE MODAL)
  =============================== */
  loadGoogleMapsScript(): void {
    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyC7cSxFiTGa54IBy8azRiVaZ2Jwj7L6EHE&callback=initMap';
    script.async = true;

    (window as any).initMap = () => {
      this.googleMapsLoaded = true;

      if (this.showCreateModal) {
        setTimeout(() => this.initMap(), 100);
      }
    };

    document.body.appendChild(script);
  }

  initMap(): void {
    const mapDiv = document.getElementById('deployment-map');
    if (!mapDiv || !this.googleMapsLoaded) return;

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

  /* ===============================
     CREATE DEPLOYMENT FLOW
  =============================== */
  openCreateModal(): void {
    this.resetForm();
    this.showCreateModal = true;
    setTimeout(() => this.initMap(), 200);
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  private resetForm(): void {
    this.location = '';
    this.purpose = '';
    this.specificOrder = '';
    this.date = '';
    this.time = '';
    this.latitude = 7.4470491296265005;
    this.longitude = 125.80912716469686;
  }

  async saveDeployment(): Promise<void> {
    if (
      !this.location.trim() ||
      !this.purpose.trim() ||
      !this.specificOrder.trim() ||
      !this.date ||
      !this.time
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!this.latitude || !this.longitude) {
      alert('Please click on the map to select a location.');
      return;
    }

    const createdAt = Date.now();

    // ❗ Do NOT write to RTDB yet. Just remember this deployment.
    this.pendingDeployment = {
      location: this.location,
      purpose: this.purpose,
      specificOrder: this.specificOrder,
      date: this.date,
      time: this.time,
      latitude: this.latitude,
      longitude: this.longitude,
      createdAt,
    };

    this.currentDeploymentId = null; // it's a new deployment
    this.currentDeploymentLat = this.latitude;
    this.currentDeploymentLng = this.longitude;

    this.closeCreateModal();
    await this.openAssignModal();
  }

/* ===============================
   DETAILS MODAL FLOW
=============================== */

openDetailsModal(dep: DeploymentRow): void {
  this.editingDeploymentId = dep.id;
  this.editLocation = dep.location;
  this.editPurpose = dep.purpose;
  this.editSpecificOrder = dep.specificOrder;
  this.editDate = dep.date;
  this.editTime = dep.time;

  // copy current coords
  this.editLatitude = dep.latitude;
  this.editLongitude = dep.longitude;

  this.showDetailsModal = true;

  // wait for modal DOM to render, then create map
  setTimeout(() => this.initDetailsMap(), 200);
}

initDetailsMap(): void {
  const mapDiv = document.getElementById('details-map');
  if (!mapDiv || !this.googleMapsLoaded) return;

  this.detailsMap = new google.maps.Map(mapDiv, {
    center: { lat: this.editLatitude, lng: this.editLongitude },
    zoom: 13,
  });

  this.detailsMarker = new google.maps.Marker({
    position: { lat: this.editLatitude, lng: this.editLongitude },
    map: this.detailsMap,
    draggable: true,
  });

  // click on map to move marker
  this.detailsMap.addListener('click', (e: any) => {
    this.editLatitude = Number(e.latLng.lat());
    this.editLongitude = Number(e.latLng.lng());
    this.detailsMarker.setPosition({ lat: this.editLatitude, lng: this.editLongitude });
  });

  // drag marker to move
  this.detailsMarker.addListener('dragend', (e: any) => {
    this.editLatitude = Number(e.latLng.lat());
    this.editLongitude = Number(e.latLng.lng());
  });
}


closeDetailsModal(): void {
  this.showDetailsModal = false;
  this.editingDeploymentId = null;
}

/** Save edited fields back to RTDB and local list */
async saveDetails(): Promise<void> {
  if (!this.editingDeploymentId) {
    alert('No deployment to update.');
    return;
  }

  if (
    !this.editLocation.trim() ||
    !this.editPurpose.trim() ||
    !this.editSpecificOrder.trim() ||
    !this.editDate ||
    !this.editTime
  ) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const depRef = ref(this.rtdb.db, `DeploymentRoot/${this.editingDeploymentId}`);

    await update(depRef, {
  location: this.editLocation,
  purpose: this.editPurpose,
  specificOrder: this.editSpecificOrder,
  date: this.editDate,
  time: this.editTime,
  latitude: this.editLatitude,
  longitude: this.editLongitude,
});

const idx = this.deploymentList.findIndex(d => d.id === this.editingDeploymentId);
if (idx !== -1) {
  this.deploymentList[idx] = {
    ...this.deploymentList[idx],
    location: this.editLocation,
    purpose: this.editPurpose,
    specificOrder: this.editSpecificOrder,
    date: this.editDate,
    time: this.editTime,
    latitude: this.editLatitude,
    longitude: this.editLongitude,
  };
}


    alert('Deployment details updated.');
    this.closeDetailsModal();
  } catch (err) {
    console.error('Failed to update deployment details', err);
    alert('Error updating deployment details. Check console for details.');
  }
}


  /* ===============================
     ASSIGN STATION + UNITS FLOW
  =============================== */
  async openAssignModal(): Promise<void> {
    // Allow: either editing existing (currentDeploymentId) OR new pending deployment
    if (!this.currentDeploymentId && !this.pendingDeployment) {
      alert('No deployment selected.');
      return;
    }

    this.showAssignModal = true;
    this.allStations = [];
    this.selectedStation = null;
    this.stationUnits = [];
    this.selectedUnits = [];
    this.unitStationMap = {};

    await this.loadStations();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.currentDeploymentId = null;
    this.pendingDeployment = null;
    this.selectedStation = null;
    this.stationUnits = [];
    this.selectedUnits = [];
    this.unitStationMap = {};
  }

  async loadStations(): Promise<void> {
    try {
      this.allStations = await this.firestoreService.getAllFireStations();
    } catch (err) {
      console.error('Failed to load stations', err);
      alert('Error loading fire stations.');
    }
  }

  async selectStation(station: FireStationData): Promise<void> {
    this.selectedStation = station;
    this.stationUnits = [];
    if (!station?.id) return;

    const units = await this.firestoreService.getUnitsByStation(station.id);
    this.stationUnits = units || [];

    (this.stationUnits || []).forEach(u => {
      if (u.id) {
        this.unitStationMap[u.id] = {
          stationId: station.id!,
          stationName: station.stationName || 'Unknown Station',
        };
      }
    });
  }

  isUnitSelected(unit: UnitData): boolean {
    return this.selectedUnits.some(u => u.id === unit.id);
  }

  onUnitCheckboxChange(unit: UnitData, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.isUnitSelected(unit)) {
        this.selectedUnits.push(unit);
      }
    } else {
      this.selectedUnits = this.selectedUnits.filter(u => u.id !== unit.id);
    }
  }

  async confirmAssign(): Promise<void> {
    // We must have either an existing deployment OR a pending one
    if (!this.currentDeploymentId && !this.pendingDeployment) {
      alert('No deployment to assign.');
      return;
    }
    if (this.selectedUnits.length === 0) {
      alert('Please select at least one unit.');
      return;
    }

    const ok = confirm('Are you sure you want to assign the selected units to this deployment?');
    if (!ok) return;

    try {
      let deploymentId = this.currentDeploymentId;

      // If this is a NEW deployment, create it in RTDB now
      if (!deploymentId && this.pendingDeployment) {
        const rootRef = ref(this.rtdb.db, 'DeploymentRoot');
        const depRef = await push(rootRef, {
          createdAt: this.pendingDeployment.createdAt,
          location: this.pendingDeployment.location,
          purpose: this.pendingDeployment.purpose,
          specificOrder: this.pendingDeployment.specificOrder,
          date: this.pendingDeployment.date,
          time: this.pendingDeployment.time,
          latitude: this.pendingDeployment.latitude,
          longitude: this.pendingDeployment.longitude,
        });

        deploymentId = depRef.key as string;
        this.currentDeploymentId = deploymentId;
      }

      if (!deploymentId) {
        alert('Failed to create deployment.');
        return;
      }

      const depUnitsRef = ref(
        this.rtdb.db,
        `DeploymentRoot/${deploymentId}/units`
      );

      for (const unit of this.selectedUnits) {
      const info = this.unitStationMap[unit.id];
      const stationId = info?.stationId || null;
      const stationName = info?.stationName || '';

      await push(depUnitsRef, {
        stationId,
        stationName,                         // ✅ store stationName
        unitId: unit.id,
        unitName: unit.unitName || unit.name || '',
        createdAt: Date.now(),
      });
    }


      alert('Deployment and units saved successfully.');
      this.closeAssignModal();
    } catch (err) {
      console.error('Failed to save deployment units', err);
      alert('Error saving deployment units. Check console for details.');
    }
  }

  /* ===============================
     LOCATION TRACKING FLOW
  =============================== */
  async openLocationModal(dep: DeploymentRow): Promise<void> {
    this.selectedDeploymentForLocation = dep;
    this.showLocationModal = true;

    this.deploymentUnits = [];
    this.clearLocationMarkers();

    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }

    setTimeout(() => {
      this.initLocationMap(dep);
    }, 200);

    const depUnitsRef = ref(
      this.rtdb.db,
      `DeploymentRoot/${dep.id}/units`
    );

    // Single realtime listener on RTDB path
    this.locationUnsubscribe = onValue(depUnitsRef, (snapshot) => {
      const units: DeploymentUnit[] = [];

      snapshot.forEach((child: any) => {
        const val = child.val();
        if (!val) return;

        units.push({
          id: child.key,
          stationId: val.stationId ?? null,
          stationName: val.stationName,
          unitId: val.unitId,
          unitName: val.unitName || '',
          latitude: val.latitude ?? null,
          longitude: val.longitude ?? null,
          createdAt: val.createdAt,
        });
      });

      this.deploymentUnits = units;
      this.updateLocationMarkers();
    });
  }

  initLocationMap(dep: DeploymentRow): void {
    const mapDiv = document.getElementById('deployment-location-map');
    if (!mapDiv || !this.googleMapsLoaded) return;

    this.locationMap = new google.maps.Map(mapDiv, {
      center: { lat: dep.latitude, lng: dep.longitude },
      zoom: 13,
    });

    new google.maps.Marker({
      position: { lat: dep.latitude, lng: dep.longitude },
      map: this.locationMap,
      title: 'Deployment Location',
    });

    this.updateLocationMarkers();
  }

  updateLocationMarkers(): void {
    if (!this.locationMap) return;

    // Remove old unit markers (deployment marker is not in this list)
    this.clearLocationMarkers();

    if (!this.deploymentUnits || this.deploymentUnits.length === 0) {
      // No unit markers -> keep default deployment view (zoom 13)
      if (this.selectedDeploymentForLocation) {
        this.locationMap.setCenter({
          lat: this.selectedDeploymentForLocation.latitude,
          lng: this.selectedDeploymentForLocation.longitude,
        });
        this.locationMap.setZoom(13);
      }
      return;
    }

    let hasUnitMarker = false;

    this.deploymentUnits.forEach((du, index) => {
      if (du.latitude == null || du.longitude == null) {
        // no location for this unit -> just leave it “No location set” in the list
        return;
      }

      hasUnitMarker = true;

      const pos = { lat: du.latitude, lng: du.longitude };
      const marker = new google.maps.Marker({
        position: pos,
        map: this.locationMap,
        label: `${index + 1}`,
        title: `Unit: ${du.unitName || du.unitId || 'Unknown'}`,
      });

      this.locationMarkers.push(marker);
    });

    // If there are no unit markers with coords, keep deployment zoom
    if (!hasUnitMarker && this.selectedDeploymentForLocation) {
      this.locationMap.setCenter({
        lat: this.selectedDeploymentForLocation.latitude,
        lng: this.selectedDeploymentForLocation.longitude,
      });
      this.locationMap.setZoom(13);
    }
    // Note: no fitBounds() here -> zoom stays like the Tagum-radius screenshot
  }

  clearLocationMarkers(): void {
    this.locationMarkers.forEach(m => m.setMap(null));
    this.locationMarkers = [];
  }

  closeLocationModal(): void {
    this.showLocationModal = false;
    this.selectedDeploymentForLocation = null;
    this.deploymentUnits = [];
    this.clearLocationMarkers();

    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }
  }

  openMessageModal(du: DeploymentUnit): void {
  this.activeChatUnit = du;
  this.showMessageModal = true;
  this.chatMessages = [];          // or load from DB later
  this.chatDateLabel = 'Thursday, Dec 11, 2025'; // or build dynamically
}

closeMessageModal(): void {
  this.showMessageModal = false;
  this.activeChatUnit = null;
  this.newMessageText = '';
  this.chatMessages = [];
}

sendMessage(): void {
  const text = this.newMessageText.trim();
  if (!text) return;

  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  this.chatMessages.push({
    text,
    from: 'me',
    time: timeLabel,
  });

  this.newMessageText = '';

  // TODO: here you can also push to Firestore/RTDB if you want to store messages
}

  /* ===============================
     TABLE ACTIONS
  =============================== */
  async assignFromRow(dep: DeploymentRow): Promise<void> {
    // Editing an existing deployment
    this.pendingDeployment = null;
    this.currentDeploymentId = dep.id;
    this.currentDeploymentLat = dep.latitude;
    this.currentDeploymentLng = dep.longitude;
    await this.openAssignModal();
  }

  removeDeployment(dep: DeploymentRow): void {
    const ok = confirm('Remove this deployment from the list?');
    if (!ok) return;
    this.deploymentList = this.deploymentList.filter(d => d.id !== dep.id);
    // (Optional) also delete in RTDB if you want – not implemented here.
  }
}
