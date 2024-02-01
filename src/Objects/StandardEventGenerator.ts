import {
  EventGenerator,
  SliderEventType,
} from 'osu-classes';

import { StandardHitObject } from './StandardHitObject';
import { Slider } from './Slider';
import { SliderHead } from './SliderHead';
import { SliderTick } from './SliderTick';
import { SliderRepeat } from './SliderRepeat';
import { SliderTail } from './SliderTail';
import { Spinner } from './Spinner';
import { SpinnerTick } from './SpinnerTick';
import { SpinnerBonusTick } from './SpinnerBonusTick';

// TODO: This inheritance should be removed.
export class StandardEventGenerator extends EventGenerator {
  static *generateSliderTicks(slider: Slider): Generator<StandardHitObject> {
    for (const event of EventGenerator.generate(slider)) {
      switch (event.eventType) {
        case SliderEventType.Tick: {
          const tick = new SliderTick();
          const offset = slider.path.positionAt(event.progress);

          tick.spanIndex = event.spanIndex;
          tick.spanStartTime = event.spanStartTime;
          tick.startTime = event.startTime;
          tick.startPosition = slider.startPosition.add(offset);
          tick.stackHeight = slider.stackHeight;
          tick.scale = slider.scale;

          yield tick;

          break;
        }
        case SliderEventType.Head: {
          const head = new SliderHead();

          head.startTime = event.startTime;
          head.startPosition = slider.startPosition;
          head.stackHeight = slider.stackHeight;

          yield head;

          break;
        }
        // TODO: Remove legacy last tick.
        case SliderEventType.LegacyLastTick: {
          /**
           * We need to use the LegacyLastTick here 
           * for compatibility reasons (difficulty).
           * it is *okay* to use this because the TailCircle 
           * is not used for any meaningful purpose in gameplay.
           * if this is to change, we should revisit this.
           */
          const tail = new SliderTail(slider);

          tail.repeatIndex = event.spanIndex;
          tail.startTime = event.startTime;
          tail.startPosition = slider.endPosition;
          tail.stackHeight = slider.stackHeight;

          yield tail;

          break;
        }
        case SliderEventType.Repeat: {
          const repeat = new SliderRepeat(slider);
          const offset = slider.path.positionAt(event.progress);

          repeat.repeatIndex = event.spanIndex;
          repeat.startTime = event.startTime;
          repeat.startPosition = slider.startPosition.add(offset);
          repeat.stackHeight = slider.stackHeight;
          repeat.scale = slider.scale;

          yield repeat;

          break;
        }
      }
    }
  }

  static *generateSpinnerTicks(spinner: Spinner): Generator<StandardHitObject> {
    const totalSpins = spinner.maximumBonusSpins + spinner.spinsRequired;

    for (let i = 0; i < totalSpins; ++i) {
      const tick = i < spinner.spinsRequired
        ? new SpinnerTick()
        : new SpinnerBonusTick();

      tick.startTime = spinner.startTime + (i + 1 / totalSpins) * spinner.duration;

      yield tick;
    }
  }
}
