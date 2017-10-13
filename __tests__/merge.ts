/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

///<reference path='../resources/jest.d.ts'/>

import { fromJS, is, List, Map, Set } from '../';

describe('merge', () => {
  it('merges two maps', () => {
    const m1 = Map({a: 1, b: 2, c: 3});
    const m2 = Map({d: 10, b: 20, e: 30});
    expect(m1.merge(m2)).toEqual(Map({a: 1, b: 20, c: 3, d: 10, e: 30}));
  });

  it('can merge in an explicitly undefined value', () => {
    const m1 = Map({a: 1, b: 2});
    const m2 = Map({a: undefined as any});
    expect(m1.merge(m2)).toEqual(Map({a: undefined, b: 2}));
  });

  it('merges two maps with a merge function', () => {
    const m1 = Map({a: 1, b: 2, c: 3});
    const m2 = Map({d: 10, b: 20, e: 30});
    expect(m1.mergeWith((a, b) => a + b, m2)).toEqual(Map({a: 1, b: 22, c: 3, d: 10, e: 30}));
  });

  it('provides key as the third argument of merge function', () => {
    const m1 = Map({id: 'temp',  b: 2,  c: 3});
    const m2 = Map({id: 10,  b: 20, e: 30});
    const add = (a, b) => a + b;
    expect(
      m1.mergeWith((a, b, key) => key !== 'id' ? add(a, b) : b, m2),
    ).toEqual(Map({id: 10, b: 22, c: 3, e: 30}));
  });

  it('deep merges two maps', () => {
    const m1 = fromJS({a: {b: {c: 1, d: 2}}});
    const m2 = fromJS({a: {b: {c: 10, e: 20}, f: 30}, g: 40});
    expect(m1.mergeDeep(m2)).toEqual(fromJS({a: {b: {c: 10, d: 2, e: 20}, f: 30}, g: 40}));
  });

  it('deep merge uses is() for return-self optimization', () =>  {
    const date1 = new Date(1234567890000);
    const date2 = new Date(1234567890000);
    const m = Map().setIn(['a', 'b', 'c'], date1);
    const m2 = m.mergeDeep({a: {b: {c: date2 }}});
    expect(m2 === m).toBe(true);
  });

  it('deep merges raw JS', () => {
    const m1 = fromJS({a: {b: {c: 1, d: 2}}});
    const js = {a: {b: {c: 10, e: 20}, f: 30}, g: 40};
    expect(m1.mergeDeep(js)).toEqual(fromJS({a: {b: {c: 10, d: 2, e: 20}, f: 30}, g: 40}));
  });

  it('deep merges raw JS with a merge function', () => {
    const m1 = fromJS({a: {b: {c: 1, d: 2}}});
    const js = {a: {b: {c: 10, e: 20}, f: 30}, g: 40};
    expect(
      m1.mergeDeepWith((a, b) => a + b, js),
    ).toEqual(fromJS(
      {a: {b: {c: 11, d: 2, e: 20}, f: 30}, g: 40},
    ));
  });

  it('returns self when a deep merges is a no-op', () => {
    const m1 = fromJS({a: {b: {c: 1, d: 2}}});
    expect(
      m1.mergeDeep({a: {b: {c: 1}}}),
    ).toBe(m1);
  });

  it('returns arg when a deep merges is a no-op', () => {
    const m1 = fromJS({a: {b: {c: 1, d: 2}}});
    expect(
      Map().mergeDeep(m1),
    ).toBe(m1);
  });

  it('can overwrite existing maps', () => {
    expect(
      fromJS({ a: { x: 1, y: 1 }, b: { x: 2, y: 2 } })
        .merge({ a: null, b: Map({ x: 10 }) })
        .toJS(),
    ).toEqual(
      { a: null, b: { x: 10 } },
    );
    expect(
      fromJS({ a: { x: 1, y: 1 }, b: { x: 2, y: 2 } })
        .mergeDeep({ a: null, b: { x: 10 } })
        .toJS(),
    ).toEqual(
      { a: null, b: { x: 10, y: 2 } },
    );
  });

  it('can overwrite existing maps with objects', () => {
    const m1 = fromJS({ a: { x: 1, y: 1 } }); // deep conversion.
    const m2 = Map({ a: { z: 10 } }); // shallow conversion to Map.

    // Raw object simply replaces map.
    expect(m1.merge(m2).get('a')).toEqual({z: 10}); // raw object.
    // However, mergeDeep will merge that value into the inner Map.
    expect(m1.mergeDeep(m2).get('a')).toEqual(Map({x: 1, y: 1, z: 10}));
  });

  it('merges map entries with List and Set values', () => {
    const initial = Map({a: Map({x: 10, y: 20}), b: List([1, 2, 3]), c: Set([1, 2, 3])});
    const additions = Map({a: Map({y: 50, z: 100}), b: List([4, 5, 6]), c: Set([4, 5, 6])});
    expect(initial.mergeDeep(additions)).toEqual(
      Map({a: Map({x: 10, y: 50, z: 100}), b: List([1, 2, 3, 4, 5, 6]), c: Set([1, 2, 3, 4, 5, 6])}),
    );
  });

  it('merges map entries with new values', () => {
    const initial = Map({a: List([1])});

    // Note: merge and mergeDeep do not deeply coerce values, they only merge
    // with what's there prior.
    expect(
      initial.merge({b: [2]} as any),
    ).toEqual(
      Map({a: List([1]), b: [2]}),
    );
    expect(
      initial.mergeDeep({b: [2]} as any),
    ).toEqual(fromJS(
      Map({a: List([1]), b: [2]}),
    ));
  });

  it('maintains JS values inside immutable collections', () => {
    const m1 = fromJS({a: {b: {imm: 'map'}}});
    const m2 = m1.mergeDeep(
      Map({a: Map({b: {plain: 'obj'} })}),
    );

    expect(m1.getIn(['a', 'b'])).toEqual(Map([['imm', 'map']]));
    // However mergeDeep will merge that value into the inner Map
    expect(m2.getIn(['a', 'b'])).toEqual(Map({imm: 'map', plain: 'obj'}));
  });

});
