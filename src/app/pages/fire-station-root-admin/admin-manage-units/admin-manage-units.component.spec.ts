import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageUnitsComponent } from './admin-manage-units.component';

describe('AdminManageUnits', () => {
  let component: AdminManageUnitsComponent;
  let fixture: ComponentFixture<AdminManageUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageUnitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageUnitsComponent);
    component = fixture.componentInstance;AdminManageUnitsComponent
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
