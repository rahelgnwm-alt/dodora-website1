import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Curve } from './curve';

describe('Curve', () => {
  let component: Curve;
  let fixture: ComponentFixture<Curve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Curve],
    }).compileComponents();

    fixture = TestBed.createComponent(Curve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
