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
  IHasGenerateTicks,
  IHasPathWithRepeats,
  IHasPosition,
  IHasSliderVelocity,
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
      startTime: original.startTime,
      samples: original.samples,
      startPosition: positionData?.startPosition,
      isNewCombo: comboData?.isNewCombo,
      comboOffset: comboData?.comboOffset,
      hitType: original.hitType,
      hitSound: original.hitSound,
    });
  }

  private _convertSlider(
    original: IHitObject & IHasPathWithRepeats,
    beatmap: IBeatmap,
  ): Slider {
    const positionData = original as IHitObject & IHasPathWithRepeats & IHasPosition;
    const comboData = original as IHitObject & IHasPathWithRepeats & IHasCombo;
    const generateTicksData = original as IHitObject & IHasPathWithRepeats & IHasGenerateTicks;
    const sliderVelocityData = original as IHitObject & IHasPathWithRepeats & IHasSliderVelocity;

    const converted = new Slider({
      startTime: original.startTime,
      samples: original.samples,
      path: original.path,
      nodeSamples: original.nodeSamples,
      repeats: original.repeats,
      startPosition: positionData?.startPosition,
      isNewCombo: comboData?.isNewCombo,
      comboOffset: comboData?.comboOffset,
      generateTicks: generateTicksData?.generateTicks,
      sliderVelocity: sliderVelocityData?.sliderVelocity,
      hitType: original.hitType,
      hitSound: original.hitSound,
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
      startTime: original.startTime,
      samples: original.samples,
      endTime: original.endTime,
      startPosition: positionData?.startPosition,
      isNewCombo: comboData?.isNewCombo,
      comboOffset: comboData?.comboOffset,
      hitType: original.hitType,
      hitSound: original.hitSound,
    });
  }

  createBeatmap(): StandardBeatmap {
    return new StandardBeatmap();
  }
}
