import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManagePublicUsersComponent } from './admin-manage-public-users.component';

describe('AdminManagePublicUsers', () => {
  let component: AdminManagePublicUsersComponent;
  let fixture: ComponentFixture<AdminManagePublicUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManagePublicUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManagePublicUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
