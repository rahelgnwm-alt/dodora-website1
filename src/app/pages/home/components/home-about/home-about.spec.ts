import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeAbout } from './home-about';

describe('HomeAbout', () => {
  let component: HomeAbout;
  let fixture: ComponentFixture<HomeAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeAbout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeAbout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
