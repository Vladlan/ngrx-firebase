import { Exercise } from './exercise.model';
import { Subject, Subscription, from } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';
import 'firebase/firestore';
import { Store } from '@ngrx/store';
import { UIService } from '../shared/ui.service';
import * as UI from '../shared/ui.actions';
import * as fromTraining from './training.reducer';
import * as Training from './training.actions';

enum COLLECTIONS {
  availableExercises = 'availableExercises',
  finisedExcercises = 'finisedExcercises',
}

@Injectable()
export class TrainingService {
  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();
  private availableExercises: Exercise[] = [];
  private runningExercise: Exercise;
  private fbSubs: Subscription[] = [];

  constructor(
    private firestore: AngularFirestore,
    private uiService: UIService,
    private store: Store<fromTraining.State>,
  ) { }

  getAvailableExercises() {
    return this.availableExercises.slice();
  }

  fetchAvailableExercises() {
    this.store.dispatch(new UI.StartLoading());
    const fetchAvailableExercisesSub = this.firestore
      .collection(COLLECTIONS.availableExercises)
      .snapshotChanges()
      .pipe(map(docArray => {
        return docArray.map(doc => {
          const restProps: any = doc.payload.doc.data() || {};
          return {
            id: doc.payload.doc.id,
            ...restProps
          };
        });
      }))
      .subscribe(((exercises: Exercise[]) => {
        this.store.dispatch(new UI.StopLoading());
        this.store.dispatch(new Training.SetAvailableTrainings(exercises));
      }), error => {
        this.store.dispatch(new UI.StopLoading());
        this.uiService.showSnackbar('Fetching Exercises failed, please try again later', null, 3000);
        this.exercisesChanged.next(null);
      });
    this.fbSubs.push(fetchAvailableExercisesSub);
  }

  startExercise(selectedId: string) {
    this.firestore
      .doc(`${COLLECTIONS.availableExercises}/${selectedId}`)
      .update({ lastSelected: new Date() });
    this.store.dispatch(new Training.StartTraining(selectedId));
  }

  completeExercise() {
    this.store.select(fromTraining.getActiveTraining).subscribe(
      ex => {
        this.addDataToDB({
          ...ex,
          date: new Date(),
          state: 'completed'
        });
        this.store.dispatch(new Training.StopTraining());
      }
    );
  }

  cancelExercise(progress: number) {
    this.store.select(fromTraining.getActiveTraining)
    .pipe(take(1))
    .subscribe(
      ex => {
        this.addDataToDB({
          ...this.runningExercise,
          duration: ex.duration * (progress / 100),
          calories: ex.calories * (progress / 100),
          date: new Date(),
          state: 'cancelled'
        });
        this.store.dispatch(new Training.StopTraining());
      }
    );
  }

  fetchCompletedOrCancelledExercises() {
    const fetchComplOrCancelExercisesSub = this.firestore
      .collection(COLLECTIONS.finisedExcercises)
      .valueChanges()
      .subscribe((exercises: Exercise[]) => {
        this.store.dispatch(new Training.SetFinishedTrainings(exercises));
      });
    this.fbSubs.push(fetchComplOrCancelExercisesSub);
  }

  cancelSubscriptions() {
    this.fbSubs.forEach((sub: Subscription) => sub.unsubscribe());
  }

  private addDataToDB(exercise: Exercise) {
    this.firestore
      .collection(COLLECTIONS.finisedExcercises)
      .add(exercise);
  }
}
