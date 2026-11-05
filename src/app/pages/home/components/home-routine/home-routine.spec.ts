import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeRoutine } from './home-routine';

describe('HomeRoutine', () => {
  let component: HomeRoutine;
  let fixture: ComponentFixture<HomeRoutine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeRoutine],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeRoutine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
