import {
  START_TRAINING,
  STOP_TRAINING,
  SET_AVAILABLE_TRAININGS,
  SET_FINISHED_TRAININGS,
  TrainingActions,
} from './training.actions';
import { Exercise } from './exercise.model';
import * as fromRoot from '../app.reducer';
import { createFeatureSelector, createSelector } from '@ngrx/store';

export interface TrainingState {
  availableExercises: Exercise[];
  finishedExercises: Exercise[];
  activeTraining: Exercise;
}

const initialState: TrainingState = {
  availableExercises: [],
  finishedExercises: [],
  activeTraining: null,
};

export interface State extends fromRoot.State {
  training: TrainingState;
}

export function trainingReducer(state = initialState, action: TrainingActions) {
  switch (action.type) {
    case SET_AVAILABLE_TRAININGS:
      return {
        ...state,
        availableExercises: action.payload
      };
    case SET_FINISHED_TRAININGS:
      return {
        ...state,
        finishedExercises: action.payload
      };
    case START_TRAINING:
      return {
        ...state,
        activeTraining: {
          ...state.availableExercises.find(
            ex => ex.id === action.payload
          )
        }
      };
    case STOP_TRAINING:
      return {
        ...state,
        activeTraining: null
      };
    default: {
      return state;
    }
  }
}
export const getTrainingState = createFeatureSelector<TrainingState>('training');

export const getAvailableTrainings = createSelector(getTrainingState, (state: TrainingState) => state.availableExercises);
export const getFinishedTrainings = createSelector(getTrainingState, (state: TrainingState) => state.finishedExercises);
export const getActiveTraining = createSelector(getTrainingState, (state: TrainingState) => state.activeTraining);
export const getIsTraining = createSelector(getTrainingState, (state: TrainingState) => state.activeTraining !== null);

