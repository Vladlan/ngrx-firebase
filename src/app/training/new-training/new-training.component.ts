import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { TrainingService } from '../training.service';
import { AngularFirestore } from '@angular/fire/firestore';
import 'firebase/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Exercise } from '../exercise.model';

const collectionName = 'availableExercises';

@Component({
  selector: 'app-new-training',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css']
})
export class NewTrainingComponent implements OnInit {
  exercises: Observable<Exercise[]>;

  constructor(
    private trainingService: TrainingService,
    private firestore: AngularFirestore
  ) { }

  ngOnInit() {
    this.exercises = this.firestore
      .collection(collectionName)
      .snapshotChanges()
      .pipe(map(docArray => {
        return docArray.map(doc => {
          const restProps: any = doc.payload.doc.id || {} ;
          return {
            id: doc.payload.doc.id,
            ...restProps
          };
        });
      }));
    // this.exercises = this.trainingService.getAvailableExercises();
  }

  onStartTraining(form: NgForm) {
    this.trainingService.startExercise(form.value.exercise);
  }

}
