import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeBundles } from './home-bundles';

describe('HomeBundles', () => {
  let component: HomeBundles;
  let fixture: ComponentFixture<HomeBundles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeBundles],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeBundles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
