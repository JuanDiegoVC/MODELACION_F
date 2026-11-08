import { QueueModelType, QueueParameters } from '../entities/QueueParameters';
import { QueueCalculationResult } from '../entities/QueueResults';
import { MM1Calculator } from './MM1Calculator';
import { MMSCalculator } from './MMSCalculator';
import { IQueueCalculator } from './QueueCalculatorCommon';

export class QueueCalculatorFactory {
  private static readonly mm1 = new MM1Calculator();
  private static readonly mms = new MMSCalculator();

  public static getCalculator(model: QueueModelType): IQueueCalculator {
    return model === 'MM1' ? this.mm1 : this.mms;
  }

  public static calculate(params: QueueParameters): QueueCalculationResult {
    // Even for MM1, we can attach the MMS sensitivity series so HU-11 chart always has data
    const calc = this.getCalculator(params.model);
    const result = calc.calculate(params);
    if (params.model === 'MM1' && result.sensitivitySeries.length === 0) {
      const mmsResult = this.mms.calculate({ ...params, model: 'MMS', servers: result.minStableServers }, true);
      result.sensitivitySeries = mmsResult.sensitivitySeries;
    }
    return result;
  }
}

