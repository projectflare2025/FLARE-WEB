import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageRespondersComponent } from './admin-manage-responders.component';

describe('AdminManageResponders', () => {
  let component: AdminManageRespondersComponent;
  let fixture: ComponentFixture<AdminManageRespondersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageRespondersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageRespondersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
