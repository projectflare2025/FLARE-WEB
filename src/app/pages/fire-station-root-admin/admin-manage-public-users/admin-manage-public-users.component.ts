import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, doc, updateDoc, deleteDoc, onSnapshot, orderBy, query } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-manage-public-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-public-users.component.html',
  styleUrls: ['./admin-manage-public-users.component.css']
})
export class AdminManagePublicUsersComponent implements OnInit {

  userList: any[] = [];
  selectedUser: any = null;
  showEditModal = false;
  isLoading = false;

  // Edit form fields
  editName = '';
  editEmail = '';
  editContact = '';
  editRole = '';
  editStatus = '';
  editIsActive = false;

  constructor(private firestore: Firestore) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  openEditModal(user: any) {
    this.selectedUser = user;
    this.editName = user.name;
    this.editEmail = user.email;
    this.editContact = user.contact;
    this.editRole = user.role;
    this.editStatus = user.status;
    this.editIsActive = user.isActive || false;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  async saveUser() {
    if (!this.selectedUser) return;
    this.isLoading = true;

    try {
      const userRef = doc(this.firestore, `users/${this.selectedUser.id}`);
      await updateDoc(userRef, {
        name: this.editName,
        email: this.editEmail,
        contact: this.editContact,
        role: this.editRole,
        status: this.editStatus,
        isActive: this.editIsActive
      });
      alert('User updated successfully!');
      this.closeEditModal();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteUser(user: any) {
    const confirmDelete = confirm(`Are you sure you want to delete ${user.name}?`);
    if (!confirmDelete) return;

    this.isLoading = true;
    try {
      const userRef = doc(this.firestore, `users/${user.id}`);
      await deleteDoc(userRef);
      alert('User deleted successfully!');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleActive(user: any) {
    const userRef = doc(this.firestore, `users/${user.id}`);
    await updateDoc(userRef, { isActive: !user.isActive });
  }
}
