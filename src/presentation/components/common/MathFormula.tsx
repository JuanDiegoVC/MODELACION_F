import React from 'react';
import { IndicatorKey } from '../../../domain/entities/QueueParameters';
import { QueueModelType } from '../../../domain/entities/QueueParameters';

interface MathFormulaProps {
  indicator: IndicatorKey;
  model: QueueModelType;
  servers?: number;
  targetN?: number;
}

/**
 * Renders true typographic mathematical equations (HU-10.2):
 * Real stacked fractions, superscripts, subscripts, factorials and summation symbol (Σ),
 * without plain-text `lambda^2/(mu*(mu-lambda))`.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  indicator,
  model,
  servers = 1,
  targetN = 5,
}) => {
  const isMM1 = model === 'MM1';

  const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode }> = ({ num, den }) => (
    <span className="inline-flex flex-col items-center align-middle mx-1 text-center leading-tight">
      <span className="border-b border-slate-700 px-1.5 pb-0.5">{num}</span>
      <span className="px-1.5 pt-0.5">{den}</span>
    </span>
  );

  if (isMM1) {
    switch (indicator) {
      case 'rho':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>ρ</i> <span>=</span> <Frac num={<i>λ</i>} den={<i>μ</i>} />
          </div>
        );
      case 'P0':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>P</i><sub>0</sub> <span>= 1 −</span> <i>ρ</i> <span>= 1 −</span>{' '}
            <Frac num={<i>λ</i>} den={<i>μ</i>} />
          </div>
        );
      case 'Lq':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>L</i><sub>q</sub> <span>=</span>{' '}
            <Frac
              num={
                <span>
                  <i>λ</i><sup>2</sup>
                </span>
              }
              den={
                <span>
                  <i>μ</i>(<i>μ</i> − <i>λ</i>)
                </span>
              }
            />
          </div>
        );
      case 'L':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>L</i> <span>=</span>{' '}
            <Frac
              num={<i>λ</i>}
              den={
                <span>
                  <i>μ</i> − <i>λ</i>
                </span>
              }
            />{' '}
            <span>=</span> <i>L</i><sub>q</sub> + <Frac num={<i>λ</i>} den={<i>μ</i>} />
          </div>
        );
      case 'Wq':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>W</i><sub>q</sub> <span>=</span>{' '}
            <Frac
              num={<i>λ</i>}
              den={
                <span>
                  <i>μ</i>(<i>μ</i> − <i>λ</i>)
                </span>
              }
            />{' '}
            <span>=</span> <Frac num={<span><i>L</i><sub>q</sub></span>} den={<i>λ</i>} />
          </div>
        );
      case 'W':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>W</i> <span>=</span>{' '}
            <Frac
              num={<span>1</span>}
              den={
                <span>
                  <i>μ</i> − <i>λ</i>
                </span>
              }
            />{' '}
            <span>=</span> <i>W</i><sub>q</sub> + <Frac num={<span>1</span>} den={<i>μ</i>} />
          </div>
        );
      case 'Pw':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>P</i><sub>w</sub> <span>= P(N ≥ 1) =</span> <i>ρ</i> <span>=</span>{' '}
            <Frac num={<i>λ</i>} den={<i>μ</i>} />
          </div>
        );
      case 'Pn':
        return (
          <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
            <i>P</i><sub>n</sub> <span>= (1 − <i>ρ</i>) · <i>ρ</i><sup>n</sup></span>
          </div>
        );
    }
  }

  // M/M/S Equations
  switch (indicator) {
    case 'rho':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>ρ</i> <span>=</span>{' '}
          <Frac
            num={<i>λ</i>}
            den={
              <span>
                <i>s</i> · <i>μ</i>
              </span>
            }
          />
        </div>
      );
    case 'P0':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>P</i><sub>0</sub> <span>=</span>
          <Frac
            num={<span>1</span>}
            den={
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex flex-col items-center text-xs leading-none mx-0.5">
                  <span><i>s</i>−1</span>
                  <span className="text-xl font-normal">∑</span>
                  <span><i>k</i>=0</span>
                </span>
                <Frac
                  num={
                    <span>
                      (<i>λ</i>/<i>μ</i>)<sup><i>k</i></sup>
                    </span>
                  }
                  den={<span><i>k</i>!</span>}
                />
                <span>+</span>
                <Frac
                  num={
                    <span>
                      (<i>λ</i>/<i>μ</i>)<sup><i>s</i></sup>
                    </span>
                  }
                  den={
                    <span>
                      <i>s</i>! · (1 − <i>ρ</i>)
                    </span>
                  }
                />
              </span>
            }
          />
        </div>
      );
    case 'Pw':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>P</i><sub>w</sub> <span>= P(N ≥ <i>s</i>) =</span>
          <Frac
            num={
              <span>
                (<i>λ</i>/<i>μ</i>)<sup><i>s</i></sup>
              </span>
            }
            den={
              <span>
                <i>s</i>! · (1 − <i>ρ</i>)
              </span>
            }
          />
          <span>· <i>P</i><sub>0</sub></span>
        </div>
      );
    case 'Lq':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>L</i><sub>q</sub> <span>=</span>
          <Frac
            num={
              <span>
                <i>P</i><sub>0</sub> · (<i>λ</i>/<i>μ</i>)<sup><i>s</i></sup> · <i>ρ</i>
              </span>
            }
            den={
              <span>
                <i>s</i>! · (1 − <i>ρ</i>)<sup>2</sup>
              </span>
            }
          />
        </div>
      );
    case 'L':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>L</i> <span>=</span> <i>L</i><sub>q</sub> <span>+</span>{' '}
          <Frac num={<i>λ</i>} den={<i>μ</i>} />
        </div>
      );
    case 'Wq':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>W</i><sub>q</sub> <span>=</span>{' '}
          <Frac num={<span><i>L</i><sub>q</sub></span>} den={<i>λ</i>} />
        </div>
      );
    case 'W':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>W</i> <span>=</span> <i>W</i><sub>q</sub> <span>+</span>{' '}
          <Frac num={<span>1</span>} den={<i>μ</i>} /> <span>=</span>{' '}
          <Frac num={<i>L</i>} den={<i>λ</i>} />
        </div>
      );
    case 'Pn':
      return (
        <div className="font-serif text-base sm:text-lg text-slate-900 flex items-center flex-wrap gap-1">
          <i>P</i><sub>n</sub> <span>=</span>
          {targetN < servers ? (
            <>
              <Frac
                num={
                  <span>
                    (<i>λ</i>/<i>μ</i>)<sup><i>n</i></sup>
                  </span>
                }
                den={<span><i>n</i>!</span>}
              />
              <span>· <i>P</i><sub>0</sub> <span className="text-xs text-slate-600">(para n &lt; s)</span></span>
            </>
          ) : (
            <>
              <Frac
                num={
                  <span>
                    (<i>λ</i>/<i>μ</i>)<sup><i>n</i></sup>
                  </span>
                }
                den={
                  <span>
                    <i>s</i>! · <i>s</i><sup><i>n</i>−<i>s</i></sup>
                  </span>
                }
              />
              <span>· <i>P</i><sub>0</sub> <span className="text-xs text-slate-600">(para n ≥ s)</span></span>
            </>
          )}
        </div>
      );
  }
};

