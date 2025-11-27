import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageDriversComponent } from './admin-manage-drivers.component';

describe('AdminManageDrivers', () => {
  let component: AdminManageDriversComponent;
  let fixture: ComponentFixture<AdminManageDriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageDriversComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageDriversComponent);
    component = fixture.componentInstance;AdminManageDriversComponent
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
