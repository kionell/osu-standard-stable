import { StandardBeatmap } from './StandardBeatmap';
import { StandardHitObject } from '../Objects/StandardHitObject';
import { Circle } from '../Objects/Circle';
import { Slider } from '../Objects/Slider';
import { Spinner } from '../Objects/Spinner';

import {
  BeatmapConverter,
  IBeatmap,
  IHasCombo,
  IHasDuration,
  IHasPathWithRepeats,
  IHasPosition,
  IHitObject,
} from 'osu-classes';

export class StandardBeatmapConverter extends BeatmapConverter {
  canConvert(beatmap: IBeatmap): boolean {
    return beatmap.hitObjects.every((h) => {
      return (h as IHitObject & IHasPosition).startPosition;
    });
  }

  *convertHitObjects(beatmap: IBeatmap): Generator<StandardHitObject> {
    const hitObjects = beatmap.hitObjects;

    for (const hitObject of hitObjects) {
      if (hitObject instanceof StandardHitObject) {
        yield hitObject.clone();
        continue;
      }

      yield this._convertHitObject(hitObject, beatmap);
    }
  }

  private _convertHitObject(original: IHitObject, beatmap: IBeatmap) {
    const pathData = original as IHitObject & IHasPathWithRepeats;
    const durationData = original as IHitObject & IHasDuration;

    if (pathData.path) {
      return this._convertSlider(pathData, beatmap);
    }

    if (typeof durationData.endTime === 'number') {
      return this._convertSpinner(durationData);
    }

    return this._convertCircle(original);
  }

  private _convertCircle(original: IHitObject): Circle {
    const positionData = original as IHitObject & IHasPosition;
    const comboData = original as IHitObject & IHasCombo;

    return new Circle({
      startPosition: positionData?.startPosition,
      startTime: original.startTime,
      hitType: original.hitType,
      hitSound: original.hitSound,
      samples: original.samples,
      comboOffset: comboData?.comboOffset,
      isNewCombo: comboData?.isNewCombo,
    });
  }

  private _convertSlider(
    original: IHitObject & IHasPathWithRepeats,
    beatmap: IBeatmap,
  ): Slider {
    const positionData = original as IHitObject & IHasPathWithRepeats & IHasPosition;
    const comboData = original as IHitObject & IHasPathWithRepeats & IHasCombo;

    const converted = new Slider({
      repeats: original.repeats,
      nodeSamples: original.nodeSamples,
      path: original.path,
      startPosition: positionData?.startPosition,
      startTime: original.startTime,
      hitType: original.hitType,
      hitSound: original.hitSound,
      samples: original.samples,
      comboOffset: comboData?.comboOffset,
      isNewCombo: comboData?.isNewCombo,
    });

    /**
     * Prior to v8, speed multipliers don't adjust for how many
     * ticks are generated over the same distance.
     * This results in more (or less) ticks being generated
     * in <v8 maps for the same time duration.
     */
    if (beatmap.fileFormat < 8) {
      const diffPoint = beatmap.controlPoints.difficultyPointAt(original.startTime);

      converted.tickDistanceMultiplier = Math.fround(1 / diffPoint.sliderVelocity);
    }

    return converted;
  }

  private _convertSpinner(original: IHitObject & IHasDuration): Spinner {
    const positionData = original as IHitObject & IHasDuration & IHasPosition;
    const comboData = original as IHitObject & IHasDuration & IHasCombo;

    return new Spinner({
      endTime: original.endTime,
      startPosition: positionData?.startPosition,
      startTime: original.startTime,
      hitType: original.hitType,
      hitSound: original.hitSound,
      samples: original.samples,
      comboOffset: comboData?.comboOffset,
      isNewCombo: comboData?.isNewCombo,
    });
  }

  createBeatmap(): StandardBeatmap {
    return new StandardBeatmap();
  }
}
