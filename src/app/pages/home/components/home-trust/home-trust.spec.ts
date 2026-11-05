import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeTrust } from './home-trust';

describe('HomeTrust', () => {
  let component: HomeTrust;
  let fixture: ComponentFixture<HomeTrust>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrust],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeTrust);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
