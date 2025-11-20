import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentReportsComponent } from './incident-reports.component';

describe('IncidentReports', () => {
  let component: IncidentReportsComponent;
  let fixture: ComponentFixture<IncidentReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
