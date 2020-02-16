import { Exercise } from './exercise.model';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import 'firebase/firestore';
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
  private finishedExercises: Exercise[];
  private exercises: Exercise[] = [];

  constructor(private firestore: AngularFirestore) { }

  getAvailableExercises() {
    return this.availableExercises.slice();
  }

  fetchAvailableExercises() {
    console.log('COLLECTIONS: ', COLLECTIONS);
    return this.firestore
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
        this.availableExercises = exercises;
        this.exercisesChanged.next([...this.availableExercises]);
      }));
  }

  startExercise(selectedId: string) {
    this.firestore
    .doc(`${COLLECTIONS.availableExercises}/${selectedId}`)
    .update({lastSelected: new Date()});
    this.runningExercise = this.availableExercises.find(
      ex => ex.id === selectedId
    );
    this.exerciseChanged.next({ ...this.runningExercise });
  }

  completeExercise() {
    this.addDataToDB({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed'
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDB({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled'
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  getRunningExercise() {
    return { ...this.runningExercise };
  }

  fetchCompletedOrCancelledExercises() {
    this.firestore
    .collection(COLLECTIONS.finisedExcercises)
    .valueChanges()
    .subscribe((exercises: Exercise[]) => {
      this.finishedExercisesChanged.next(exercises);
    });
  }

  private addDataToDB(exercise: Exercise) {
    this.firestore
    .collection(COLLECTIONS.finisedExcercises)
    .add(exercise);
  }
}
