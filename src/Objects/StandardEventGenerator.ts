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
          const offset = slider.path.positionAt(event.progress);

          yield new SliderTick({
            spanIndex: event.spanIndex,
            spanStartTime: event.spanStartTime,
            startTime: event.startTime,
            startPosition: slider.startPosition.add(offset),
            stackHeight: slider.stackHeight,
            scale: slider.scale,
          });

          break;
        }
        case SliderEventType.Head: {
          yield new SliderHead({
            startTime: event.startTime,
            startPosition: slider.startPosition,
            stackHeight: slider.stackHeight,
          });

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
          yield new SliderTail(slider, {
            repeatIndex: event.spanIndex,
            startTime: event.startTime,
            startPosition: slider.endPosition,
            stackHeight: slider.stackHeight,
          });

          break;
        }
        case SliderEventType.Repeat: {
          const offset = slider.path.positionAt(event.progress);

          yield new SliderRepeat(slider, {
            repeatIndex: event.spanIndex,
            startTime: event.startTime,
            startPosition: slider.startPosition.add(offset),
            stackHeight: slider.stackHeight,
            scale: slider.scale,
          });

          break;
        }
      }
    }
  }

  static *generateSpinnerTicks(spinner: Spinner): Generator<StandardHitObject> {
    const totalSpins = spinner.maximumBonusSpins + spinner.spinsRequired;

    for (let i = 0; i < totalSpins; ++i) {
      const startTime = spinner.startTime + (i + 1 / totalSpins) * spinner.duration;

      yield i < spinner.spinsRequired
        ? new SpinnerTick({ startTime })
        : new SpinnerBonusTick({ startTime });
    }
  }
}
